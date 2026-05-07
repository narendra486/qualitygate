import { SarifParser } from '../src/parser/sarifParser';
import { Finding } from '../src/types/sarif';

describe('SarifParser', () => {
    const parser = new SarifParser();

    it('should parse valid SARIF with findings', () => {
        const sarifData: any = {
            version: '2.1.0',
            runs: [
                {
                    tool: {
                        driver: {
                            name: 'TestScanner',
                            version: '1.0.0'
                        }
                    },
                    results: [
                        {
                            ruleId: 'test-rule-1',
                            level: 'error',
                            message: {
                                text: 'Critical issue found'
                            },
                            locations: [
                                {
                                    physicalLocation: {
                                        artifactLocation: {
                                            uri: 'src/main.js'
                                        },
                                        region: {
                                            startLine: 10
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const findings = parser.parse(sarifData);

        expect(findings).toHaveLength(1);
        expect(findings[0]).toMatchObject({
            ruleId: 'test-rule-1',
            severity: 'high',
            message: 'Critical issue found',
            file: 'src/main.js',
            line: 10,
            tool: 'TestScanner'
        });
    });

    it('should handle empty SARIF', () => {
        const sarifData = {
            version: '2.1.0',
            runs: []
        };

        const findings = parser.parse(sarifData);
        expect(findings).toHaveLength(0);
    });

    it('should normalize severity levels', () => {
        const testCases = [
            { level: 'error', expected: 'high' },
            { level: 'warning', expected: 'medium' },
            { level: 'note', expected: 'low' },
            { level: 'unknown', expected: 'low' }
        ];

        testCases.forEach(({ level, expected }) => {
            const sarifData: any = {
                runs: [
                    {
                        tool: { driver: { name: 'Test' } },
                        results: [
                            {
                                ruleId: 'test',
                                level,
                                message: { text: 'test' },
                                locations: [{
                                    physicalLocation: {
                                        artifactLocation: { uri: 'test.js' },
                                        region: { startLine: 1 }
                                    }
                                }]
                            }
                        ]
                    }
                ]
            };

            const findings = parser.parse(sarifData);
            expect(findings[0].severity).toBe(expected);
        });
    });

    it('should use security-severity property when available', () => {
        const sarifData: any = {
            runs: [
                {
                    tool: { driver: { name: 'Test' } },
                    results: [
                        {
                            ruleId: 'test-rule-2',
                            properties: {
                                'security-severity': 'critical'
                            },
                            message: { text: 'Critical code injection' },
                            locations: [{
                                physicalLocation: {
                                    artifactLocation: { uri: 'test.js' },
                                    region: { startLine: 1 }
                                }
                            }]
                        }
                    ]
                }
            ]
        };

        const findings = parser.parse(sarifData);
        expect(findings[0].severity).toBe('critical');
    });
});