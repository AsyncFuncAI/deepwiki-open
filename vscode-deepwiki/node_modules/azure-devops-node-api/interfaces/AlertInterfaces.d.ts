import VSSInterfaces = require("../interfaces/common/VSSInterfaces");
export interface Alert {
    /**
     * Identifier for the alert. It is unqiue within Azure DevOps organization.
     */
    alertId?: number;
    /**
     * Type of the alert. E.g. secret, code, etc.
     */
    alertType?: AlertType;
    /**
     * Contains information for the dismissal of the alert if the alert has been dismissed.
     */
    dismissal?: Dismissal;
    /**
     * This value is computed and returned by the service. This value represents the first time the service has seen this issue reported in an analysis instance.
     */
    firstSeenDate?: Date;
    /**
     * This value is computed and returned by the service. If the issue is fixed, this value represents the time the service has seen this issue fixed in an analysis instance.
     */
    fixedDate?: Date;
    /**
     * Reference to a git object, e.g. branch ref.
     */
    gitRef?: string;
    /**
     * This value is computed and returned by the service. This value represents the first time the vulnerability was introduced.
     */
    introducedDate?: Date;
    /**
     * This value is computed and returned by the service. This value represents the last time the service has seen this issue reported in an analysis instance.
     */
    lastSeenDate?: Date;
    /**
     * Logical locations for the alert. This value is computed and returned by the service. It is a value based on the results from all analysis configurations. An example of a logical location is a component.
     */
    logicalLocations?: LogicalLocation[];
    /**
     * This value is computed and returned by the service. It is a value based on the results from all analysis configurations. An example of a physical location is a file location.
     */
    physicalLocations?: PhysicalLocation[];
    /**
     * Repository URL where the alert was detected.
     */
    repositoryUrl?: string;
    /**
     * Severity of the alert.
     */
    severity?: Severity;
    /**
     * This value is computed and returned by the service. It is a value based on the results from all analysis configurations.
     */
    state?: State;
    /**
     * Title will only be rendered as text and does not support markdown formatting. There is a maximum character limit of 256.
     */
    title?: string;
    /**
     * Tools that have detected this issue.
     */
    tools?: Tool[];
    /**
     * A truncated/obfuscated version of the secret pertaining to the alert (if applicable).
     */
    truncatedSecret?: string;
    /**
     * ValidationFingerprints for the secret liveness check. Only returned on demand in Get API with Expand parameter set to be ValidationFingerprint (not returned in List API)
     */
    validationFingerprints?: ValidationFingerprint[];
}
/**
 * Summary of the state of the alert for a given analysis configuration.
 */
export interface AlertAnalysisInstance {
    /**
     * Analysis configuration.
     */
    analysisConfiguration?: AnalysisConfiguration;
    /**
     * Analysis instance where the issue was first detected for a given analysis configuration.
     */
    firstSeen?: AnalysisInstance;
    /**
     * Analysis instance where the issue was fixed for a given analysis configuration.
     */
    fixedIn?: AnalysisInstance;
    /**
     * Analysis instance where the issue was last detected for a given analysis configuration.
     */
    lastSeen?: AnalysisInstance;
    /**
     * The most recent instatnce of the analysis.
     */
    recentAnalysisInstance?: AnalysisInstance;
    /**
     * Result state for a given analysis configuration.
     */
    state?: State;
}
export interface AlertStateUpdate {
    dismissedComment?: string;
    dismissedReason?: DismissalType;
    state?: State;
}
export declare enum AlertType {
    /**
     * The code has an unspecified vulnerability type
     */
    Unknown = 0,
    /**
     * The code uses a dependency with a known vulnerability.
     */
    Dependency = 1,
    /**
     * The code contains a secret that has now been compromised and must be revoked.
     */
    Secret = 2,
    /**
     * The code contains a weakness determined by static analysis.
     */
    Code = 3
}
/**
 * AnalysisConfiguration class models a build definition.
 */
export interface AnalysisConfiguration {
    /**
     * Details for the configuration. Populated values depend on the type of configuration.
     */
    analysisConfigurationDetails?: AnalysisConfigurationDetails;
    /**
     * Identifier for the analysis configuration.
     */
    analysisConfigurationId?: number;
    /**
     * Type of the configuration.
     */
    analysisConfigurationType?: AnalysisConfigurationType;
    /**
     * Name of the tool that ran on this configuration.
     */
    toolName?: string;
    /**
     * The latest version of the tool that ran on this configuration.
     */
    toolVersion?: string;
}
export interface AnalysisConfigurationDetails {
    /**
     * Reference to a git object, e.g. branch ref.
     */
    gitRef?: string;
    /**
     * Is this the default branch?
     */
    isDefaultBranch?: boolean;
    /**
     * Phase ID of the pipeline.
     */
    phaseId?: string;
    /**
     * Phase name.
     */
    phaseName?: string;
    /**
     * AzureDevOps pipeline id.
     */
    pipelineId?: number;
    /**
     * Name of the pipeline.
     */
    pipelineName?: string;
}
export declare enum AnalysisConfigurationType {
    /**
     * Default analysis configuration that is not attached to any other configuration data
     */
    Default = 0,
    /**
     * Ado Pipeline, contains branch, pipeline, phase, and ADOPipelineId
     */
    AdoPipeline = 1
}
/**
 * AnalysisInstance class models a build.
 */
export interface AnalysisInstance {
    /**
     * CommitId is a commit id for that instance
     */
    commitId?: string;
    /**
     * Analysis configuration.
     */
    configuration?: AnalysisConfiguration;
    /**
     * Date when the analysis was created.
     */
    createdDate?: Date;
    /**
     * InstanceIdentifier is a key that uniquely establishes this instance
     */
    instanceIdentifier?: string;
    /**
     * Results that were reported by the analysis.
     */
    results?: AnalysisResult[];
    /**
     * Url is the permalink to the build.
     */
    url?: string;
}
export interface AnalysisResult {
    analysisResultId?: number;
    firstIntroducedInstanceId?: number;
    fixedInstanceId?: number;
    introducedInstanceId?: number;
    lastSeenInstanceId?: number;
    result?: Result;
    state?: State;
}
export interface Branch {
    branchId?: number;
    deletedDate?: Date;
    name?: string;
}
/**
 * This enum defines the dependency components.
 */
export declare enum ComponentType {
    Unknown = 0,
    NuGet = 1,
    /**
     * Indicates the component is an Npm package.
     */
    Npm = 2,
    /**
     * Indicates the component is a Maven artifact.
     */
    Maven = 3,
    /**
     * Indicates the component is a Git repository.
     */
    Git = 4,
    /**
     * Indicates the component is not any of the supported component types by Governance.
     */
    Other = 5,
    /**
     * Indicates the component is a Ruby gem.
     */
    RubyGems = 6,
    /**
     * Indicates the component is a Cargo package.
     */
    Cargo = 7,
    /**
     * Indicates the component is a Pip package.
     */
    Pip = 8,
    /**
     * Indicates the component is a loose file. Not a package as understood by different package managers.
     */
    File = 9,
    /**
     * Indicates the component is a Go package.
     */
    Go = 10,
    /**
     * Indicates the component is a Docker Image
     */
    DockerImage = 11,
    /**
     * Indicates the component is a CocoaPods pod.
     */
    Pod = 12,
    /**
     * Indicates the component is found in a linux environment. A package understood by linux based package managers like apt and rpm.
     */
    Linux = 13,
    /**
     * Indicates the component is a Conda package.
     */
    Conda = 14,
    /**
     * Indicates the component is a Docker Reference.
     */
    DockerReference = 15,
    /**
     * Indicates the component is a Vcpkg Package.
     */
    Vcpkg = 16
}
/**
 * Information about a vulnerable dependency
 */
export interface Dependency {
    /**
     * Dependency name
     */
    componentName?: string;
    /**
     * Source of the dependency
     */
    componentType?: ComponentType;
    /**
     * Version information
     */
    componentVersion?: string;
    /**
     * Unique ID for the dependency
     */
    dependencyId?: number;
}
/**
 * An instance of a vulnerable dependency that was detected
 */
export interface DependencyResult {
    /**
     * Information about the vulnerable dependency that was found
     */
    dependency?: Dependency;
    /**
     * Unique ID for this dependency
     */
    dependencyResultId?: number;
    /**
     * ID for the Result that this instance belongs to
     */
    resultId?: number;
    /**
     * Heirarchal information when multiple instances are found
     */
    rootDependencyId?: number;
    /**
     * Information about where the dependency was found
     */
    versionControlFilePath?: VersionControlFilePath;
}
/**
 * Information about an alert dismissal
 */
export interface Dismissal {
    /**
     * Unique ID for this dismissal
     */
    dismissalId?: number;
    /**
     * Reason for the dismissal
     */
    dismissalType?: DismissalType;
    /**
     * Informational message attached to the dismissal
     */
    message?: string;
    requestedOn?: Date;
    /**
     * Identity that dismissed the alert
     */
    stateChangedBy?: string;
    /**
     * Identity that dismissed the alert
     */
    stateChangedByIdentity?: VSSInterfaces.IdentityRef;
}
export declare enum DismissalType {
    /**
     * Dismissal type unknown
     */
    Unknown = 0,
    /**
     * Dismissal indicating alert has been fixed
     */
    Fixed = 1,
    /**
     * Dismissal indicating user is accepting a risk for the alert
     */
    AcceptedRisk = 2,
    /**
     * Dismissal indicating alert is a false positive and will likely not be fixed.
     */
    FalsePositive = 3
}
export declare enum ExpandOption {
    /**
     * No Expands.
     */
    None = 0,
    /**
     * Return validationFingerprints in Alert.
     */
    ValidationFingerprint = 1
}
export interface LogicalLocation {
    fullyQualifiedName?: string;
    /**
     * Possible values: "unknown" "rootDependency" and "vulnerableDependency"
     */
    kind?: string;
}
/**
 * Location in the source control system where the issue was found
 */
export interface PhysicalLocation {
    /**
     * Path of the file where the issue was found
     */
    filePath?: string;
    /**
     * Details about the location where the issue was found including a snippet
     */
    region?: Region;
    /**
     * Source control system-specific information about the location
     */
    versionControl?: VersionControlDetails;
}
export interface Pipeline {
    adoPipelineId?: number;
    name?: string;
    phase?: string;
    phaseId?: string;
}
export interface Region {
    /**
     * The column where the code snippet ends
     */
    columnEnd?: number;
    /**
     * The column where the code snippet starts
     */
    columnStart?: number;
    /**
     * A subset of the code snippet highlighting the issue
     */
    highlightSnippet?: string;
    /**
     * The line number where the code snippet ends
     */
    lineEnd?: number;
    /**
     * The line number where the code snippet starts
     */
    lineStart?: number;
    /**
     * The full code snippet
     */
    snippet?: string;
}
export interface Result {
    /**
     * Additional information about the alert.  Valid when ResultType is Dependency
     */
    dependencyResult?: DependencyResult;
    /**
     * Full fingerprint of the Result.  This is used to detect duplicate instances of the same alert
     */
    fingerprint?: string;
    /**
     * Unique ID of the fingerprint of the Result
     */
    fingerprintId?: number;
    /**
     * Unique ID of the Result
     */
    resultId?: number;
    /**
     * This is the index into the SARIF Results array. If we have to do any tool specific insertions, we'll use this key to index back into the SARIF Results array.
     */
    resultIndex?: number;
    /**
     * Detailed description of the rule that triggered the alert
     */
    resultMessage?: string;
    /**
     * The type of rule that triggered the alert
     */
    resultType?: ResultType;
    /**
     * ID of the rule that the triggered the alert
     */
    ruleId?: number;
    /**
     * Short description of the rule that triggered the alert
     */
    ruleShortDescription?: string;
    /**
     * The severity of the alert
     */
    severity?: Severity;
    /**
     * Additional information about the alert.  Valid when ResultType is VersionControl
     */
    versionControlResult?: VersionControlResult;
}
/**
 * This enum defines the different result types.
 */
export declare enum ResultType {
    /**
     * The result was found from an unspecified analysis type
     */
    Unknown = 0,
    /**
     * The result was found from dependency analysis
     */
    Dependency = 1,
    /**
     * The result was found from static code analysis
     */
    VersionControl = 2
}
/**
 * The analysis rule that caused the alert.
 */
export interface Rule {
    /**
     * Additional properties of this rule dependent on the rule type.  For example, dependency rules may include the CVE ID if it is available.
     */
    additionalProperties?: {
        [key: string]: any;
    };
    /**
     * Description of what this rule detects
     */
    description?: string;
    /**
     * Plain-text rule identifier
     */
    friendlyName?: string;
    /**
     * Additional information about this rule
     */
    helpMessage?: string;
    /**
     * Tool-specific rule identifier
     */
    opaqueId?: string;
    /**
     * Markdown-formatted list of resources to learn more about the Rule. In some cases, RuleInfo.AdditionalProperties.advisoryUrls is used instead.
     */
    resources?: string;
    /**
     * Classification tags for this rule
     */
    tags?: string[];
}
export declare enum SarifJobStatus {
    /**
     * The job type when it is new
     */
    New = 0,
    /**
     * The job type when it is queued
     */
    Queued = 1,
    /**
     * The job type when it is completed
     */
    Completed = 2,
    /**
     * The job type when it fails
     */
    Failed = 3
}
export interface SarifUploadStatus {
    errors?: SarifValidationError[];
    processingStatus?: SarifJobStatus;
}
export interface SarifValidationError {
    nodePointer?: string;
    validationError?: string;
}
export interface SearchCriteria {
    /**
     * If provided, only return alerts of this type. Otherwise, return alerts of all types.
     */
    alertType?: AlertType;
    /**
     * If provided, only alerts for this dependency are returned. <br />Otherwise, return alerts for all dependencies. <br />In a sarif submission, a dependency (or a vulnerable component) is specified in result.RelatedLocations[].logicalLocation.
     */
    dependencyName?: string;
    /**
     * If provided, only return alerts last seen after this date. <br />Otherwise return all alerts.
     */
    fromDate?: Date;
    /**
     * If provided, only return alerts whose titles match this pattern.
     */
    keywords?: string;
    /**
     * If provided, only return alerts that were modified since this date. <br />Otherwise return all alerts.
     */
    modifiedSince?: Date;
    /**
     * If true, only return alerts found on the default branch of the repository. <br />If there have been no runs completed on the default branch, the last run is used instead regardless of the branch used for that run. <br />This option is ignored if ref is provided.
     */
    onlyDefaultBranchAlerts?: boolean;
    /**
     * If provided with pipelineName, only return alerts detected in this pipeline phase <br />Otherwise, return alerts detected in all phases.
     */
    phaseId?: string;
    /**
     * If provided with pipelineName, only return alerts detected in this pipeline phase <br />Otherwise, return alerts detected in all phases.
     */
    phaseName?: string;
    /**
     * If provided, only return alerts detected in this pipeline. <br />Otherwise, return alerts detected in all pipelines.
     */
    pipelineName?: string;
    /**
     * If provided, only include alerts for this ref. <br />If not provided and OnlyDefaultBranch is true, only include alerts found on the default branch or last run branch if there is no analysis configuration for the default branch. <br />Otherwise, include alerts from all branches.
     */
    ref?: string;
    /**
     * If provided, only return alerts for this rule. <br />Otherwise, return alerts of all rules.
     */
    ruleId?: string;
    /**
     * If provided, only return alerts for this rule. <br />Otherwise, return alerts for all rules.
     */
    ruleName?: string;
    /**
     * If provided, only return alerts at these severities. <br />Otherwise, return alerts at any serverity.
     */
    severities?: Severity[];
    /**
     * If provided, only return alerts in these states. <br />Otherwise, return alerts in any state.
     */
    states?: State[];
    /**
     * If provided, only return alerts last seen before this date. <br />Otherwise return all alerts.
     */
    toDate?: Date;
    /**
     * If provided with toolName, only return alerts detected by this tool. <br />Otherwise, return alerts detected by all tools.
     */
    toolName?: string;
}
export declare enum Severity {
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3,
    Note = 4,
    Warning = 5,
    Error = 6
}
export declare enum State {
    /**
     * Alert is in an indeterminate state
     */
    Unknown = 0,
    /**
     * Alert has been detected in the code
     */
    Active = 1,
    /**
     * Alert was dismissed by a user
     */
    Dismissed = 2,
    /**
     * The issue is no longer detected in the code
     */
    Fixed = 4,
    /**
     * The tool has determined that the issue is no longer a risk
     */
    AutoDismissed = 8
}
/**
 * An Analysis tool that can generate security alerts
 */
export interface Tool {
    /**
     * Name of the tool
     */
    name?: string;
    /**
     * The rules that the tool defines
     */
    rules?: Rule[];
}
export interface UxFilters {
    /**
     * Branches to display alerts for.  If empty, show alerts from all branches
     */
    branches?: Branch[];
    packages?: Dependency[];
    /**
     * Pipelines to show alerts for.  If empty, show alerts for all pipelines
     */
    pipelines?: Pipeline[];
    progressPercentage?: number;
    rules?: Rule[];
    secretTypes?: string[];
    /**
     * Alert severities to show.  If empty show all alert servities
     */
    severities?: Severity[];
    /**
     * Alert states to show.  If empty show all alert states
     */
    states?: State[];
    tools?: Tool[];
}
export interface ValidationFingerprint {
    validationFingerprintHash?: string;
    validationFingerprintJson?: string;
}
/**
 * Information for locating files in a source control system
 */
export interface VersionControlDetails {
    commitHash?: string;
    itemUrl?: string;
}
export interface VersionControlFilePath {
    /**
     * Path of the file in the version control system
     */
    filePath?: string;
    /**
     * Hash of the file in the version control system
     */
    filePathHash?: number[];
    /**
     * Unique ID for the file in the version control system
     */
    versionControlFilePathId?: number;
}
export interface VersionControlResult {
    /**
     * The ID to associate this structure with the cooresponding Result
     */
    resultId?: number;
    /**
     * Information about the snippet where the Result was found
     */
    versionControlSnippet?: VersionControlSnippet;
}
export interface VersionControlSnippet {
    /**
     * column in the code file where the snippet ends
     */
    endColumn?: number;
    /**
     * line in the code file where the snippet ends
     */
    endLine?: number;
    /**
     * subset of the code snippet highlighting the alert issue
     */
    highlightSnippet?: string;
    /**
     * larger code snippet
     */
    snippet?: string;
    /**
     * column in the code file where the snippet starts
     */
    startColumn?: number;
    /**
     * line in the code file where the snippet starts
     */
    startLine?: number;
    /**
     * Version control system where the code was found
     */
    versionControl?: string;
    /**
     * path of the code file in the version control system
     */
    versionControlFilePath?: VersionControlFilePath;
    /**
     * Unique Id number for the file path
     */
    versionControlFilePathId?: number;
    /**
     * Unique Id number for this snippet
     */
    versionControlSnippetId?: number;
}
export declare var TypeInfo: {
    Alert: any;
    AlertAnalysisInstance: any;
    AlertStateUpdate: any;
    AlertType: {
        enumValues: {
            "unknown": number;
            "dependency": number;
            "secret": number;
            "code": number;
        };
    };
    AnalysisConfiguration: any;
    AnalysisConfigurationType: {
        enumValues: {
            "default": number;
            "adoPipeline": number;
        };
    };
    AnalysisInstance: any;
    AnalysisResult: any;
    Branch: any;
    ComponentType: {
        enumValues: {
            "unknown": number;
            "nuGet": number;
            "npm": number;
            "maven": number;
            "git": number;
            "other": number;
            "rubyGems": number;
            "cargo": number;
            "pip": number;
            "file": number;
            "go": number;
            "dockerImage": number;
            "pod": number;
            "linux": number;
            "conda": number;
            "dockerReference": number;
            "vcpkg": number;
        };
    };
    Dependency: any;
    DependencyResult: any;
    Dismissal: any;
    DismissalType: {
        enumValues: {
            "unknown": number;
            "fixed": number;
            "acceptedRisk": number;
            "falsePositive": number;
        };
    };
    ExpandOption: {
        enumValues: {
            "none": number;
            "validationFingerprint": number;
        };
    };
    Result: any;
    ResultType: {
        enumValues: {
            "unknown": number;
            "dependency": number;
            "versionControl": number;
        };
    };
    SarifJobStatus: {
        enumValues: {
            "new": number;
            "queued": number;
            "completed": number;
            "failed": number;
        };
    };
    SarifUploadStatus: any;
    SearchCriteria: any;
    Severity: {
        enumValues: {
            "low": number;
            "medium": number;
            "high": number;
            "critical": number;
            "note": number;
            "warning": number;
            "error": number;
        };
    };
    State: {
        enumValues: {
            "unknown": number;
            "active": number;
            "dismissed": number;
            "fixed": number;
            "autoDismissed": number;
        };
    };
    UxFilters: any;
};
