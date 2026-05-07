import * as core from '@actions/core';
import { Finding } from '../types/sarif';
import { SeverityUtils } from '../utils/severity';
import { ErrorReporter, QualityGateIssues } from '../utils/errors';

export class AnnotationsHandler {
    createAnnotations(findings: Finding[], maxAnnotations = 50): void {
        for (const finding of findings.slice(0, maxAnnotations)) {
            const annotation = {
                title: `${finding.ruleId} (${finding.tool})`,
                file: finding.file === 'unknown' ? undefined : finding.file,
                startLine: finding.line,
                startColumn: finding.column,
                endLine: finding.endLine,
                endColumn: finding.endColumn,
            };

            const level = SeverityUtils.getAnnotationLevel(finding.severity);
            if (level === 'error') core.error(finding.message, annotation);
            else if (level === 'warning') core.warning(finding.message, annotation);
            else core.notice(finding.message, annotation);
        }

        if (findings.length > maxAnnotations) {
            ErrorReporter.warning(
                QualityGateIssues.githubIntegrationWarning(
                    `Annotated ${maxAnnotations} of ${findings.length} finding(s) due to GitHub annotation limits`
                )
            );
        }
    }
}
