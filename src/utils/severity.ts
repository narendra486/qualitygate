export class SeverityUtils {
    static readonly SEVERITY_ORDER = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
    };

    static getSeverityIndex(severity: 'low' | 'medium' | 'high' | 'critical'): number {
        return this.SEVERITY_ORDER[severity] || 0;
    }

    static compare(
        a: 'low' | 'medium' | 'high' | 'critical',
        b: 'low' | 'medium' | 'high' | 'critical'
    ): number {
        return this.getSeverityIndex(b) - this.getSeverityIndex(a);
    }

    static isAtOrAboveThreshold(
        severity: 'low' | 'medium' | 'high' | 'critical',
        threshold: 'low' | 'medium' | 'high' | 'critical'
    ): boolean {
        return this.getSeverityIndex(severity) >= this.getSeverityIndex(threshold);
    }

    static getSeverityEmoji(severity: 'low' | 'medium' | 'high' | 'critical'): string {
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

    static getSeverityBadge(severity: 'low' | 'medium' | 'high' | 'critical'): string {
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