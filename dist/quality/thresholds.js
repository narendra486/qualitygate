"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeverityCounter = void 0;
class SeverityCounter {
    count(findings) {
        const counts = {
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
    countBySeverity(findings, severity) {
        return findings.filter(f => f.severity === severity).length;
    }
    countAtOrAboveSeverity(findings, threshold) {
        const severityLevels = ['low', 'medium', 'high', 'critical'];
        const thresholdIndex = severityLevels.indexOf(threshold);
        return findings.filter(f => severityLevels.indexOf(f.severity) >= thresholdIndex).length;
    }
}
exports.SeverityCounter = SeverityCounter;
