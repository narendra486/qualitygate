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
    static getSeverityLabel(severity) {
        return severity.charAt(0).toUpperCase() + severity.slice(1);
    }
    static getSeverityBadge(severity) {
        switch (severity) {
            case 'critical':
                return '![Critical](https://img.shields.io/badge/Critical-red?style=flat-square)';
            case 'high':
                return '![High](https://img.shields.io/badge/High-orange?style=flat-square)';
            case 'medium':
                return '![Medium](https://img.shields.io/badge/Medium-yellow?style=flat-square)';
            case 'low':
                return '![Low](https://img.shields.io/badge/Low-blue?style=flat-square)';
            default:
                return '![Unknown](https://img.shields.io/badge/Unknown-gray?style=flat-square)';
        }
    }
}
exports.SeverityUtils = SeverityUtils;
