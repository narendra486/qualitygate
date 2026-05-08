import { ActionConfig, Finding, QualityGateResult, SarifMetadata, SeverityCounts } from '../types/sarif';
import { BadgeFormatter } from './badges';
import { SeverityUtils } from '../utils/severity';

export interface MarkdownContext {
    result: QualityGateResult;
    findings: Finding[];
    metadata: SarifMetadata[];
    processedFiles: string[];
    skippedFiles: string[];
    durationMs: number;
    config: Pick<ActionConfig, 'severityThreshold' | 'mode' | 'maxFindingsDisplay' | 'failOnCount'>;
    markdownTemplate?: string;
}

export class MarkdownFormatter {
    formatPrComment(context: MarkdownContext): string {
        if (context.markdownTemplate) {
            return `${this.renderTemplate(context.markdownTemplate, context)}\n\n<!-- qualitygate-action-comment -->`;
        }

        const { result } = context;
        const title = result.passed ? '# ✅ Quality Gate Passed' : '# 🚨 Quality Gate Failed';
        const intro = result.passed
            ? 'No findings exceeded configured threshold.'
            : `Findings exceeded the **${result.threshold}** severity threshold.`;

        return [
            title,
            '',
            BadgeFormatter.status(result.passed),
            '',
            intro,
            '',
            '## Security Summary',
            '',
            this.countsTable(result.counts, true),
            '',
            this.findingsSection(context),
            '',
            '<!-- qualitygate-action-comment -->',
        ].join('\n');
    }

    formatStepSummary(context: MarkdownContext): string {
        const { result, durationMs } = context;
        return [
            '# Quality Gate Results',
            '',
            `**Status:** ${result.passed ? '✅ PASS' : '❌ FAIL'}`,
            `**Blocked:** ${result.blocked ? 'true' : 'false'}`,
            `**Threshold:** ${result.threshold}`,
            `**Mode:** ${context.config.mode}`,
            `**Duration:** ${(durationMs / 1000).toFixed(2)}s`,
            '',
            '## Findings by Severity',
            '',
            this.countsTable(result.counts, false),
            '',
            '## Threshold Configuration',
            '',
            `- severity_threshold: \`${result.threshold}\``,
            `- mode: \`${context.config.mode}\``,
            `- fail_on_count: \`${result.failOnCount ?? 'not set'}\``,
            '',
            this.findingsSection(context),
            '',
            this.metadataSection(context),
        ].join('\n');
    }

    formatJson(context: MarkdownContext) {
        const { result, findings, metadata, processedFiles, skippedFiles, durationMs } = context;
        return {
            status: result.passed ? 'PASS' : 'FAIL',
            blocked: result.blocked,
            threshold: result.threshold,
            counts: result.counts,
            reasons: result.reasons,
            durationMs,
            processedFiles,
            skippedFiles,
            metadata,
            findings: findings.map(finding => ({
                ruleId: finding.ruleId,
                ruleName: finding.ruleName,
                severity: finding.severity,
                file: finding.file,
                line: finding.line,
                message: finding.message,
                tool: finding.tool,
                sarifFile: finding.sarifFile,
                fingerprint: finding.fingerprint,
            })),
        };
    }

    private countsTable(counts: SeverityCounts, badges: boolean): string {
        const label = (severity: 'critical' | 'high' | 'medium' | 'low') =>
            badges ? BadgeFormatter.severity(severity) : SeverityUtils.getSeverityLabel(severity);
        return [
            '| Severity | Count |',
            '| -------- | ----- |',
            `| ${label('critical')} | ${counts.critical} |`,
            `| ${label('high')} | ${counts.high} |`,
            `| ${label('medium')} | ${counts.medium} |`,
            `| ${label('low')} | ${counts.low} |`,
            `| **Total** | **${counts.total}** |`,
        ].join('\n');
    }

    private findingsSection(context: MarkdownContext): string {
        const findings = this.sortedFindings(context.findings);
        if (findings.length === 0) return '## Findings\n\nNo findings to display.';

        const limit = context.config.maxFindingsDisplay;
        const visible = findings.slice(0, limit);
        const hidden = findings.length - visible.length;
        const table = this.findingsTable(visible);
        const suffix = hidden > 0 ? `\n\n_Findings truncated: showing ${visible.length} of ${findings.length}._` : '';

        return [
            `## Findings`,
            '',
            table,
            suffix,
        ].join('\n');
    }

    private findingsTable(findings: Finding[]): string {
        return [
            '| Severity | Rule | File | Line | Message |',
            '| -------- | ---- | ---- | ---- | ------- |',
            ...findings.map(finding =>
                `| ${BadgeFormatter.severity(finding.severity)} | \`${this.escape(finding.ruleName || finding.ruleId)}\` | \`${this.escape(finding.file)}\` | ${finding.line} | ${this.escape(this.truncate(finding.message, 140))} |`
            ),
        ].join('\n');
    }

    private groupedFindings(findings: Finding[]): string {
        const groups = new Map<string, number>();
        for (const finding of findings) {
            const key = `${finding.tool} / ${finding.ruleId}`;
            groups.set(key, (groups.get(key) ?? 0) + 1);
        }
        return [...groups.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => `- \`${this.escape(key)}\`: ${count}`)
            .join('\n');
    }

    private metadataSection(context: MarkdownContext): string {
        const tools = [...new Set(context.metadata.flatMap(item => item.tools))].sort();
        return [
            '## Scan Metadata',
            '',
            `- Processed SARIF files: ${context.processedFiles.length}`,
            `- Skipped SARIF files: ${context.skippedFiles.length}`,
            `- Tools: ${tools.length ? tools.map(tool => `\`${this.escape(tool)}\``).join(', ') : '`unknown`'}`,
            `- Execution duration: ${(context.durationMs / 1000).toFixed(2)}s`,
            '',
            '<details>',
            '<summary>Processed SARIF files</summary>',
            '',
            ...context.processedFiles.map(file => `- \`${this.escape(file)}\``),
            ...context.skippedFiles.map(file => `- skipped: \`${this.escape(file)}\``),
            '',
            '</details>',
        ].join('\n');
    }

    private sortedFindings(findings: Finding[]): Finding[] {
        return [...findings].sort((a, b) => SeverityUtils.compareDescending(a.severity, b.severity) || a.file.localeCompare(b.file));
    }

    private truncate(message: string, maxLength: number): string {
        return message.length > maxLength ? `${message.slice(0, maxLength - 3)}...` : message;
    }

    private escape(value: string): string {
        return value.replace(/\r?\n/g, ' ').replace(/\|/g, '&#124;');
    }

    private renderTemplate(template: string, context: MarkdownContext): string {
        const replacements: Record<string, string> = {
            status: context.result.passed ? 'PASS' : 'FAIL',
            blocked: String(context.result.blocked),
            threshold: context.result.threshold,
            total_findings: String(context.result.counts.total),
            critical_count: String(context.result.counts.critical),
            high_count: String(context.result.counts.high),
            medium_count: String(context.result.counts.medium),
            low_count: String(context.result.counts.low),
            duration_seconds: (context.durationMs / 1000).toFixed(2),
            findings_table: this.findingsTable(this.sortedFindings(context.findings).slice(0, context.config.maxFindingsDisplay)),
            summary_table: this.countsTable(context.result.counts, true),
            processed_files: context.processedFiles.map(file => `- \`${this.escape(file)}\``).join('\n'),
        };

        return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_match, key: string) => replacements[key] ?? '');
    }
}
