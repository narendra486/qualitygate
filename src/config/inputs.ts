import * as core from '@actions/core';
import { ActionConfig, Severity } from '../types/sarif';
import { SeverityUtils } from '../utils/severity';
import { QualityGateError, QualityGateIssues } from '../utils/errors';

function getBooleanInput(name: string, defaultValue: boolean): boolean {
    const value = core.getInput(name);
    if (!value) return defaultValue;
    return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}

function getCsvInput(name: string): string[] {
    return core
        .getInput(name)
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
}

function getOptionalInteger(name: string): number | undefined {
    const raw = core.getInput(name);
    if (!raw) return undefined;
    const value = Number.parseInt(raw, 10);
    if (!Number.isFinite(value) || value < 0) {
        throw new QualityGateError(QualityGateIssues.invalidInput(`${name} must be a non-negative integer`));
    }
    return value;
}

export function readInputs(): ActionConfig {
    const severityThreshold = core.getInput('severity_threshold', { required: true }).trim().toLowerCase();
    if (!SeverityUtils.isValid(severityThreshold)) {
        throw new QualityGateError(
            QualityGateIssues.invalidInput('severity_threshold must be one of: low, medium, high, critical')
        );
    }

    const maxFindingsDisplay = getOptionalInteger('max_findings_display') ?? 100;

    return {
        sarifFile: core.getInput('sarif_file', { required: true }),
        severityThreshold: severityThreshold as Severity,
        githubToken: core.getInput('github_token'),
        prComment: getBooleanInput('pr_comment', true),
        failOnCount: getOptionalInteger('fail_on_count'),
        ignoreRuleIds: getCsvInput('ignore_rule_ids'),
        ignorePaths: getCsvInput('ignore_paths'),
        deduplicate: getBooleanInput('deduplicate', true),
        baselineFile: core.getInput('baseline_file') || undefined,
        enableAnnotations: getBooleanInput('enable_annotations', true),
        enableStepSummary: getBooleanInput('enable_step_summary', true),
        markdownTemplate: core.getInput('markdown_template') || undefined,
        maxFindingsDisplay,
        jsonExportFile: core.getInput('json_export_file') || undefined,
    };
}
