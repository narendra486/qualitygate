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
exports.QualityGateEvaluator = void 0;
const thresholds_1 = require("./thresholds");
const core = __importStar(require("@actions/core"));
class QualityGateEvaluator {
    counter = new thresholds_1.SeverityCounter();
    evaluate(findings, threshold, failOnCount) {
        const counts = this.counter.count(findings);
        let passed = true;
        // Check severity threshold
        const countAtOrAboveThreshold = this.counter.countAtOrAboveSeverity(findings, threshold);
        if (countAtOrAboveThreshold > 0) {
            passed = false;
            core.info(`Found ${countAtOrAboveThreshold} findings at or above threshold "${threshold}"`);
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
    generateSummary(result) {
        const { counts, passed, threshold } = result;
        const status = passed ? '✅ PASS' : '❌ FAIL';
        return `${status} | Threshold: ${threshold} | Critical: ${counts.critical} | High: ${counts.high} | Medium: ${counts.medium} | Low: ${counts.low}`;
    }
}
exports.QualityGateEvaluator = QualityGateEvaluator;
