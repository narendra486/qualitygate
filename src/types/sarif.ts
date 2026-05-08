export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type QualityGateStatus = 'PASS' | 'FAIL';
export type QualityGateMode = 'block' | 'report';

export interface SarifArtifactLocation {
    uri?: string;
    uriBaseId?: string;
    index?: number;
}

export interface SarifRegion {
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
    charOffset?: number;
    charLength?: number;
    byteOffset?: number;
    byteLength?: number;
    snippet?: {
        text?: string;
    };
}

export interface SarifPhysicalLocation {
    artifactLocation?: SarifArtifactLocation;
    region?: SarifRegion;
    contextRegion?: SarifRegion;
}

export interface SarifLocation {
    physicalLocation?: SarifPhysicalLocation;
    logicalLocations?: Array<{
        fullyQualifiedName?: string;
        kind?: string;
    }>;
}

export interface SarifMessage {
    text?: string;
    markdown?: string;
    id?: string;
    arguments?: string[];
}

export interface SarifResult {
    ruleId?: string;
    ruleIndex?: number;
    level?: 'error' | 'warning' | 'note' | 'none' | string;
    message?: SarifMessage;
    locations?: SarifLocation[];
    codeFlows?: Array<{
        threadFlows?: Array<{
            locations?: Array<{
                location?: SarifLocation;
                importance?: 'important' | 'essential' | 'unimportant';
            }>;
        }>;
    }>;
    relatedLocations?: SarifLocation[];
    suppressions?: Array<{
        kind?: 'inSource' | 'external';
        justification?: string;
    }>;
    baselineState?: 'new' | 'unchanged' | 'updated' | 'absent';
    rank?: number;
    attachments?: Array<{
        artifactLocation?: SarifArtifactLocation;
        regions?: SarifRegion[];
        description?: SarifMessage;
    }>;
    workItemUris?: string[];
    properties?: Record<string, unknown>;
}

export interface SarifRule {
    id?: string;
    name?: string;
    shortDescription?: SarifMessage;
    fullDescription?: SarifMessage;
    helpUri?: string;
    help?: SarifMessage;
    defaultConfiguration?: {
        level?: 'error' | 'warning' | 'note' | 'none' | string;
        rank?: number;
        parameters?: Record<string, unknown>;
    };
    properties?: Record<string, unknown>;
}

export interface SarifRun {
    tool?: {
        driver?: {
            name?: string;
            version?: string;
            informationUri?: string;
            rules?: SarifRule[];
            semanticVersion?: string;
            properties?: Record<string, unknown>;
        };
        extensions?: Array<{
            name?: string;
            version?: string;
            semanticVersion?: string;
            rules?: SarifRule[];
            properties?: Record<string, unknown>;
        }>;
    };
    results?: SarifResult[];
    invocations?: Array<{
        executionSuccessful?: boolean;
        startTimeUtc?: string;
        endTimeUtc?: string;
        commandLine?: string;
        workingDirectory?: SarifArtifactLocation;
    }>;
    automationDetails?: {
        id?: string;
        guid?: string;
    };
    originalUriBaseIds?: Record<string, { uri?: string }>;
    properties?: Record<string, unknown>;
}

export interface SarifLog {
    version?: string;
    $schema?: string;
    runs?: SarifRun[];
}

export interface Finding {
    ruleId: string;
    ruleName?: string;
    description?: string;
    severity: Severity;
    message: string;
    file: string;
    line: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    tool: string;
    toolVersion?: string;
    scanner?: string;
    sarifFile?: string;
    runIndex: number;
    resultIndex: number;
    baselineState?: string;
    suppressed: boolean;
    uniqueId: string;
    fingerprint: string;
    helpUri?: string;
    properties?: Record<string, unknown>;
}

export interface SeverityCounts {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
}

export interface QualityGateResult {
    passed: boolean;
    blocked: boolean;
    counts: SeverityCounts;
    findings: Finding[];
    threshold: Severity;
    failOnCount?: number;
    thresholdFindingCount: number;
    reasons: string[];
}

export interface SarifMetadata {
    file: string;
    version: string;
    runCount: number;
    resultCount: number;
    tools: string[];
    malformed?: boolean;
    error?: string;
}

export interface AggregationResult {
    findings: Finding[];
    metadata: SarifMetadata[];
    processedFiles: string[];
    skippedFiles: string[];
}

export interface ActionConfig {
    sarifFile: string;
    severityThreshold: Severity;
    mode: QualityGateMode;
    githubToken: string;
    prComment: boolean;
    failOnCount?: number;
    ignoreRuleIds: string[];
    ignorePaths: string[];
    deduplicate: boolean;
    enableAnnotations: boolean;
    enableStepSummary: boolean;
    markdownTemplate?: string;
    maxFindingsDisplay: number;
    jsonExportFile?: string;
}
