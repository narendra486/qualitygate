import * as core from '@actions/core';

export type QualityGateIssueLevel = 'error' | 'warning';

export interface QualityGateIssue {
    code: string;
    title: string;
    message: string;
    level: QualityGateIssueLevel;
}

export const QualityGateIssues = {
    invalidInput: (message: string): QualityGateIssue => ({
        code: 'QG001',
        title: 'Invalid QualityGate input',
        message,
        level: 'error',
    }),
    noSarifFiles: (message: string): QualityGateIssue => ({
        code: 'QG002',
        title: 'No SARIF files found',
        message,
        level: 'error',
    }),
    malformedSarif: (message: string): QualityGateIssue => ({
        code: 'QG003',
        title: 'Malformed SARIF skipped',
        message,
        level: 'warning',
    }),
    qualityGateFailed: (message: string): QualityGateIssue => ({
        code: 'QG004',
        title: 'Quality Gate failed',
        message,
        level: 'error',
    }),
    githubIntegrationWarning: (message: string): QualityGateIssue => ({
        code: 'QG005',
        title: 'GitHub integration warning',
        message,
        level: 'warning',
    }),
    stepSummaryWarning: (message: string): QualityGateIssue => ({
        code: 'QG006',
        title: 'Step summary warning',
        message,
        level: 'warning',
    }),
    fileDiscoveryWarning: (message: string): QualityGateIssue => ({
        code: 'QG007',
        title: 'SARIF file discovery warning',
        message,
        level: 'warning',
    }),
    actionFailed: (message: string): QualityGateIssue => ({
        code: 'QG999',
        title: 'QualityGate action failed',
        message,
        level: 'error',
    }),
};

export class QualityGateError extends Error {
    readonly issue: QualityGateIssue;

    constructor(issue: QualityGateIssue) {
        super(issue.message);
        this.name = 'QualityGateError';
        this.issue = issue;
    }
}

export class ErrorReporter {
    static format(issue: QualityGateIssue): string {
        return `[${issue.code}] ${issue.title}: ${issue.message}`;
    }

    static warning(issue: QualityGateIssue): void {
        core.warning(this.format(issue), { title: `${issue.code} ${issue.title}` });
    }

    static error(issue: QualityGateIssue): void {
        core.error(this.format(issue), { title: `${issue.code} ${issue.title}` });
    }

    static setFailed(issue: QualityGateIssue): void {
        core.setFailed(this.format(issue));
    }

    static fromUnknown(error: unknown): QualityGateIssue {
        if (error instanceof QualityGateError) {
            return error.issue;
        }

        return QualityGateIssues.actionFailed(error instanceof Error ? error.message : String(error));
    }
}
