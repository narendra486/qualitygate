import * as core from '@actions/core';
import { readInputs } from './config/inputs';
import { SarifAggregator } from './parser/aggregator';
import { DeduplicationEngine } from './quality/dedupe';
import { QualityGateEvaluator } from './quality/evaluator';
import { PrCommentHandler } from './github/prComment';
import { StepSummaryHandler } from './github/summary';
import { AnnotationsHandler } from './github/annotations';
import { ChecksHandler } from './github/checks';
import { MarkdownContext, MarkdownFormatter } from './formatters/markdown';
import { resolveSarifFiles } from './utils/glob';
import { FileHandler } from './utils/file';
import { Logger } from './utils/logger';
import { RetryHandler } from './utils/retry';
import { Finding } from './types/sarif';
import { ErrorReporter, QualityGateError, QualityGateIssues } from './utils/errors';

async function run(): Promise<void> {
    const startTime = Date.now();

    try {
        const config = readInputs();
        Logger.startGroup('QualityGate configuration');
        Logger.info(`severity_threshold=${config.severityThreshold}`);
        Logger.info(`mode=${config.mode}`);
        Logger.info(`deduplicate=${config.deduplicate}`);
        Logger.info(`pr_comment=${config.prComment}`);
        Logger.info(`enable_annotations=${config.enableAnnotations}`);
        Logger.info(`enable_step_summary=${config.enableStepSummary}`);
        Logger.info(`max_findings_display=${config.maxFindingsDisplay}`);
        Logger.endGroup();

        const sarifFiles = await resolveSarifFiles(config.sarifFile);
        if (sarifFiles.length === 0) {
            throw new QualityGateError(QualityGateIssues.noSarifFiles('No SARIF files found from sarif_file input'));
        }

        const aggregator = new SarifAggregator();
        const aggregation = await aggregator.aggregate(sarifFiles);
        let findings = aggregation.findings;

        findings = filterFindings(findings, config.ignoreRuleIds, config.ignorePaths);
        findings = findings.filter(finding => !finding.suppressed && finding.baselineState !== 'absent');

        if (config.deduplicate) {
            findings = new DeduplicationEngine().deduplicate(findings);
        }

        const evaluator = new QualityGateEvaluator();
        const result = evaluator.evaluate(findings, config.severityThreshold, config.failOnCount);
        const durationMs = Date.now() - startTime;
        const markdownTemplate = config.markdownTemplate
            ? await FileHandler.readFile(config.markdownTemplate)
            : undefined;
        const context: MarkdownContext = {
            result,
            findings,
            metadata: aggregation.metadata,
            processedFiles: aggregation.processedFiles,
            skippedFiles: aggregation.skippedFiles,
            durationMs,
            config,
            markdownTemplate,
        };

        setOutputs(result, aggregation.processedFiles);

        if (config.enableAnnotations) {
            new AnnotationsHandler().createAnnotations(findings);
            if (config.githubToken) {
                await new ChecksHandler(config.githubToken).create(result, findings);
            }
        }

        if (config.enableStepSummary) {
            await new StepSummaryHandler().write(context);
        }

        if (config.jsonExportFile) {
            const formatter = new MarkdownFormatter();
            await FileHandler.writeJson(config.jsonExportFile, formatter.formatJson(context));
            Logger.info(`JSON report written to ${config.jsonExportFile}`);
        }

        if (config.prComment && config.githubToken) {
            await RetryHandler.execute(() => new PrCommentHandler(config.githubToken).post(context), {
                maxAttempts: 3,
                delayMs: 1000,
            });
        } else if (config.prComment) {
            ErrorReporter.warning(
                QualityGateIssues.githubIntegrationWarning(
                    'pr_comment=true but github_token was not provided; skipping PR comment'
                )
            );
        }

        if (!result.passed) {
            const message = evaluator.generateSummary(result);
            if (config.mode === 'block') {
                ErrorReporter.setFailed(QualityGateIssues.qualityGateFailed(message));
                process.exit(1);
            }
            ErrorReporter.warning(QualityGateIssues.qualityGateFailed(`Report-only mode: ${message}`));
            return;
        }

        Logger.info(evaluator.generateSummary(result));
    } catch (error) {
        const issue = ErrorReporter.fromUnknown(error);
        ErrorReporter.setFailed(issue);
        process.exit(1);
    }
}

function filterFindings(findings: Finding[], ignoreRuleIds: string[], ignorePaths: string[]): Finding[] {
    return findings.filter(finding => {
        if (ignoreRuleIds.includes(finding.ruleId)) {
            Logger.debug(`Ignored rule ${finding.ruleId}`);
            return false;
        }

        if (FileHandler.shouldIgnore(finding.file, ignorePaths)) {
            Logger.debug(`Ignored path ${finding.file}`);
            return false;
        }

        return true;
    });
}

function setOutputs(result: ReturnType<QualityGateEvaluator['evaluate']>, processedFiles: string[]): void {
    core.setOutput('total_findings', result.counts.total.toString());
    core.setOutput('critical_count', result.counts.critical.toString());
    core.setOutput('high_count', result.counts.high.toString());
    core.setOutput('medium_count', result.counts.medium.toString());
    core.setOutput('low_count', result.counts.low.toString());
    core.setOutput('quality_gate_status', result.passed ? 'PASS' : 'FAIL');
    core.setOutput('blocked', result.blocked.toString());
    core.setOutput('processed_files', processedFiles.join('\n'));
}

void run();
