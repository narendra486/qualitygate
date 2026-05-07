"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeduplicationEngine = void 0;
const core = __importStar(require("@actions/core"));
class DeduplicationEngine {
    /**
     * Deduplicates findings based on unique ID
     * Preserves first occurrence
     */
    deduplicate(findings) {
        const seen = new Set();
        const deduplicated = [];
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
    groupByRule(findings) {
        const grouped = new Map();
        for (const finding of findings) {
            if (!grouped.has(finding.ruleId)) {
                grouped.set(finding.ruleId, []);
            }
            grouped.get(finding.ruleId).push(finding);
        }
        return grouped;
    }
    /**
     * Groups findings by severity
     */
    groupBySeverity(findings) {
        const grouped = new Map();
        for (const finding of findings) {
            if (!grouped.has(finding.severity)) {
                grouped.set(finding.severity, []);
            }
            grouped.get(finding.severity).push(finding);
        }
        return grouped;
    }
    /**
     * Groups findings by file
     */
    groupByFile(findings) {
        const grouped = new Map();
        for (const finding of findings) {
            if (!grouped.has(finding.file)) {
                grouped.set(finding.file, []);
            }
            grouped.get(finding.file).push(finding);
        }
        return grouped;
    }
}
exports.DeduplicationEngine = DeduplicationEngine;
