import { Finding, SeverityCounts, QualityGateResult } from '../types/sarif';
import { SeverityCounter } from './thresholds';
import * as core from '@actions/core';

export class QualityGateEvaluator {
    private counter = new SeverityCounter();

    evaluate(
        findings: Finding[],
        threshold: 'low' | 'medium' | 'high' | 'critical',
        failOnCount?: number
    ): QualityGateResult {
        const counts = this.counter.count(findings);
        let passed = true;

        // Check severity threshold
        const countAtOrAboveThreshold = this.counter.countAtOrAboveSeverity(findings, threshold);

        if (countAtOrAboveThreshold > 0) {
            passed = false;
            core.info(
                `Found ${countAtOrAboveThreshold} findings at or above threshold "${threshold}"`
            );
        }

        // Check explicit count limit
        if (failOnCount !== undefined && counts.total > failOnCount) {
            passed = false;
            core.info(`Found ${counts.total} findings, exceeds limit of ${failOnCount}`);
        }

        return {
            passed,
            counts,
            findings,
            threshold,
            failOnCount,
        };
    }

    generateSummary(result: QualityGateResult): string {
        const { counts, passed, threshold } = result;
        const status = passed ? '✅ PASS' : '❌ FAIL';

        return `${status} | Threshold: ${threshold} | Critical: ${counts.critical} | High: ${counts.high} | Medium: ${counts.medium} | Low: ${counts.low}`;
    }
}