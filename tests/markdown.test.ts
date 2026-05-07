import { MarkdownFormatter } from '../src/formatters/markdown';
import { Finding, SeverityCounts } from '../src/types/sarif';

describe('MarkdownFormatter', () => {
    const formatter = new MarkdownFormatter();

    const mockCounts: SeverityCounts = {
        critical: 2,
        high: 1,
        medium: 3,
        low: 5,
        total: 11
    };

    const mockFindings: Finding[] = [
        { ruleId: 'rule1', severity: 'critical', message: 'Critical issue', file: 'main.js', line: 10, tool: 'test', uniqueId: '1' },
        { ruleId: 'rule2', severity: 'high', message: 'High issue', file: 'utils.js', line: 20, tool: 'test', uniqueId: '2' }
    ];

    it('should format failed PR comment', () => {
        const comment = formatter.formatPrComment(mockCounts, mockFindings, false, 'high');

        expect(comment).toContain('# Quality Gate Failed');
        expect(comment).toContain('Findings exceeded the **high** severity threshold.');
        expect(comment).toContain('Critical');
        expect(comment).toContain('rule1');
        expect(comment).toContain('High');
    });

    it('should format passed PR comment', () => {
        const comment = formatter.formatPrComment(mockCounts, [], true, 'high');

        expect(comment).toContain('# Quality Gate Passed');
        expect(comment).toContain('No findings exceeded the configured severity threshold.');
    });

    it('should truncate long messages', () => {
        const longMessage = 'A'.repeat(200);
        const finding: Finding = {
            ruleId: 'rule1',
            severity: 'high',
            message: longMessage,
            file: 'test.js',
            line: 1,
            tool: 'test',
            uniqueId: '1'
        };

        const comment = formatter.formatPrComment(mockCounts, [finding], false, 'high');
        expect(comment).toContain('...');
    });
});