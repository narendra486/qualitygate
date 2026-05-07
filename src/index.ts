import * as core from '@actions/core';
import * as github from '@actions/github';
import { SarifParser } from './parser/sarifParser';
import { QualityGateEvaluator } from './quality/evaluator';
import { DeduplicationEngine } from './quality/dedupe';
import { PrCommentHandler } from './github/prComment';
import { StepSummaryHandler } from './github/summary';
import { AnnotationsHandler, ChecksHandler } from './github/annotations';
import { FileHandler } from './utils/file';
import { Logger } from './utils/logger';
import { RetryHandler } from './utils/retry';
import { SarifLog, Finding } from './types/sarif';

async function run(): Promise<void> {
    const startTime = Date.now();

    try {
        // Get inputs
        const sarifFileInput = core.getInput('sarif_file', { required: true });
        const severityThreshold = core.getInput('severity_threshold', { required: true }) as
            | 'low'
            | 'medium'
            | 'high'
            | 'critical';
        const githubToken = core.getInput('github_token', { required: true });
        const failOnCount = core.getInput('fail_on_count');
        const prCommentEnabled = core.getInput('pr_comment') === 'true';
        const deduplicateEnabled = core.getInput('deduplicate') === 'true';
        const ignoreRuleIdsInput = core.getInput('ignore_rule_ids');
        const ignorePathsInput = core.getInput('ignore_paths');

        Logger.startGroup('Inputs');
        Logger.debug(`SARIF File(s): ${sarifFileInput}`);
        Logger.debug(`Severity Threshold: ${severityThreshold}`);
        Logger.debug(`PR Comment: ${prCommentEnabled}`);
        Logger.debug(`Deduplicate: ${deduplicateEnabled}`);
        Logger.endGroup();

        // Parse inputs
        const ignoreRuleIds = ignoreRuleIdsInput
            ? ignoreRuleIdsInput.split(',').map(id => id.trim())
            : [];
        const ignorePaths = ignorePathsInput ? ignorePathsInput.split(',').map(p => p.trim()) : [];
        const failOnCountNum = failOnCount ? parseInt(failOnCount, 10) : undefined;

        // Resolve SARIF files
        Logger.startGroup('Resolving SARIF Files');
        const sarifFiles = await resolveSarifFiles(sarifFileInput);
        Logger.info(`Found ${sarifFiles.length} SARIF file(s)`);
        Logger.endGroup();

        if (sarifFiles.length === 0) {
            core.setFailed('No SARIF files found');
            return;
        }

        // Parse SARIF files
        Logger.startGroup('Parsing SARIF Files');
        let allFindings: Finding[] = [];
        for (const sarifFile of sarifFiles) {
            const findings = await parseSarifFile(sarifFile);
            Logger.info(`Parsed ${findings.length} findings from ${sarifFile}`);
            allFindings = allFindings.concat(findings);
        }
        Logger.endGroup();

        // Filter by ignore rules and paths
        Logger.startGroup('Filtering Findings');
        let findings = filterFindings(allFindings, ignoreRuleIds, ignorePaths);
        Logger.info(`${findings.length} finding(s) after filtering`);
        Logger.endGroup();

        // Deduplicate if enabled
        if (deduplicateEnabled && findings.length > 0) {
            Logger.startGroup('Deduplicating Findings');
            const deduplicator = new DeduplicationEngine();
            findings = deduplicator.deduplicate(findings);
            Logger.endGroup();
        }

        // Evaluate quality gate
        const evaluator = new QualityGateEvaluator();
        const result = evaluator.evaluate(findings, severityThreshold, failOnCountNum);

        // Set outputs
        core.setOutput('total_findings', result.counts.total.toString());
        core.setOutput('critical_count', result.counts.critical.toString());
        core.setOutput('high_count', result.counts.high.toString());
        core.setOutput('medium_count', result.counts.medium.toString());
        core.setOutput('low_count', result.counts.low.toString());
        core.setOutput('quality_gate_status', result.passed ? 'PASS' : 'FAIL');

        // Post PR comment if enabled
        if (prCommentEnabled) {
            Logger.startGroup('Posting PR Comment');
            const prHandler = new PrCommentHandler(githubToken);
            const commented = await RetryHandler.execute(
                () => prHandler.post(result.counts, findings, result.passed, severityThreshold),
                { maxAttempts: 3, delayMs: 1000 }
            );
            if (commented) {
                Logger.info('PR comment posted successfully');
            }
            Logger.endGroup();
        }

        // Create annotations
        if (findings.length > 0) {
            Logger.startGroup('Creating Annotations');
            const annotationsHandler = new AnnotationsHandler();
            annotationsHandler.createAnnotations(findings);
            Logger.endGroup();
        }

        // Write step summary
        Logger.startGroup('Writing Step Summary');
        const summaryHandler = new StepSummaryHandler();
        const duration = Date.now() - startTime;
        await summaryHandler.write(result.counts, findings, result.passed, severityThreshold, duration);
        Logger.endGroup();

        // Check if we should fail the workflow
        if (!result.passed) {
            const summary = evaluator.generateSummary(result);
            Logger.error(summary);
            core.setFailed(`Quality gate failed: ${summary}`);
            process.exitCode = 1;
            return;
        } else {
            Logger.info('Quality gate passed');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Logger.error(errorMessage);
        core.setFailed(`Action failed: ${errorMessage}`);
        process.exit(1);
    }
}

async function resolveSarifFiles(input: string): Promise<string[]> {
    const files: string[] = [];

    // Handle multiline input
    const patterns = input
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    for (const pattern of patterns) {
        // Check if it's a glob pattern
        if (pattern.includes('*') || pattern.includes('?')) {
            const globFiles = await FileHandler.expandGlob(pattern);
            files.push(...globFiles);
        } else {
            // Direct file path or directory path
            const resolvedPaths = FileHandler.resolvePaths([pattern]);
            if (resolvedPaths.length > 0) {
                const matchedFiles = await FileHandler.collectSarifFilesFromPath(resolvedPaths[0]);
                files.push(...matchedFiles);
            }
        }
    }

    return [...new Set(files)]; // Remove duplicates
}

async function parseSarifFile(filePath: string): Promise<Finding[]> {
    const content = FileHandler.readFile(filePath);
    const sarifData = FileHandler.parseJson(content, filePath) as SarifLog;
    const parser = new SarifParser();
    return parser.parse(sarifData);
}

function filterFindings(
    findings: Finding[],
    ignoreRuleIds: string[],
    ignorePaths: string[]
): Finding[] {
    return findings.filter(finding => {
        if (ignoreRuleIds.includes(finding.ruleId)) {
            Logger.debug(`Ignored finding: ${finding.ruleId}`);
            return false;
        }

        if (ignorePaths.some(pattern => FileHandler.shouldIgnore(finding.file, [pattern]))) {
            Logger.debug(`Ignored finding in path: ${finding.file}`);
            return false;
        }

        return true;
    });
}

// Run the action
run();