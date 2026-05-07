"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrCommentHandler = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const markdown_1 = require("../formatters/markdown");
class PrCommentHandler {
    octokit;
    context = github.context;
    constructor(githubToken) {
        this.octokit = github.getOctokit(githubToken);
    }
    async post(counts, findings, passed, threshold) {
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
            const formatter = new markdown_1.MarkdownFormatter();
            const body = `${formatter.formatPrComment(counts, findings, passed, threshold)}\n\n<!-- qualitygate-action-comment -->`;
            // Check for existing comment
            const comments = await this.listComments(owner, repo, prNumber);
            const existingComments = comments.filter(c => c.body?.includes('<!-- qualitygate-action-comment -->'));
            if (existingComments.length > 0) {
                const [firstComment, ...duplicateComments] = existingComments;
                await this.octokit.rest.issues.updateComment({
                    owner,
                    repo,
                    comment_id: firstComment.id,
                    body,
                });
                core.info(`Updated existing PR comment (ID: ${firstComment.id})`);
                for (const duplicate of duplicateComments) {
                    await this.octokit.rest.issues.deleteComment({
                        owner,
                        repo,
                        comment_id: duplicate.id,
                    });
                    core.info(`Deleted duplicate PR comment (ID: ${duplicate.id})`);
                }
            }
            else {
                await this.octokit.rest.issues.createComment({
                    owner,
                    repo,
                    issue_number: prNumber,
                    body,
                });
                core.info('Created new PR comment');
            }
            return true;
        }
        catch (error) {
            core.warning(`Failed to post PR comment: ${error}`);
            return false;
        }
    }
    async listComments(owner, repo, prNumber) {
        try {
            const response = await this.octokit.paginate(this.octokit.rest.issues.listComments, {
                owner,
                repo,
                issue_number: prNumber,
            });
            return response;
        }
        catch (error) {
            core.warning(`Failed to list comments: ${error}`);
            return [];
        }
    }
}
exports.PrCommentHandler = PrCommentHandler;
