import * as core from '@actions/core';
import { Finding, SeverityCounts } from '../types/sarif';

export class StepSummaryHandler {
    async write(
        counts: SeverityCounts,
        findings: Finding[],
        passed: boolean,
        threshold: string,
        processingTime: number
    ): Promise<void> {
        try {
            await core.summary
                .addHeading('Quality Gate Results', 1)
                .addRaw(
                    passed ? '✅ **PASSED**' : '❌ **FAILED**',
                    true
                );

            // Summary table
            core.summary.addHeading('Summary', 2);
            core.summary.addTable([
                ['Metric', 'Value'],
                ['Threshold', threshold],
                ['Status', passed ? '✅ PASS' : '❌ FAIL'],
                ['Processing Time', `${processingTime}ms`],
            ]);

            // Severity counts
            core.summary.addHeading('Findings by Severity', 2);
            core.summary.addTable([
                ['Severity', 'Count'],
                ['🔴 Critical', counts.critical.toString()],
                ['🟠 High', counts.high.toString()],
                ['🟡 Medium', counts.medium.toString()],
                ['🔵 Low', counts.low.toString()],
                ['Total', counts.total.toString()],
            ]);

            // Top findings if any
            if (findings.length > 0 && findings.length <= 20) {
                core.summary.addHeading('Findings', 2);
                core.summary.addTable([
                    ['Severity', 'Rule', 'File', 'Line', 'Message'],
                    ...findings.slice(0, 20).map(f => [
                        this.getSeverityEmoji(f.severity),
                        f.ruleId,
                        f.file,
                        f.line.toString(),
                        f.message.substring(0, 50),
                    ]),
                ]);
            } else if (findings.length > 20) {
                core.summary.addRaw(
                    `<details>\n<summary>${findings.length} findings (showing first 20)</summary>\n\n`,
                    true
                );
                core.summary.addTable([
                    ['Severity', 'Rule', 'File', 'Line', 'Message'],
                    ...findings.slice(0, 20).map(f => [
                        this.getSeverityEmoji(f.severity),
                        f.ruleId,
                        f.file,
                        f.line.toString(),
                        f.message.substring(0, 50),
                    ]),
                ]);
                core.summary.addRaw('\n</details>', true);
            }

            await core.summary.write();
            core.info('Step summary written');
        } catch (error) {
            core.warning(`Failed to write step summary: ${error}`);
        }
    }

    private getSeverityEmoji(severity: string): string {
        switch (severity) {
            case 'critical':
                return '🔴';
            case 'high':
                return '🟠';
            case 'medium':
                return '🟡';
            case 'low':
                return '🔵';
            default:
                return '⚪';
        }
    }
}