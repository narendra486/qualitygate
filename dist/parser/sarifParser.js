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
exports.SarifParser = void 0;
const core = __importStar(require("@actions/core"));
/**
 * Parses SARIF 2.1.0 formatted files and extracts findings
 * Supports multiple SARIF runs and various scanner formats
 */
class SarifParser {
    toolName = 'unknown';
    parse(sarifData) {
        const findings = [];
        if (!sarifData.runs || sarifData.runs.length === 0) {
            core.warning('No runs found in SARIF data');
            return findings;
        }
        for (let runIndex = 0; runIndex < sarifData.runs.length; runIndex++) {
            const run = sarifData.runs[runIndex];
            this.toolName = run.tool?.driver?.name || `tool-${runIndex}`;
            if (!run.results || run.results.length === 0) {
                core.info(`No results in run ${runIndex} (${this.toolName})`);
                continue;
            }
            for (const result of run.results) {
                const finding = this.parseResult(result, run);
                if (finding) {
                    findings.push(finding);
                }
            }
        }
        return findings;
    }
    parseResult(result, run) {
        try {
            const ruleId = result.ruleId || result.rule?.id || 'unknown';
            const ruleName = this.extractRuleName(result, run, ruleId);
            const severitySource = this.extractSeverityLevel(result);
            const message = this.extractMessage(result.message);
            const description = this.extractDescription(result, message);
            const location = this.extractLocation(result.locations);
            if (!message) {
                core.debug(`Skipping result without message: ${ruleId}`);
                return null;
            }
            const severity = this.normalizeSeverity(severitySource);
            const uniqueId = this.generateUniqueId(ruleId, location.file, location.line);
            return {
                ruleId,
                ruleName,
                description,
                severity,
                message,
                file: location.file,
                line: location.line,
                column: location.column,
                tool: this.toolName,
                uniqueId,
            };
        }
        catch (error) {
            core.debug(`Error parsing result: ${error}`);
            return null;
        }
    }
    extractMessage(message) {
        if (typeof message === 'string') {
            return message;
        }
        if (message?.text) {
            return message.text;
        }
        if (message?.markdown) {
            return message.markdown;
        }
        return '';
    }
    extractDescription(result, fallback) {
        if (result.properties?.description) {
            return result.properties.description;
        }
        if (result.help?.text) {
            return result.help.text;
        }
        if (result.help?.markdown) {
            return result.help.markdown;
        }
        if (result.fullDescription?.text) {
            return result.fullDescription.text;
        }
        if (result.fullDescription?.markdown) {
            return result.fullDescription.markdown;
        }
        return fallback;
    }
    extractRuleName(result, run, ruleId) {
        if (result.rule?.name) {
            return result.rule.name;
        }
        if (result.ruleIndex !== undefined && run?.tool?.driver?.rules) {
            const rule = run.tool.driver.rules[result.ruleIndex];
            if (rule?.name) {
                return rule.name;
            }
        }
        return result.rule?.id || ruleId;
    }
    extractSeverityLevel(result) {
        const props = result.properties || {};
        return (props['security-severity'] ||
            props.securitySeverity ||
            props.severity ||
            result.level ||
            'note');
    }
    extractLocation(locations) {
        if (!locations || locations.length === 0) {
            return { file: 'unknown', line: 1 };
        }
        const location = locations[0];
        const physicalLocation = location?.physicalLocation;
        if (!physicalLocation) {
            return { file: 'unknown', line: 1 };
        }
        const file = physicalLocation.artifactLocation?.uri || 'unknown';
        const line = physicalLocation.region?.startLine || 1;
        const column = physicalLocation.region?.startColumn;
        return { file, line, column };
    }
    normalizeSeverity(level) {
        const normalized = String(level).toLowerCase();
        switch (normalized) {
            case 'critical':
            case 'critical-severity':
                return 'critical';
            case 'high':
            case 'error':
                return 'high';
            case 'medium':
            case 'warning':
                return 'medium';
            case 'low':
            case 'note':
            case 'none':
                return 'low';
            default:
                return 'low';
        }
    }
    generateUniqueId(ruleId, file, line) {
        return `${this.toolName}:${ruleId}:${file}:${line}`;
    }
}
exports.SarifParser = SarifParser;
