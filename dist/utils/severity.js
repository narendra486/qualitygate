"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeverityUtils = void 0;
class SeverityUtils {
    static SEVERITY_ORDER = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
    };
    static getSeverityIndex(severity) {
        return this.SEVERITY_ORDER[severity] || 0;
    }
    static compare(a, b) {
        return this.getSeverityIndex(b) - this.getSeverityIndex(a);
    }
    static isAtOrAboveThreshold(severity, threshold) {
        return this.getSeverityIndex(severity) >= this.getSeverityIndex(threshold);
    }
    static getSeverityEmoji(severity) {
        switch (severity) {
            case 'critical':
                return '🔴';
            case 'high':
                return '🟠';
            case 'medium':
                return '🟡';
            case 'low':
                return '🔵';
            default:
                return '⚪';
        }
    }
    static getSeverityBadge(severity) {
        switch (severity) {
            case 'critical':
                return '![Critical](https://img.shields.io/badge/Critical-red)';
            case 'high':
                return '![High](https://img.shields.io/badge/High-orange)';
            case 'medium':
                return '![Medium](https://img.shields.io/badge/Medium-yellow)';
            case 'low':
                return '![Low](https://img.shields.io/badge/Low-blue)';
            default:
                return '![Unknown](https://img.shields.io/badge/Unknown-gray)';
        }
    }
}
exports.SeverityUtils = SeverityUtils;
