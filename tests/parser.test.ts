import { SarifParser } from '../src/parser/sarifParser';

describe('SarifParser', () => {
    const parser = new SarifParser();

    it('parses SARIF 2.1.0 runs and normalizes SARIF levels', () => {
        const sarifData = {
            version: '2.1.0',
            runs: [
                {
                    tool: {
                        driver: {
                            name: 'TestScanner',
                            version: '1.0.0',
                            rules: [{ id: 'test-rule-1', name: 'Unsafe Pattern' }],
                        },
                    },
                    results: [
                        {
                            ruleId: 'test-rule-1',
                            level: 'error',
                            message: { text: 'Issue found' },
                            locations: [
                                {
                                    physicalLocation: {
                                        artifactLocation: { uri: 'src/main.js' },
                                        region: { startLine: 10, startColumn: 2 },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const { findings, metadata } = parser.parse(sarifData, 'scan.sarif');

        expect(metadata).toMatchObject({ version: '2.1.0', runCount: 1, resultCount: 1, tools: ['TestScanner'] });
        expect(findings).toHaveLength(1);
        expect(findings[0]).toMatchObject({
            ruleId: 'test-rule-1',
            ruleName: 'Unsafe Pattern',
            severity: 'high',
            message: 'Issue found',
            file: 'src/main.js',
            line: 10,
            column: 2,
            tool: 'TestScanner',
            sarifFile: 'scan.sarif',
        });
        expect(findings[0]?.fingerprint).toHaveLength(64);
    });

    it.each([
        ['error', 'high'],
        ['warning', 'medium'],
        ['note', 'low'],
        ['9.8', 'critical'],
        ['7.5', 'high'],
        ['4.3', 'medium'],
    ])('normalizes %s to %s', (level, expected) => {
        const { findings } = parser.parse({
            runs: [
                {
                    tool: { driver: { name: 'Test' } },
                    results: [
                        {
                            ruleId: 'test',
                            level,
                            message: { text: 'test' },
                            locations: [
                                {
                                    physicalLocation: {
                                        artifactLocation: { uri: 'test.js' },
                                        region: { startLine: 1 },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(findings[0]?.severity).toBe(expected);
    });

    it('uses CodeQL rule security severity from SARIF tool extensions', () => {
        const { findings } = parser.parse({
            version: '2.1.0',
            runs: [
                {
                    tool: {
                        driver: { name: 'CodeQL' },
                        extensions: [
                            {
                                name: 'codeql/javascript-queries',
                                rules: [
                                    {
                                        id: 'js/code-injection',
                                        name: 'Code injection',
                                        defaultConfiguration: { level: 'note' },
                                        properties: {
                                            'security-severity': '9.3',
                                            precision: 'high',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    results: [
                        {
                            ruleId: 'js/code-injection',
                            ruleIndex: 0,
                            level: 'note',
                            message: { text: 'This code execution depends on a user-provided value.' },
                            locations: [
                                {
                                    physicalLocation: {
                                        artifactLocation: { uri: 'app.js' },
                                        region: { startLine: 10 },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(findings[0]?.ruleName).toBe('Code injection');
        expect(findings[0]?.severity).toBe('critical');
    });
});
