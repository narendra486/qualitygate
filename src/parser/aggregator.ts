import * as core from '@actions/core';
import { AggregationResult, SarifLog } from '../types/sarif';
import { FileHandler } from '../utils/file';
import { SarifParser } from './sarifParser';
import { ErrorReporter, QualityGateIssues } from '../utils/errors';

export class SarifAggregator {
    private readonly parser = new SarifParser();

    async aggregate(files: string[]): Promise<AggregationResult> {
        const result: AggregationResult = {
            findings: [],
            metadata: [],
            processedFiles: [],
            skippedFiles: [],
        };

        for (const file of files) {
            try {
                const content = await FileHandler.readFile(file);
                const sarif = FileHandler.parseJson<SarifLog>(content, file);
                const parsed = this.parser.parse(sarif, file);
                result.findings.push(...parsed.findings);
                result.metadata.push(parsed.metadata);
                result.processedFiles.push(file);
                core.info(`Parsed ${parsed.findings.length} finding(s) from ${file}`);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                result.skippedFiles.push(file);
                result.metadata.push({
                    file,
                    version: 'unknown',
                    runCount: 0,
                    resultCount: 0,
                    tools: [],
                    malformed: true,
                    error: message,
                });
                ErrorReporter.warning(QualityGateIssues.malformedSarif(`Skipping ${file}: ${message}`));
            }
        }

        return result;
    }
}
