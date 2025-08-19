/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 *
 * ---------------------------------------------------------
 * Generated file, DO NOT EDIT
 * ---------------------------------------------------------
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AlertType;
(function (AlertType) {
    /**
     * The code has an unspecified vulnerability type
     */
    AlertType[AlertType["Unknown"] = 0] = "Unknown";
    /**
     * The code uses a dependency with a known vulnerability.
     */
    AlertType[AlertType["Dependency"] = 1] = "Dependency";
    /**
     * The code contains a secret that has now been compromised and must be revoked.
     */
    AlertType[AlertType["Secret"] = 2] = "Secret";
    /**
     * The code contains a weakness determined by static analysis.
     */
    AlertType[AlertType["Code"] = 3] = "Code";
})(AlertType = exports.AlertType || (exports.AlertType = {}));
var AnalysisConfigurationType;
(function (AnalysisConfigurationType) {
    /**
     * Default analysis configuration that is not attached to any other configuration data
     */
    AnalysisConfigurationType[AnalysisConfigurationType["Default"] = 0] = "Default";
    /**
     * Ado Pipeline, contains branch, pipeline, phase, and ADOPipelineId
     */
    AnalysisConfigurationType[AnalysisConfigurationType["AdoPipeline"] = 1] = "AdoPipeline";
})(AnalysisConfigurationType = exports.AnalysisConfigurationType || (exports.AnalysisConfigurationType = {}));
/**
 * This enum defines the dependency components.
 */
var ComponentType;
(function (ComponentType) {
    ComponentType[ComponentType["Unknown"] = 0] = "Unknown";
    ComponentType[ComponentType["NuGet"] = 1] = "NuGet";
    /**
     * Indicates the component is an Npm package.
     */
    ComponentType[ComponentType["Npm"] = 2] = "Npm";
    /**
     * Indicates the component is a Maven artifact.
     */
    ComponentType[ComponentType["Maven"] = 3] = "Maven";
    /**
     * Indicates the component is a Git repository.
     */
    ComponentType[ComponentType["Git"] = 4] = "Git";
    /**
     * Indicates the component is not any of the supported component types by Governance.
     */
    ComponentType[ComponentType["Other"] = 5] = "Other";
    /**
     * Indicates the component is a Ruby gem.
     */
    ComponentType[ComponentType["RubyGems"] = 6] = "RubyGems";
    /**
     * Indicates the component is a Cargo package.
     */
    ComponentType[ComponentType["Cargo"] = 7] = "Cargo";
    /**
     * Indicates the component is a Pip package.
     */
    ComponentType[ComponentType["Pip"] = 8] = "Pip";
    /**
     * Indicates the component is a loose file. Not a package as understood by different package managers.
     */
    ComponentType[ComponentType["File"] = 9] = "File";
    /**
     * Indicates the component is a Go package.
     */
    ComponentType[ComponentType["Go"] = 10] = "Go";
    /**
     * Indicates the component is a Docker Image
     */
    ComponentType[ComponentType["DockerImage"] = 11] = "DockerImage";
    /**
     * Indicates the component is a CocoaPods pod.
     */
    ComponentType[ComponentType["Pod"] = 12] = "Pod";
    /**
     * Indicates the component is found in a linux environment. A package understood by linux based package managers like apt and rpm.
     */
    ComponentType[ComponentType["Linux"] = 13] = "Linux";
    /**
     * Indicates the component is a Conda package.
     */
    ComponentType[ComponentType["Conda"] = 14] = "Conda";
    /**
     * Indicates the component is a Docker Reference.
     */
    ComponentType[ComponentType["DockerReference"] = 15] = "DockerReference";
    /**
     * Indicates the component is a Vcpkg Package.
     */
    ComponentType[ComponentType["Vcpkg"] = 16] = "Vcpkg";
})(ComponentType = exports.ComponentType || (exports.ComponentType = {}));
var DismissalType;
(function (DismissalType) {
    /**
     * Dismissal type unknown
     */
    DismissalType[DismissalType["Unknown"] = 0] = "Unknown";
    /**
     * Dismissal indicating alert has been fixed
     */
    DismissalType[DismissalType["Fixed"] = 1] = "Fixed";
    /**
     * Dismissal indicating user is accepting a risk for the alert
     */
    DismissalType[DismissalType["AcceptedRisk"] = 2] = "AcceptedRisk";
    /**
     * Dismissal indicating alert is a false positive and will likely not be fixed.
     */
    DismissalType[DismissalType["FalsePositive"] = 3] = "FalsePositive";
})(DismissalType = exports.DismissalType || (exports.DismissalType = {}));
var ExpandOption;
(function (ExpandOption) {
    /**
     * No Expands.
     */
    ExpandOption[ExpandOption["None"] = 0] = "None";
    /**
     * Return validationFingerprints in Alert.
     */
    ExpandOption[ExpandOption["ValidationFingerprint"] = 1] = "ValidationFingerprint";
})(ExpandOption = exports.ExpandOption || (exports.ExpandOption = {}));
/**
 * This enum defines the different result types.
 */
var ResultType;
(function (ResultType) {
    /**
     * The result was found from an unspecified analysis type
     */
    ResultType[ResultType["Unknown"] = 0] = "Unknown";
    /**
     * The result was found from dependency analysis
     */
    ResultType[ResultType["Dependency"] = 1] = "Dependency";
    /**
     * The result was found from static code analysis
     */
    ResultType[ResultType["VersionControl"] = 2] = "VersionControl";
})(ResultType = exports.ResultType || (exports.ResultType = {}));
var SarifJobStatus;
(function (SarifJobStatus) {
    /**
     * The job type when it is new
     */
    SarifJobStatus[SarifJobStatus["New"] = 0] = "New";
    /**
     * The job type when it is queued
     */
    SarifJobStatus[SarifJobStatus["Queued"] = 1] = "Queued";
    /**
     * The job type when it is completed
     */
    SarifJobStatus[SarifJobStatus["Completed"] = 2] = "Completed";
    /**
     * The job type when it fails
     */
    SarifJobStatus[SarifJobStatus["Failed"] = 3] = "Failed";
})(SarifJobStatus = exports.SarifJobStatus || (exports.SarifJobStatus = {}));
var Severity;
(function (Severity) {
    Severity[Severity["Low"] = 0] = "Low";
    Severity[Severity["Medium"] = 1] = "Medium";
    Severity[Severity["High"] = 2] = "High";
    Severity[Severity["Critical"] = 3] = "Critical";
    Severity[Severity["Note"] = 4] = "Note";
    Severity[Severity["Warning"] = 5] = "Warning";
    Severity[Severity["Error"] = 6] = "Error";
})(Severity = exports.Severity || (exports.Severity = {}));
var State;
(function (State) {
    /**
     * Alert is in an indeterminate state
     */
    State[State["Unknown"] = 0] = "Unknown";
    /**
     * Alert has been detected in the code
     */
    State[State["Active"] = 1] = "Active";
    /**
     * Alert was dismissed by a user
     */
    State[State["Dismissed"] = 2] = "Dismissed";
    /**
     * The issue is no longer detected in the code
     */
    State[State["Fixed"] = 4] = "Fixed";
    /**
     * The tool has determined that the issue is no longer a risk
     */
    State[State["AutoDismissed"] = 8] = "AutoDismissed";
})(State = exports.State || (exports.State = {}));
exports.TypeInfo = {
    Alert: {},
    AlertAnalysisInstance: {},
    AlertStateUpdate: {},
    AlertType: {
        enumValues: {
            "unknown": 0,
            "dependency": 1,
            "secret": 2,
            "code": 3
        }
    },
    AnalysisConfiguration: {},
    AnalysisConfigurationType: {
        enumValues: {
            "default": 0,
            "adoPipeline": 1
        }
    },
    AnalysisInstance: {},
    AnalysisResult: {},
    Branch: {},
    ComponentType: {
        enumValues: {
            "unknown": 0,
            "nuGet": 1,
            "npm": 2,
            "maven": 3,
            "git": 4,
            "other": 5,
            "rubyGems": 6,
            "cargo": 7,
            "pip": 8,
            "file": 9,
            "go": 10,
            "dockerImage": 11,
            "pod": 12,
            "linux": 13,
            "conda": 14,
            "dockerReference": 15,
            "vcpkg": 16
        }
    },
    Dependency: {},
    DependencyResult: {},
    Dismissal: {},
    DismissalType: {
        enumValues: {
            "unknown": 0,
            "fixed": 1,
            "acceptedRisk": 2,
            "falsePositive": 3
        }
    },
    ExpandOption: {
        enumValues: {
            "none": 0,
            "validationFingerprint": 1
        }
    },
    Result: {},
    ResultType: {
        enumValues: {
            "unknown": 0,
            "dependency": 1,
            "versionControl": 2
        }
    },
    SarifJobStatus: {
        enumValues: {
            "new": 0,
            "queued": 1,
            "completed": 2,
            "failed": 3
        }
    },
    SarifUploadStatus: {},
    SearchCriteria: {},
    Severity: {
        enumValues: {
            "low": 0,
            "medium": 1,
            "high": 2,
            "critical": 3,
            "note": 4,
            "warning": 5,
            "error": 6
        }
    },
    State: {
        enumValues: {
            "unknown": 0,
            "active": 1,
            "dismissed": 2,
            "fixed": 4,
            "autoDismissed": 8
        }
    },
    UxFilters: {},
};
exports.TypeInfo.Alert.fields = {
    alertType: {
        enumType: exports.TypeInfo.AlertType
    },
    dismissal: {
        typeInfo: exports.TypeInfo.Dismissal
    },
    firstSeenDate: {
        isDate: true,
    },
    fixedDate: {
        isDate: true,
    },
    introducedDate: {
        isDate: true,
    },
    lastSeenDate: {
        isDate: true,
    },
    severity: {
        enumType: exports.TypeInfo.Severity
    },
    state: {
        enumType: exports.TypeInfo.State
    }
};
exports.TypeInfo.AlertAnalysisInstance.fields = {
    analysisConfiguration: {
        typeInfo: exports.TypeInfo.AnalysisConfiguration
    },
    firstSeen: {
        typeInfo: exports.TypeInfo.AnalysisInstance
    },
    fixedIn: {
        typeInfo: exports.TypeInfo.AnalysisInstance
    },
    lastSeen: {
        typeInfo: exports.TypeInfo.AnalysisInstance
    },
    recentAnalysisInstance: {
        typeInfo: exports.TypeInfo.AnalysisInstance
    },
    state: {
        enumType: exports.TypeInfo.State
    }
};
exports.TypeInfo.AlertStateUpdate.fields = {
    dismissedReason: {
        enumType: exports.TypeInfo.DismissalType
    },
    state: {
        enumType: exports.TypeInfo.State
    }
};
exports.TypeInfo.AnalysisConfiguration.fields = {
    analysisConfigurationType: {
        enumType: exports.TypeInfo.AnalysisConfigurationType
    }
};
exports.TypeInfo.AnalysisInstance.fields = {
    configuration: {
        typeInfo: exports.TypeInfo.AnalysisConfiguration
    },
    createdDate: {
        isDate: true,
    },
    results: {
        isArray: true,
        typeInfo: exports.TypeInfo.AnalysisResult
    }
};
exports.TypeInfo.AnalysisResult.fields = {
    result: {
        typeInfo: exports.TypeInfo.Result
    },
    state: {
        enumType: exports.TypeInfo.State
    }
};
exports.TypeInfo.Branch.fields = {
    deletedDate: {
        isDate: true,
    }
};
exports.TypeInfo.Dependency.fields = {
    componentType: {
        enumType: exports.TypeInfo.ComponentType
    }
};
exports.TypeInfo.DependencyResult.fields = {
    dependency: {
        typeInfo: exports.TypeInfo.Dependency
    }
};
exports.TypeInfo.Dismissal.fields = {
    dismissalType: {
        enumType: exports.TypeInfo.DismissalType
    },
    requestedOn: {
        isDate: true,
    }
};
exports.TypeInfo.Result.fields = {
    dependencyResult: {
        typeInfo: exports.TypeInfo.DependencyResult
    },
    resultType: {
        enumType: exports.TypeInfo.ResultType
    },
    severity: {
        enumType: exports.TypeInfo.Severity
    }
};
exports.TypeInfo.SarifUploadStatus.fields = {
    processingStatus: {
        enumType: exports.TypeInfo.SarifJobStatus
    }
};
exports.TypeInfo.SearchCriteria.fields = {
    alertType: {
        enumType: exports.TypeInfo.AlertType
    },
    fromDate: {
        isDate: true,
    },
    modifiedSince: {
        isDate: true,
    },
    severities: {
        isArray: true,
        enumType: exports.TypeInfo.Severity
    },
    states: {
        isArray: true,
        enumType: exports.TypeInfo.State
    },
    toDate: {
        isDate: true,
    }
};
exports.TypeInfo.UxFilters.fields = {
    branches: {
        isArray: true,
        typeInfo: exports.TypeInfo.Branch
    },
    packages: {
        isArray: true,
        typeInfo: exports.TypeInfo.Dependency
    },
    severities: {
        isArray: true,
        enumType: exports.TypeInfo.Severity
    },
    states: {
        isArray: true,
        enumType: exports.TypeInfo.State
    }
};
