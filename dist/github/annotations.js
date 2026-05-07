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
exports.ChecksHandler = exports.AnnotationsHandler = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
class AnnotationsHandler {
    /**
     * Creates GitHub annotations for findings
     * Limited to 50 per step due to GitHub API constraints
     */
    createAnnotations(findings) {
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
            core.warning(`Only ${maxAnnotations} of ${findings.length} findings annotated (GitHub limit)`);
        }
    }
    mapSeverityToAnnotationLevel(severity) {
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
exports.AnnotationsHandler = AnnotationsHandler;
class ChecksHandler {
    octokit;
    context = github.context;
    constructor(githubToken) {
        this.octokit = github.getOctokit(githubToken);
    }
    async createCheckRun(title, counts, passed, findings) {
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
        }
        catch (error) {
            core.debug(`Failed to create check run: ${error}`);
        }
    }
    formatCheckSummary(counts, passed) {
        return `${passed ? '✅' : '❌'} Quality Gate Results

Critical: ${counts.critical || 0}
High: ${counts.high || 0}
Medium: ${counts.medium || 0}
Low: ${counts.low || 0}`;
    }
    formatAnnotations(findings) {
        return findings.map(f => ({
            path: f.file,
            start_line: f.line,
            end_line: f.line,
            annotation_level: this.mapLevel(f.severity),
            message: f.message,
            title: f.ruleId,
        }));
    }
    mapLevel(severity) {
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
exports.ChecksHandler = ChecksHandler;
