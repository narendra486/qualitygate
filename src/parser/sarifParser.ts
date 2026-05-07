import { Finding, SarifLog, SarifMetadata } from '../types/sarif';
import { SarifNormalizer } from './normalizer';
import { ErrorReporter, QualityGateIssues } from '../utils/errors';

export class SarifParser {
    private readonly normalizer = new SarifNormalizer();

    parse(sarifData: SarifLog, sarifFile = 'inline'): { findings: Finding[]; metadata: SarifMetadata } {
        const metadata: SarifMetadata = {
            file: sarifFile,
            version: sarifData.version || 'unknown',
            runCount: sarifData.runs?.length ?? 0,
            resultCount: 0,
            tools: [],
        };
        const findings: Finding[] = [];

        if (sarifData.version && sarifData.version !== '2.1.0') {
            ErrorReporter.warning(
                QualityGateIssues.malformedSarif(
                    `${sarifFile} declares SARIF ${sarifData.version}; QualityGate expects 2.1.0 but will parse best-effort`
                )
            );
        }

        if (!sarifData.runs?.length) {
            ErrorReporter.warning(QualityGateIssues.malformedSarif(`No SARIF runs found in ${sarifFile}`));
            return { findings, metadata };
        }

        sarifData.runs.forEach((run, runIndex) => {
            const tool = run.tool?.driver?.name || `tool-${runIndex}`;
            metadata.tools.push(tool);
            const results = run.results ?? [];
            metadata.resultCount += results.length;

            results.forEach((result, resultIndex) => {
                try {
                    const finding = this.normalizer.normalizeResult(result, run, runIndex, resultIndex, sarifFile);
                    if (finding) findings.push(finding);
                } catch (error) {
                    ErrorReporter.warning(
                        QualityGateIssues.malformedSarif(
                            `Skipped result ${resultIndex} in ${sarifFile}: ${error instanceof Error ? error.message : String(error)}`
                        )
                    );
                }
            });
        });

        metadata.tools = [...new Set(metadata.tools)].sort();
        return { findings, metadata };
    }
}
