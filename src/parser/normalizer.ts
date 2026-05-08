import * as crypto from 'crypto';
import { Finding, SarifResult, SarifRun, Severity } from '../types/sarif';
import { SeverityUtils } from '../utils/severity';

type Location = { file: string; line: number; column?: number; endLine?: number; endColumn?: number };

export class SarifNormalizer {
    normalizeResult(
        result: SarifResult,
        run: SarifRun,
        runIndex: number,
        resultIndex: number,
        sarifFile: string
    ): Finding | undefined {
        const ruleId = result.ruleId || `rule-${result.ruleIndex ?? 'unknown'}`;
        const message = this.messageText(result.message);
        if (!message) return undefined;

        const rule = this.ruleFor(run, result.ruleIndex, ruleId);
        const location = this.location(result);
        const tool = run.tool?.driver?.name || 'unknown';
        const severity = this.severity(result, rule);
        const fingerprint = this.fingerprint(tool, ruleId, location.file, location.line, message);

        return {
            ruleId,
            ruleName: rule?.name || rule?.shortDescription?.text || ruleId,
            description: this.messageText(rule?.fullDescription) || this.messageText(rule?.help) || message,
            severity,
            message,
            file: location.file,
            line: location.line,
            column: location.column,
            endLine: location.endLine,
            endColumn: location.endColumn,
            tool,
            toolVersion: run.tool?.driver?.semanticVersion || run.tool?.driver?.version,
            scanner: tool,
            sarifFile,
            runIndex,
            resultIndex,
            baselineState: result.baselineState,
            suppressed: Boolean(result.suppressions?.length),
            uniqueId: fingerprint,
            fingerprint,
            helpUri: rule?.helpUri,
            properties: result.properties,
        };
    }

    private severity(result: SarifResult, rule: ReturnType<SarifNormalizer['ruleFor']>): Severity {
        const props = (result.properties ?? {}) as Record<string, unknown>;
        const ruleProps = (rule?.properties ?? {}) as Record<string, unknown>;
        const problem = ruleProps.problem as { severity?: unknown } | undefined;
        const value =
            props['security-severity'] ??
            props.securitySeverity ??
            props.severity ??
            props.precision ??
            ruleProps['security-severity'] ??
            ruleProps.securitySeverity ??
            problem?.severity ??
            rule?.defaultConfiguration?.level ??
            result.level ??
            'note';

        return SeverityUtils.normalize(value);
    }

    private ruleFor(run: SarifRun, ruleIndex: number | undefined, ruleId: string) {
        const rules = [
            ...(run.tool?.driver?.rules ?? []),
            ...((run.tool?.extensions ?? []).flatMap(extension => extension.rules ?? [])),
        ];
        if (typeof ruleIndex === 'number' && rules[ruleIndex]) return rules[ruleIndex];
        return rules.find(rule => rule.id === ruleId || rule.name === ruleId);
    }

    private messageText(message?: { text?: string; markdown?: string } | string): string {
        if (!message) return '';
        if (typeof message === 'string') return message;
        return message.text || message.markdown || '';
    }

    private location(result: SarifResult): Location {
        const physical = result.locations?.[0]?.physicalLocation;
        const uri = physical?.artifactLocation?.uri || 'unknown';
        const region = physical?.region;
        return {
            file: uri.replace(/^file:\/\//, ''),
            line: Math.max(1, region?.startLine ?? 1),
            column: region?.startColumn,
            endLine: region?.endLine,
            endColumn: region?.endColumn,
        };
    }

    private fingerprint(tool: string, ruleId: string, file: string, line: number, message: string): string {
        return crypto
            .createHash('sha256')
            .update([tool, ruleId, file, line, message].join('\0'))
            .digest('hex');
    }
}
