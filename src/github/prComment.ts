import * as core from '@actions/core';
import * as github from '@actions/github';
import { Finding, SeverityCounts } from '../types/sarif';
import { MarkdownFormatter } from '../formatters/markdown';

export class PrCommentHandler {
    private octokit: ReturnType<typeof github.getOctokit>;
    private context = github.context;

    constructor(githubToken: string) {
        this.octokit = github.getOctokit(githubToken);
    }

    async post(
        counts: SeverityCounts,
        findings: Finding[],
        passed: boolean,
        threshold: string
    ): Promise<boolean> {
        if (this.context.eventName !== 'pull_request') {
            core.info('Not a pull request event, skipping PR comment');
            return false;
        }

        const prNumber = this.context.payload.pull_request?.number;
        if (!prNumber) {
            core.warning('Could not determine PR number');
            return false;
        }

        const { owner, repo } = this.context.repo;

        try {
            const formatter = new MarkdownFormatter();
            const body = formatter.formatPrComment(counts, findings, passed, threshold);

            // Check for existing comment
            const comments = await this.listComments(owner, repo, prNumber);
            const existingComment = comments.find(c => c.body?.includes('# Quality Gate'));

            if (existingComment) {
                await this.octokit.rest.issues.updateComment({
                    owner,
                    repo,
                    comment_id: existingComment.id,
                    body,
                });
                core.info(`Updated existing PR comment (ID: ${existingComment.id})`);
            } else {
                await this.octokit.rest.issues.createComment({
                    owner,
                    repo,
                    issue_number: prNumber,
                    body,
                });
                core.info('Created new PR comment');
            }

            return true;
        } catch (error) {
            core.warning(`Failed to post PR comment: ${error}`);
            return false;
        }
    }

    private async listComments(owner: string, repo: string, prNumber: number) {
        try {
            const response = await this.octokit.paginate(this.octokit.rest.issues.listComments, {
                owner,
                repo,
                issue_number: prNumber,
            });
            return response;
        } catch (error) {
            core.warning(`Failed to list comments: ${error}`);
            return [];
        }
    }
}