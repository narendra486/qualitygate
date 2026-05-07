import { Finding, SeverityCounts } from '../types/sarif';

export class SeverityCounter {
    count(findings: Finding[]): SeverityCounts {
        const counts: SeverityCounts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            total: findings.length,
        };

        for (const finding of findings) {
            counts[finding.severity]++;
        }

        return counts;
    }

    countBySeverity(findings: Finding[], severity: 'low' | 'medium' | 'high' | 'critical'): number {
        return findings.filter(f => f.severity === severity).length;
    }

    countAtOrAboveSeverity(
        findings: Finding[],
        threshold: 'low' | 'medium' | 'high' | 'critical'
    ): number {
        const severityLevels = ['low', 'medium', 'high', 'critical'];
        const thresholdIndex = severityLevels.indexOf(threshold);

        return findings.filter(f => severityLevels.indexOf(f.severity) >= thresholdIndex).length;
    }
}