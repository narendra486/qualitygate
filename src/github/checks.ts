import * as github from '@actions/github';
import { Finding, QualityGateResult } from '../types/sarif';
import { RetryHandler } from '../utils/retry';
import { ErrorReporter, QualityGateIssues } from '../utils/errors';

export class ChecksHandler {
    private readonly octokit: ReturnType<typeof github.getOctokit>;
    private readonly context = github.context;

    constructor(githubToken: string) {
        this.octokit = github.getOctokit(githubToken);
    }

    async create(result: QualityGateResult, findings: Finding[]): Promise<void> {
        try {
            const { owner, repo } = this.context.repo;
            await RetryHandler.execute(
                () =>
                    this.octokit.rest.checks.create({
                        owner,
                        repo,
                        name: 'QualityGate',
                        head_sha: this.context.payload.pull_request?.head.sha || this.context.sha,
                        status: 'completed',
                        conclusion: result.passed ? 'success' : 'failure',
                        output: {
                            title: result.passed ? 'Quality Gate Passed' : 'Quality Gate Failed',
                            summary: this.summary(result),
                            annotations: this.annotations(findings.slice(0, 50)),
                        },
                    }),
                { maxAttempts: 3, delayMs: 750 }
            );
        } catch (error) {
            ErrorReporter.warning(
                QualityGateIssues.githubIntegrationWarning(
                    `Unable to create check run: ${error instanceof Error ? error.message : String(error)}`
                )
            );
        }
    }

    private summary(result: QualityGateResult): string {
        return [
            `Status: ${result.passed ? 'PASS' : 'FAIL'}`,
            `Threshold: ${result.threshold}`,
            `Critical: ${result.counts.critical}`,
            `High: ${result.counts.high}`,
            `Medium: ${result.counts.medium}`,
            `Low: ${result.counts.low}`,
        ].join('\n');
    }

    private annotations(findings: Finding[]) {
        return findings
            .filter(finding => finding.file !== 'unknown')
            .map(finding => ({
                path: finding.file,
                start_line: finding.line,
                end_line: finding.endLine || finding.line,
                annotation_level: this.checkAnnotationLevel(finding.severity),
                message: finding.message.slice(0, 64000),
                title: `${finding.ruleId} (${finding.tool})`.slice(0, 255),
            }));
    }

    private checkAnnotationLevel(severity: Finding['severity']): 'warning' | 'failure' | 'notice' {
        if (severity === 'critical' || severity === 'high') return 'failure';
        if (severity === 'medium') return 'warning';
        return 'notice';
    }
}
