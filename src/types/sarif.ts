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
    level?: 'error' | 'warning' | 'note' | 'none';
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
    properties?: Record<string, any>;
}

export interface SarifRule {
    id?: string;
    name?: string;
    shortDescription?: SarifMessage;
    fullDescription?: SarifMessage;
    helpUri?: string;
    help?: SarifMessage;
    properties?: Record<string, any>;
}

export interface SarifRun {
    tool?: {
        driver?: {
            name?: string;
            version?: string;
            informationUri?: string;
            rules?: SarifRule[];
            properties?: Record<string, any>;
        };
    };
    results?: SarifResult[];
    properties?: Record<string, any>;
}

export interface SarifLog {
    version?: string;
    $schema?: string;
    runs?: SarifRun[];
}

export interface Finding {
    ruleId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    file: string;
    line: number;
    column?: number;
    tool: string;
    uniqueId: string;
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
    counts: SeverityCounts;
    findings: Finding[];
    threshold: string;
    failOnCount?: number;
}