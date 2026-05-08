import { MarkdownContext, MarkdownFormatter } from '../src/formatters/markdown';
import { Finding, QualityGateResult } from '../src/types/sarif';

const findings: Finding[] = [
    {
        ruleId: 'CVE-123',
        ruleName: 'Critical CVE',
        severity: 'critical',
        message: 'Critical package vulnerability',
        file: 'services/api/package-lock.json',
        line: 42,
        tool: 'Trivy',
        sarifFile: 'trivy.sarif',
        runIndex: 0,
        resultIndex: 0,
        suppressed: false,
        uniqueId: 'a',
        fingerprint: 'a',
    },
];

const result: QualityGateResult = {
    passed: false,
    blocked: true,
    counts: { critical: 1, high: 0, medium: 0, low: 0, total: 1 },
    findings,
    threshold: 'high',
    thresholdFindingCount: 1,
    reasons: ['1 finding(s) at or above high'],
};

const context: MarkdownContext = {
    result,
    findings,
    metadata: [{ file: 'trivy.sarif', version: '2.1.0', runCount: 1, resultCount: 1, tools: ['Trivy'] }],
    processedFiles: ['trivy.sarif'],
    skippedFiles: [],
    durationMs: 1234,
    config: { severityThreshold: 'high', mode: 'block', maxFindingsDisplay: 100 },
};

describe('MarkdownFormatter', () => {
    const formatter = new MarkdownFormatter();

    it('formats enterprise PR failure comments', () => {
        const comment = formatter.formatPrComment(context);

        expect(comment).toContain('# 🚨 Quality Gate Failed');
        expect(comment).toContain('## Security Summary');
        expect(comment).toContain('img.shields.io');
        expect(comment).not.toContain('Findings grouped by scanner and rule');
        expect(comment).not.toContain('<details>');
        expect(comment).not.toContain('## Scan Metadata');
        expect(comment).not.toContain('Processed SARIF files');
        expect(comment).toContain('<!-- qualitygate-action-comment -->');
    });

    it('formats pass comments with required copy', () => {
        const comment = formatter.formatPrComment({
            ...context,
            result: { ...result, passed: true, blocked: false, counts: { critical: 0, high: 0, medium: 0, low: 1, total: 1 } },
            findings: [],
        });

        expect(comment).toContain('# ✅ Quality Gate Passed');
        expect(comment).toContain('No findings exceeded configured threshold.');
    });

    it('truncates displayed findings', () => {
        const manyFindings = Array.from({ length: 3 }, (_, index) => ({ ...findings[0]!, line: index + 1, fingerprint: String(index), uniqueId: String(index) }));
        const comment = formatter.formatPrComment({
            ...context,
            findings: manyFindings,
            config: { severityThreshold: 'high', mode: 'block', maxFindingsDisplay: 1 },
        });

        expect(comment).toContain('Findings truncated: showing 1 of 3');
    });
});
