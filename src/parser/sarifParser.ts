import * as core from '@actions/core';
import { SarifLog, Finding, SeverityCounts } from '../types/sarif';

/**
 * Parses SARIF 2.1.0 formatted files and extracts findings
 * Supports multiple SARIF runs and various scanner formats
 */
export class SarifParser {
    private toolName: string = 'unknown';

    parse(sarifData: SarifLog): Finding[] {
        const findings: Finding[] = [];

        if (!sarifData.runs || sarifData.runs.length === 0) {
            core.warning('No runs found in SARIF data');
            return findings;
        }

        for (let runIndex = 0; runIndex < sarifData.runs.length; runIndex++) {
            const run = sarifData.runs[runIndex];
            this.toolName = run.tool?.driver?.name || `tool-${runIndex}`;

            if (!run.results || run.results.length === 0) {
                core.info(`No results in run ${runIndex} (${this.toolName})`);
                continue;
            }

            for (const result of run.results) {
                const finding = this.parseResult(result, run);
                if (finding) {
                    findings.push(finding);
                }
            }
        }

        return findings;
    }

    private parseResult(result: any, run: any): Finding | null {
        try {
            const ruleId = result.ruleId || result.rule?.id || 'unknown';
            const ruleName = this.extractRuleName(result, run, ruleId);
            const severitySource = this.extractSeverityLevel(result);
            const message = this.extractMessage(result.message);
            const description = this.extractDescription(result, message);
            const location = this.extractLocation(result.locations);

            if (!message) {
                core.debug(`Skipping result without message: ${ruleId}`);
                return null;
            }

            const severity = this.normalizeSeverity(severitySource);
            const uniqueId = this.generateUniqueId(ruleId, location.file, location.line);

            return {
                ruleId,
                ruleName,
                description,
                severity,
                message,
                file: location.file,
                line: location.line,
                column: location.column,
                tool: this.toolName,
                uniqueId,
            };
        } catch (error) {
            core.debug(`Error parsing result: ${error}`);
            return null;
        }
    }

    private extractMessage(message: any): string {
        if (typeof message === 'string') {
            return message;
        }
        if (message?.text) {
            return message.text;
        }
        if (message?.markdown) {
            return message.markdown;
        }
        return '';
    }

    private extractDescription(result: any, fallback: string): string {
        if (result.properties?.description) {
            return result.properties.description;
        }
        if (result.help?.text) {
            return result.help.text;
        }
        if (result.help?.markdown) {
            return result.help.markdown;
        }
        if (result.fullDescription?.text) {
            return result.fullDescription.text;
        }
        if (result.fullDescription?.markdown) {
            return result.fullDescription.markdown;
        }
        return fallback;
    }

    private extractRuleName(result: any, run: any, ruleId: string): string {
        if (result.rule?.name) {
            return result.rule.name;
        }

        if (result.ruleIndex !== undefined && run?.tool?.driver?.rules) {
            const rule = run.tool.driver.rules[result.ruleIndex];
            if (rule?.name) {
                return rule.name;
            }
        }

        return result.rule?.id || ruleId;
    }

    private extractSeverityLevel(result: any): string {
        const props = result.properties || {};
        return (
            props['security-severity'] ||
            props.securitySeverity ||
            props.severity ||
            result.level ||
            'note'
        );
    }

    private extractLocation(locations: any[]): { file: string; line: number; column?: number } {
        if (!locations || locations.length === 0) {
            return { file: 'unknown', line: 1 };
        }

        const location = locations[0];
        const physicalLocation = location?.physicalLocation;

        if (!physicalLocation) {
            return { file: 'unknown', line: 1 };
        }

        const file = physicalLocation.artifactLocation?.uri || 'unknown';
        const line = physicalLocation.region?.startLine || 1;
        const column = physicalLocation.region?.startColumn;

        return { file, line, column };
    }

    private normalizeSeverity(level: string): 'low' | 'medium' | 'high' | 'critical' {
        const normalized = String(level).toLowerCase();

        switch (normalized) {
            case 'critical':
            case 'critical-severity':
                return 'critical';
            case 'high':
            case 'error':
                return 'high';
            case 'medium':
            case 'warning':
                return 'medium';
            case 'low':
            case 'note':
            case 'none':
                return 'low';
            default:
                return 'low';
        }
    }

    private generateUniqueId(ruleId: string, file: string, line: number): string {
        return `${this.toolName}:${ruleId}:${file}:${line}`;
    }
}