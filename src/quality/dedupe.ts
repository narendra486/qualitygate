import { Finding } from '../types/sarif';
import * as core from '@actions/core';

export class DeduplicationEngine {
    /**
     * Deduplicates findings based on unique ID
     * Preserves first occurrence
     */
    deduplicate(findings: Finding[]): Finding[] {
        const seen = new Set<string>();
        const deduplicated: Finding[] = [];

        for (const finding of findings) {
            if (!seen.has(finding.uniqueId)) {
                seen.add(finding.uniqueId);
                deduplicated.push(finding);
            }
        }

        const removed = findings.length - deduplicated.length;
        if (removed > 0) {
            core.info(`Deduplicated ${removed} duplicate finding(s)`);
        }

        return deduplicated;
    }

    /**
     * Groups findings by rule ID
     */
    groupByRule(findings: Finding[]): Map<string, Finding[]> {
        const grouped = new Map<string, Finding[]>();

        for (const finding of findings) {
            if (!grouped.has(finding.ruleId)) {
                grouped.set(finding.ruleId, []);
            }
            grouped.get(finding.ruleId)!.push(finding);
        }

        return grouped;
    }

    /**
     * Groups findings by severity
     */
    groupBySeverity(findings: Finding[]): Map<string, Finding[]> {
        const grouped = new Map<string, Finding[]>();

        for (const finding of findings) {
            if (!grouped.has(finding.severity)) {
                grouped.set(finding.severity, []);
            }
            grouped.get(finding.severity)!.push(finding);
        }

        return grouped;
    }

    /**
     * Groups findings by file
     */
    groupByFile(findings: Finding[]): Map<string, Finding[]> {
        const grouped = new Map<string, Finding[]>();

        for (const finding of findings) {
            if (!grouped.has(finding.file)) {
                grouped.set(finding.file, []);
            }
            grouped.get(finding.file)!.push(finding);
        }

        return grouped;
    }
}