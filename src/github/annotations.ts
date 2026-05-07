import * as core from '@actions/core';
import * as github from '@actions/github';
import { Finding } from '../types/sarif';

export class AnnotationsHandler {
    /**
     * Creates GitHub annotations for findings
     * Limited to 50 per step due to GitHub API constraints
     */
    createAnnotations(findings: Finding[]): void {
        // GitHub Actions supports up to 10 annotations per step in free tier
        // Pro/Team supports up to 50
        const maxAnnotations = 50;
        const annotationsToCreate = findings.slice(0, maxAnnotations);

        for (const finding of annotationsToCreate) {
            const level = this.mapSeverityToAnnotationLevel(finding.severity);
            const title = `${finding.ruleId} (${finding.tool})`;
            const message = finding.message;

            core.notice(message, {
                title,
                file: finding.file,
                startLine: finding.line,
                startColumn: finding.column,
            });
        }

        if (findings.length > maxAnnotations) {
            core.warning(
                `Only ${maxAnnotations} of ${findings.length} findings annotated (GitHub limit)`
            );
        }
    }

    private mapSeverityToAnnotationLevel(severity: string): 'notice' | 'warning' | 'error' {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
            default:
                return 'notice';
        }
    }
}

export class ChecksHandler {
    private octokit: ReturnType<typeof github.getOctokit>;
    private context = github.context;

    constructor(githubToken: string) {
        this.octokit = github.getOctokit(githubToken);
    }

    async createCheckRun(
        title: string,
        counts: Record<string, number>,
        passed: boolean,
        findings: Finding[]
    ): Promise<void> {
        try {
            const { owner, repo } = this.context.repo;
            const sha = this.context.sha;

            const summary = this.formatCheckSummary(counts, passed);
            const annotations = this.formatAnnotations(findings.slice(0, 50));

            await this.octokit.rest.checks.create({
                owner,
                repo,
                name: 'Quality Gate',
                head_sha: sha,
                status: 'completed',
                conclusion: passed ? 'success' : 'failure',
                summary,
                output: {
                    title: 'Quality Gate Results',
                    summary,
                    annotations: annotations.length > 0 ? annotations : undefined,
                },
            });

            core.info('Check run created');
        } catch (error) {
            core.debug(`Failed to create check run: ${error}`);
        }
    }

    private formatCheckSummary(counts: Record<string, number>, passed: boolean): string {
        return `${passed ? '✅' : '❌'} Quality Gate Results

Critical: ${counts.critical || 0}
High: ${counts.high || 0}
Medium: ${counts.medium || 0}
Low: ${counts.low || 0}`;
    }

    private formatAnnotations(
        findings: Finding[]
    ): Array<{
        path: string;
        start_line: number;
        end_line: number;
        annotation_level: 'warning' | 'failure' | 'notice';
        message: string;
        title?: string;
    }> {
        return findings.map(f => ({
            path: f.file,
            start_line: f.line,
            end_line: f.line,
            annotation_level: this.mapLevel(f.severity) as 'warning' | 'failure' | 'notice',
            message: f.message,
            title: f.ruleId,
        }));
    }

    private mapLevel(severity: string): string {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'failure';
            case 'medium':
                return 'warning';
            default:
                return 'notice';
        }
    }
}