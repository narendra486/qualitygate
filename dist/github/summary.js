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
exports.StepSummaryHandler = void 0;
const core = __importStar(require("@actions/core"));
class StepSummaryHandler {
    async write(counts, findings, passed, threshold, processingTime) {
        try {
            await core.summary
                .addHeading('Quality Gate Results', 1)
                .addRaw(passed ? '✅ **PASSED**' : '❌ **FAILED**', true);
            // Summary table
            core.summary.addHeading('Summary', 2);
            core.summary.addTable([
                ['Metric', 'Value'],
                ['Threshold', threshold],
                ['Status', passed ? '✅ PASS' : '❌ FAIL'],
                ['Processing Time', `${processingTime}ms`],
            ]);
            // Severity counts
            core.summary.addHeading('Findings by Severity', 2);
            core.summary.addTable([
                ['Severity', 'Count'],
                ['🔴 Critical', counts.critical.toString()],
                ['🟠 High', counts.high.toString()],
                ['🟡 Medium', counts.medium.toString()],
                ['🔵 Low', counts.low.toString()],
                ['Total', counts.total.toString()],
            ]);
            // Top findings if any
            if (findings.length > 0 && findings.length <= 20) {
                core.summary.addHeading('Findings', 2);
                core.summary.addTable([
                    ['Severity', 'Rule', 'File', 'Line', 'Message'],
                    ...findings.slice(0, 20).map(f => [
                        this.getSeverityEmoji(f.severity),
                        f.ruleId,
                        f.file,
                        f.line.toString(),
                        f.message.substring(0, 50),
                    ]),
                ]);
            }
            else if (findings.length > 20) {
                core.summary.addRaw(`<details>\n<summary>${findings.length} findings (showing first 20)</summary>\n\n`, true);
                core.summary.addTable([
                    ['Severity', 'Rule', 'File', 'Line', 'Message'],
                    ...findings.slice(0, 20).map(f => [
                        this.getSeverityEmoji(f.severity),
                        f.ruleId,
                        f.file,
                        f.line.toString(),
                        f.message.substring(0, 50),
                    ]),
                ]);
                core.summary.addRaw('\n</details>', true);
            }
            await core.summary.write();
            core.info('Step summary written');
        }
        catch (error) {
            core.warning(`Failed to write step summary: ${error}`);
        }
    }
    getSeverityEmoji(severity) {
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
}
exports.StepSummaryHandler = StepSummaryHandler;
