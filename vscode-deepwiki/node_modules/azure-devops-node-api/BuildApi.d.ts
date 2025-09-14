/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import BuildInterfaces = require("./interfaces/BuildInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface IBuildApi extends basem.ClientApiBase {
    createArtifact(artifact: BuildInterfaces.BuildArtifact, project: string, buildId: number): Promise<BuildInterfaces.BuildArtifact>;
    getArtifact(project: string, buildId: number, artifactName: string): Promise<BuildInterfaces.BuildArtifact>;
    getArtifactContentZip(project: string, buildId: number, artifactName: string): Promise<NodeJS.ReadableStream>;
    getArtifacts(project: string, buildId: number): Promise<BuildInterfaces.BuildArtifact[]>;
    getFile(project: string, buildId: number, artifactName: string, fileId: string, fileName: string): Promise<NodeJS.ReadableStream>;
    getAttachments(project: string, buildId: number, type: string): Promise<BuildInterfaces.Attachment[]>;
    getAttachment(project: string, buildId: number, timelineId: string, recordId: string, type: string, name: string): Promise<NodeJS.ReadableStream>;
    authorizeProjectResources(resources: BuildInterfaces.DefinitionResourceReference[], project: string): Promise<BuildInterfaces.DefinitionResourceReference[]>;
    getProjectResources(project: string, type?: string, id?: string): Promise<BuildInterfaces.DefinitionResourceReference[]>;
    getBadge(project: string, definitionId: number, branchName?: string): Promise<string>;
    listBranches(project: string, providerName: string, serviceEndpointId?: string, repository?: string, branchName?: string): Promise<string[]>;
    getBuildBadge(project: string, repoType: string, repoId?: string, branchName?: string): Promise<BuildInterfaces.BuildBadge>;
    getBuildBadgeData(project: string, repoType: string, repoId?: string, branchName?: string): Promise<string>;
    getRetentionLeasesForBuild(project: string, buildId: number): Promise<BuildInterfaces.RetentionLease[]>;
    deleteBuild(project: string, buildId: number): Promise<void>;
    getBuild(project: string, buildId: number, propertyFilters?: string): Promise<BuildInterfaces.Build>;
    getBuilds(project: string, definitions?: number[], queues?: number[], buildNumber?: string, minTime?: Date, maxTime?: Date, requestedFor?: string, reasonFilter?: BuildInterfaces.BuildReason, statusFilter?: BuildInterfaces.BuildStatus, resultFilter?: BuildInterfaces.BuildResult, tagFilters?: string[], properties?: string[], top?: number, continuationToken?: string, maxBuildsPerDefinition?: number, deletedFilter?: BuildInterfaces.QueryDeletedOption, queryOrder?: BuildInterfaces.BuildQueryOrder, branchName?: string, buildIds?: number[], repositoryId?: string, repositoryType?: string): Promise<VSSInterfaces.PagedList<BuildInterfaces.Build>>;
    queueBuild(build: BuildInterfaces.Build, project: string, ignoreWarnings?: boolean, checkInTicket?: string, sourceBuildId?: number, definitionId?: number): Promise<BuildInterfaces.Build>;
    updateBuild(build: BuildInterfaces.Build, project: string, buildId: number, retry?: boolean): Promise<BuildInterfaces.Build>;
    updateBuilds(builds: BuildInterfaces.Build[], project: string): Promise<BuildInterfaces.Build[]>;
    getBuildChanges(project: string, buildId: number, continuationToken?: string, top?: number, includeSourceChange?: boolean): Promise<VSSInterfaces.PagedList<BuildInterfaces.Change>>;
    getChangesBetweenBuilds(project: string, fromBuildId?: number, toBuildId?: number, top?: number): Promise<BuildInterfaces.Change[]>;
    getBuildController(controllerId: number): Promise<BuildInterfaces.BuildController>;
    getBuildControllers(name?: string): Promise<BuildInterfaces.BuildController[]>;
    createDefinition(definition: BuildInterfaces.BuildDefinition, project: string, definitionToCloneId?: number, definitionToCloneRevision?: number): Promise<BuildInterfaces.BuildDefinition>;
    deleteDefinition(project: string, definitionId: number): Promise<void>;
    getDefinition(project: string, definitionId: number, revision?: number, minMetricsTime?: Date, propertyFilters?: string[], includeLatestBuilds?: boolean): Promise<BuildInterfaces.BuildDefinition>;
    getDefinitions(project: string, name?: string, repositoryId?: string, repositoryType?: string, queryOrder?: BuildInterfaces.DefinitionQueryOrder, top?: number, continuationToken?: string, minMetricsTime?: Date, definitionIds?: number[], path?: string, builtAfter?: Date, notBuiltAfter?: Date, includeAllProperties?: boolean, includeLatestBuilds?: boolean, taskIdFilter?: string, processType?: number, yamlFilename?: string): Promise<VSSInterfaces.PagedList<BuildInterfaces.BuildDefinitionReference>>;
    restoreDefinition(project: string, definitionId: number, deleted: boolean): Promise<BuildInterfaces.BuildDefinition>;
    updateDefinition(definition: BuildInterfaces.BuildDefinition, project: string, definitionId: number, secretsSourceDefinitionId?: number, secretsSourceDefinitionRevision?: number): Promise<BuildInterfaces.BuildDefinition>;
    getFileContents(project: string, providerName: string, serviceEndpointId?: string, repository?: string, commitOrBranch?: string, path?: string): Promise<NodeJS.ReadableStream>;
    createFolder(folder: BuildInterfaces.Folder, project: string, path: string): Promise<BuildInterfaces.Folder>;
    deleteFolder(project: string, path: string): Promise<void>;
    getFolders(project: string, path?: string, queryOrder?: BuildInterfaces.FolderQueryOrder): Promise<BuildInterfaces.Folder[]>;
    updateFolder(folder: BuildInterfaces.Folder, project: string, path: string): Promise<BuildInterfaces.Folder>;
    getBuildGeneralSettings(project: string): Promise<BuildInterfaces.PipelineGeneralSettings>;
    updateBuildGeneralSettings(newSettings: BuildInterfaces.PipelineGeneralSettings, project: string): Promise<BuildInterfaces.PipelineGeneralSettings>;
    getRetentionHistory(daysToLookback?: number): Promise<BuildInterfaces.BuildRetentionHistory>;
    getLatestBuild(project: string, definition: string, branchName?: string): Promise<BuildInterfaces.Build>;
    addRetentionLeases(newLeases: BuildInterfaces.NewRetentionLease[], project: string): Promise<BuildInterfaces.RetentionLease[]>;
    deleteRetentionLeasesById(project: string, ids: number[]): Promise<void>;
    getRetentionLease(project: string, leaseId: number): Promise<BuildInterfaces.RetentionLease>;
    getRetentionLeasesByMinimalRetentionLeases(project: string, leasesToFetch: BuildInterfaces.MinimalRetentionLease[]): Promise<BuildInterfaces.RetentionLease[]>;
    getRetentionLeasesByOwnerId(project: string, ownerId?: string, definitionId?: number, runId?: number): Promise<BuildInterfaces.RetentionLease[]>;
    getRetentionLeasesByUserId(project: string, userOwnerId: string, definitionId?: number, runId?: number): Promise<BuildInterfaces.RetentionLease[]>;
    updateRetentionLease(leaseUpdate: BuildInterfaces.RetentionLeaseUpdate, project: string, leaseId: number): Promise<BuildInterfaces.RetentionLease>;
    getBuildLog(project: string, buildId: number, logId: number, startLine?: number, endLine?: number): Promise<NodeJS.ReadableStream>;
    getBuildLogLines(project: string, buildId: number, logId: number, startLine?: number, endLine?: number): Promise<string[]>;
    getBuildLogs(project: string, buildId: number): Promise<BuildInterfaces.BuildLog[]>;
    getBuildLogsZip(project: string, buildId: number): Promise<NodeJS.ReadableStream>;
    getBuildLogZip(project: string, buildId: number, logId: number, startLine?: number, endLine?: number): Promise<NodeJS.ReadableStream>;
    getProjectMetrics(project: string, metricAggregationType?: string, minMetricsTime?: Date): Promise<BuildInterfaces.BuildMetric[]>;
    getDefinitionMetrics(project: string, definitionId: number, minMetricsTime?: Date): Promise<BuildInterfaces.BuildMetric[]>;
    getBuildOptionDefinitions(project?: string): Promise<BuildInterfaces.BuildOptionDefinition[]>;
    getPathContents(project: string, providerName: string, serviceEndpointId?: string, repository?: string, commitOrBranch?: string, path?: string): Promise<BuildInterfaces.SourceRepositoryItem[]>;
    getBuildProperties(project: string, buildId: number, filter?: string[]): Promise<any>;
    updateBuildProperties(customHeaders: any, document: VSSInterfaces.JsonPatchDocument, project: string, buildId: number): Promise<any>;
    getDefinitionProperties(project: string, definitionId: number, filter?: string[]): Promise<any>;
    updateDefinitionProperties(customHeaders: any, document: VSSInterfaces.JsonPatchDocument, project: string, definitionId: number): Promise<any>;
    getPullRequest(project: string, providerName: string, pullRequestId: string, repositoryId?: string, serviceEndpointId?: string): Promise<BuildInterfaces.PullRequest>;
    getBuildReport(project: string, buildId: number, type?: string): Promise<BuildInterfaces.BuildReportMetadata>;
    getBuildReportHtmlContent(project: string, buildId: number, type?: string): Promise<NodeJS.ReadableStream>;
    listRepositories(project: string, providerName: string, serviceEndpointId?: string, repository?: string, resultSet?: BuildInterfaces.ResultSet, pageResults?: boolean, continuationToken?: string): Promise<BuildInterfaces.SourceRepositories>;
    authorizeDefinitionResources(resources: BuildInterfaces.DefinitionResourceReference[], project: string, definitionId: number): Promise<BuildInterfaces.DefinitionResourceReference[]>;
    getDefinitionResources(project: string, definitionId: number): Promise<BuildInterfaces.DefinitionResourceReference[]>;
    getResourceUsage(): Promise<BuildInterfaces.BuildResourceUsage>;
    getRetentionSettings(project: string): Promise<BuildInterfaces.ProjectRetentionSetting>;
    updateRetentionSettings(updateModel: BuildInterfaces.UpdateProjectRetentionSettingModel, project: string): Promise<BuildInterfaces.ProjectRetentionSetting>;
    getDefinitionRevisions(project: string, definitionId: number): Promise<BuildInterfaces.BuildDefinitionRevision[]>;
    getBuildSettings(project?: string): Promise<BuildInterfaces.BuildSettings>;
    updateBuildSettings(settings: BuildInterfaces.BuildSettings, project?: string): Promise<BuildInterfaces.BuildSettings>;
    listSourceProviders(project: string): Promise<BuildInterfaces.SourceProviderAttributes[]>;
    updateStage(updateParameters: BuildInterfaces.UpdateStageParameters, buildId: number, stageRefName: string, project?: string): Promise<void>;
    getStatusBadge(project: string, definition: string, branchName?: string, stageName?: string, jobName?: string, configuration?: string, label?: string): Promise<string>;
    addBuildTag(project: string, buildId: number, tag: string): Promise<string[]>;
    addBuildTags(tags: string[], project: string, buildId: number): Promise<string[]>;
    deleteBuildTag(project: string, buildId: number, tag: string): Promise<string[]>;
    getBuildTags(project: string, buildId: number): Promise<string[]>;
    updateBuildTags(updateParameters: BuildInterfaces.UpdateTagParameters, project: string, buildId: number): Promise<string[]>;
    addDefinitionTag(project: string, definitionId: number, tag: string): Promise<string[]>;
    addDefinitionTags(tags: string[], project: string, definitionId: number): Promise<string[]>;
    deleteDefinitionTag(project: string, definitionId: number, tag: string): Promise<string[]>;
    getDefinitionTags(project: string, definitionId: number, revision?: number): Promise<string[]>;
    updateDefinitionTags(updateParameters: BuildInterfaces.UpdateTagParameters, project: string, definitionId: number): Promise<string[]>;
    deleteTag(project: string, tag: string): Promise<string[]>;
    getTags(project: string): Promise<string[]>;
    deleteTemplate(project: string, templateId: string): Promise<void>;
    getTemplate(project: string, templateId: string): Promise<BuildInterfaces.BuildDefinitionTemplate>;
    getTemplates(project: string): Promise<BuildInterfaces.BuildDefinitionTemplate[]>;
    saveTemplate(template: BuildInterfaces.BuildDefinitionTemplate, project: string, templateId: string): Promise<BuildInterfaces.BuildDefinitionTemplate>;
    getBuildTimeline(project: string, buildId: number, timelineId?: string, changeId?: number, planId?: string): Promise<BuildInterfaces.Timeline>;
    restoreWebhooks(triggerTypes: BuildInterfaces.DefinitionTriggerType[], project: string, providerName: string, serviceEndpointId?: string, repository?: string): Promise<void>;
    listWebhooks(project: string, providerName: string, serviceEndpointId?: string, repository?: string): Promise<BuildInterfaces.RepositoryWebhook[]>;
    getBuildWorkItemsRefs(project: string, buildId: number, top?: number): Promise<VSSInterfaces.ResourceRef[]>;
    getBuildWorkItemsRefsFromCommits(commitIds: string[], project: string, buildId: number, top?: number): Promise<VSSInterfaces.ResourceRef[]>;
    getWorkItemsBetweenBuilds(project: string, fromBuildId: number, toBuildId: number, top?: number): Promise<VSSInterfaces.ResourceRef[]>;
    getDefinitionYaml(project: string, definitionId: number, revision?: number, minMetricsTime?: Date, propertyFilters?: string[], includeLatestBuilds?: boolean): Promise<BuildInterfaces.YamlBuild>;
}
export declare class BuildApi extends basem.ClientApiBase implements IBuildApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "965220d5-5bb9-42cf-8d67-9b146df2a5a4";
    /**
     * Associates an artifact with a build.
     *
     * @param {BuildInterfaces.BuildArtifact} artifact - The artifact.
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    createArtifact(artifact: BuildInterfaces.BuildArtifact, project: string, buildId: number): Promise<BuildInterfaces.BuildArtifact>;
    /**
     * Gets a specific artifact for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} artifactName - The name of the artifact.
     */
    getArtifact(project: string, buildId: number, artifactName: string): Promise<BuildInterfaces.BuildArtifact>;
    /**
     * Gets a specific artifact for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} artifactName - The name of the artifact.
     */
    getArtifactContentZip(project: string, buildId: number, artifactName: string): Promise<NodeJS.ReadableStream>;
    /**
     * Gets all artifacts for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    getArtifacts(project: string, buildId: number): Promise<BuildInterfaces.BuildArtifact[]>;
    /**
     * Gets a file from the build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} artifactName - The name of the artifact.
     * @param {string} fileId - The primary key for the file.
     * @param {string} fileName - The name that the file will be set to.
     */
    getFile(project: string, buildId: number, artifactName: string, fileId: string, fileName: string): Promise<NodeJS.ReadableStream>;
    /**
     * Gets the list of attachments of a specific type that are associated with a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} type - The type of attachment.
     */
    getAttachments(project: string, buildId: number, type: string): Promise<BuildInterfaces.Attachment[]>;
    /**
     * Gets a specific attachment.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} timelineId - The ID of the timeline.
     * @param {string} recordId - The ID of the timeline record.
     * @param {string} type - The type of the attachment.
     * @param {string} name - The name of the attachment.
     */
    getAttachment(project: string, buildId: number, timelineId: string, recordId: string, type: string, name: string): Promise<NodeJS.ReadableStream>;
    /**
     * @param {BuildInterfaces.DefinitionResourceReference[]} resources
     * @param {string} project - Project ID or project name
     */
    authorizeProjectResources(resources: BuildInterfaces.DefinitionResourceReference[], project: string): Promise<BuildInterfaces.DefinitionResourceReference[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} type
     * @param {string} id
     */
    getProjectResources(project: string, type?: string, id?: string): Promise<BuildInterfaces.DefinitionResourceReference[]>;
    /**
     * Gets a badge that indicates the status of the most recent build for a definition. Note that this API is deprecated. Prefer StatusBadgeController.GetStatusBadge.
     *
     * @param {string} project - The project ID or name.
     * @param {number} definitionId - The ID of the definition.
     * @param {string} branchName - The name of the branch.
     */
    getBadge(project: string, definitionId: number, branchName?: string): Promise<string>;
    /**
     * Gets a list of branches for the given source code repository.
     *
     * @param {string} project - Project ID or project name
     * @param {string} providerName - The name of the source provider.
     * @param {string} serviceEndpointId - If specified, the ID of the service endpoint to query. Can only be omitted for providers that do not use service endpoints, e.g. TFVC or TFGit.
     * @param {string} repository - The vendor-specific identifier or the name of the repository to get branches. Can only be omitted for providers that do not support multiple repositories.
     * @param {string} branchName - If supplied, the name of the branch to check for specifically.
     */
    listBranches(project: string, providerName: string, serviceEndpointId?: string, repository?: string, branchName?: string): Promise<string[]>;
    /**
     * Gets a badge that indicates the status of the most recent build for the specified branch.
     *
     * @param {string} project - Project ID or project name
     * @param {string} repoType - The repository type.
     * @param {string} repoId - The repository ID.
     * @param {string} branchName - The branch name.
     */
    getBuildBadge(project: string, repoType: string, repoId?: string, branchName?: string): Promise<BuildInterfaces.BuildBadge>;
    /**
     * Gets a badge that indicates the status of the most recent build for the specified branch.
     *
     * @param {string} project - Project ID or project name
     * @param {string} repoType - The repository type.
     * @param {string} repoId - The repository ID.
     * @param {string} branchName - The branch name.
     */
    getBuildBadgeData(project: string, repoType: string, repoId?: string, branchName?: string): Promise<string>;
    /**
     * Gets all retention leases that apply to a specific build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    getRetentionLeasesForBuild(project: string, buildId: number): Promise<BuildInterfaces.RetentionLease[]>;
    /**
     * Deletes a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    deleteBuild(project: string, buildId: number): Promise<void>;
    /**
     * Gets a build
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} propertyFilters
     */
    getBuild(project: string, buildId: number, propertyFilters?: string): Promise<BuildInterfaces.Build>;
    /**
     * Gets a list of builds.
     *
     * @param {string} project - Project ID or project name
     * @param {number[]} definitions - A comma-delimited list of definition IDs. If specified, filters to builds for these definitions.
     * @param {number[]} queues - A comma-delimited list of queue IDs. If specified, filters to builds that ran against these queues.
     * @param {string} buildNumber - If specified, filters to builds that match this build number. Append * to do a prefix search.
     * @param {Date} minTime - If specified, filters to builds that finished/started/queued after this date based on the queryOrder specified.
     * @param {Date} maxTime - If specified, filters to builds that finished/started/queued before this date based on the queryOrder specified.
     * @param {string} requestedFor - If specified, filters to builds requested for the specified user.
     * @param {BuildInterfaces.BuildReason} reasonFilter - If specified, filters to builds that match this reason.
     * @param {BuildInterfaces.BuildStatus} statusFilter - If specified, filters to builds that match this status.
     * @param {BuildInterfaces.BuildResult} resultFilter - If specified, filters to builds that match this result.
     * @param {string[]} tagFilters - A comma-delimited list of tags. If specified, filters to builds that have the specified tags.
     * @param {string[]} properties - A comma-delimited list of properties to retrieve.
     * @param {number} top - The maximum number of builds to return.
     * @param {string} continuationToken - A continuation token, returned by a previous call to this method, that can be used to return the next set of builds.
     * @param {number} maxBuildsPerDefinition - The maximum number of builds to return per definition.
     * @param {BuildInterfaces.QueryDeletedOption} deletedFilter - Indicates whether to exclude, include, or only return deleted builds.
     * @param {BuildInterfaces.BuildQueryOrder} queryOrder - The order in which builds should be returned.
     * @param {string} branchName - If specified, filters to builds that built branches that built this branch.
     * @param {number[]} buildIds - A comma-delimited list that specifies the IDs of builds to retrieve.
     * @param {string} repositoryId - If specified, filters to builds that built from this repository.
     * @param {string} repositoryType - If specified, filters to builds that built from repositories of this type.
     */
    getBuilds(project: string, definitions?: number[], queues?: number[], buildNumber?: string, minTime?: Date, maxTime?: Date, requestedFor?: string, reasonFilter?: BuildInterfaces.BuildReason, statusFilter?: BuildInterfaces.BuildStatus, resultFilter?: BuildInterfaces.BuildResult, tagFilters?: string[], properties?: string[], top?: number, continuationToken?: string, maxBuildsPerDefinition?: number, deletedFilter?: BuildInterfaces.QueryDeletedOption, queryOrder?: BuildInterfaces.BuildQueryOrder, branchName?: string, buildIds?: number[], repositoryId?: string, repositoryType?: string): Promise<VSSInterfaces.PagedList<BuildInterfaces.Build>>;
    /**
     * Queues a build
     *
     * @param {BuildInterfaces.Build} build
     * @param {string} project - Project ID or project name
     * @param {boolean} ignoreWarnings
     * @param {string} checkInTicket
     * @param {number} sourceBuildId
     * @param {number} definitionId - Optional definition id to queue a build without a body. Ignored if there's a valid body
     */
    queueBuild(build: BuildInterfaces.Build, project: string, ignoreWarnings?: boolean, checkInTicket?: string, sourceBuildId?: number, definitionId?: number): Promise<BuildInterfaces.Build>;
    /**
     * Updates a build.
     *
     * @param {BuildInterfaces.Build} build - The build.
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {boolean} retry
     */
    updateBuild(build: BuildInterfaces.Build, project: string, buildId: number, retry?: boolean): Promise<BuildInterfaces.Build>;
    /**
     * Updates multiple builds.
     *
     * @param {BuildInterfaces.Build[]} builds - The builds to update.
     * @param {string} project - Project ID or project name
     */
    updateBuilds(builds: BuildInterfaces.Build[], project: string): Promise<BuildInterfaces.Build[]>;
    /**
     * Gets the changes associated with a build
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} continuationToken
     * @param {number} top - The maximum number of changes to return
     * @param {boolean} includeSourceChange
     */
    getBuildChanges(project: string, buildId: number, continuationToken?: string, top?: number, includeSourceChange?: boolean): Promise<VSSInterfaces.PagedList<BuildInterfaces.Change>>;
    /**
     * Gets the changes made to the repository between two given builds.
     *
     * @param {string} project - Project ID or project name
     * @param {number} fromBuildId - The ID of the first build.
     * @param {number} toBuildId - The ID of the last build.
     * @param {number} top - The maximum number of changes to return.
     */
    getChangesBetweenBuilds(project: string, fromBuildId?: number, toBuildId?: number, top?: number): Promise<BuildInterfaces.Change[]>;
    /**
     * Gets a controller
     *
     * @param {number} controllerId
     */
    getBuildController(controllerId: number): Promise<BuildInterfaces.BuildController>;
    /**
     * Gets controller, optionally filtered by name
     *
     * @param {string} name
     */
    getBuildControllers(name?: string): Promise<BuildInterfaces.BuildController[]>;
    /**
     * Creates a new definition.
     *
     * @param {BuildInterfaces.BuildDefinition} definition - The definition.
     * @param {string} project - Project ID or project name
     * @param {number} definitionToCloneId
     * @param {number} definitionToCloneRevision
     */
    createDefinition(definition: BuildInterfaces.BuildDefinition, project: string, definitionToCloneId?: number, definitionToCloneRevision?: number): Promise<BuildInterfaces.BuildDefinition>;
    /**
     * Deletes a definition and all associated builds.
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     */
    deleteDefinition(project: string, definitionId: number): Promise<void>;
    /**
     * Gets a definition, optionally at a specific revision.
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     * @param {number} revision - The revision number to retrieve. If this is not specified, the latest version will be returned.
     * @param {Date} minMetricsTime - If specified, indicates the date from which metrics should be included.
     * @param {string[]} propertyFilters - A comma-delimited list of properties to include in the results.
     * @param {boolean} includeLatestBuilds
     */
    getDefinition(project: string, definitionId: number, revision?: number, minMetricsTime?: Date, propertyFilters?: string[], includeLatestBuilds?: boolean): Promise<BuildInterfaces.BuildDefinition>;
    /**
     * Gets a list of definitions.
     *
     * @param {string} project - Project ID or project name
     * @param {string} name - If specified, filters to definitions whose names match this pattern.
     * @param {string} repositoryId - A repository ID. If specified, filters to definitions that use this repository.
     * @param {string} repositoryType - If specified, filters to definitions that have a repository of this type.
     * @param {BuildInterfaces.DefinitionQueryOrder} queryOrder - Indicates the order in which definitions should be returned.
     * @param {number} top - The maximum number of definitions to return.
     * @param {string} continuationToken - A continuation token, returned by a previous call to this method, that can be used to return the next set of definitions.
     * @param {Date} minMetricsTime - If specified, indicates the date from which metrics should be included.
     * @param {number[]} definitionIds - A comma-delimited list that specifies the IDs of definitions to retrieve.
     * @param {string} path - If specified, filters to definitions under this folder.
     * @param {Date} builtAfter - If specified, filters to definitions that have builds after this date.
     * @param {Date} notBuiltAfter - If specified, filters to definitions that do not have builds after this date.
     * @param {boolean} includeAllProperties - Indicates whether the full definitions should be returned. By default, shallow representations of the definitions are returned.
     * @param {boolean} includeLatestBuilds - Indicates whether to return the latest and latest completed builds for this definition.
     * @param {string} taskIdFilter - If specified, filters to definitions that use the specified task.
     * @param {number} processType - If specified, filters to definitions with the given process type.
     * @param {string} yamlFilename - If specified, filters to YAML definitions that match the given filename. To use this filter includeAllProperties should be set to true
     */
    getDefinitions(project: string, name?: string, repositoryId?: string, repositoryType?: string, queryOrder?: BuildInterfaces.DefinitionQueryOrder, top?: number, continuationToken?: string, minMetricsTime?: Date, definitionIds?: number[], path?: string, builtAfter?: Date, notBuiltAfter?: Date, includeAllProperties?: boolean, includeLatestBuilds?: boolean, taskIdFilter?: string, processType?: number, yamlFilename?: string): Promise<VSSInterfaces.PagedList<BuildInterfaces.BuildDefinitionReference>>;
    /**
     * Restores a deleted definition
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The identifier of the definition to restore.
     * @param {boolean} deleted - When false, restores a deleted definition.
     */
    restoreDefinition(project: string, definitionId: number, deleted: boolean): Promise<BuildInterfaces.BuildDefinition>;
    /**
     * Updates an existing build definition.  In order for this operation to succeed, the value of the "Revision" property of the request body must match the existing build definition's. It is recommended that you obtain the existing build definition by using GET, modify the build definition as necessary, and then submit the modified definition with PUT.
     *
     * @param {BuildInterfaces.BuildDefinition} definition - The new version of the definition. Its "Revision" property must match the existing definition for the update to be accepted.
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     * @param {number} secretsSourceDefinitionId
     * @param {number} secretsSourceDefinitionRevision
     */
    updateDefinition(definition: BuildInterfaces.BuildDefinition, project: string, definitionId: number, secretsSourceDefinitionId?: number, secretsSourceDefinitionRevision?: number): Promise<BuildInterfaces.BuildDefinition>;
    /**
     * Gets the contents of a file in the given source code repository.
     *
     * @param {string} project - Project ID or project name
     * @param {string} providerName - The name of the source provider.
     * @param {string} serviceEndpointId - If specified, the ID of the service endpoint to query. Can only be omitted for providers that do not use service endpoints, e.g. TFVC or TFGit.
     * @param {string} repository - If specified, the vendor-specific identifier or the name of the repository to get branches. Can only be omitted for providers that do not support multiple repositories.
     * @param {string} commitOrBranch - The identifier of the commit or branch from which a file's contents are retrieved.
     * @param {string} path - The path to the file to retrieve, relative to the root of the repository.
     */
    getFileContents(project: string, providerName: string, serviceEndpointId?: string, repository?: string, commitOrBranch?: string, path?: string): Promise<NodeJS.ReadableStream>;
    /**
     * Creates a new folder.
     *
     * @param {BuildInterfaces.Folder} folder - The folder.
     * @param {string} project - Project ID or project name
     * @param {string} path - The full path of the folder.
     */
    createFolder(folder: BuildInterfaces.Folder, project: string, path: string): Promise<BuildInterfaces.Folder>;
    /**
     * Deletes a definition folder. Definitions and their corresponding builds will also be deleted.
     *
     * @param {string} project - Project ID or project name
     * @param {string} path - The full path to the folder.
     */
    deleteFolder(project: string, path: string): Promise<void>;
    /**
     * Gets a list of build definition folders.
     *
     * @param {string} project - Project ID or project name
     * @param {string} path - The path to start with.
     * @param {BuildInterfaces.FolderQueryOrder} queryOrder - The order in which folders should be returned.
     */
    getFolders(project: string, path?: string, queryOrder?: BuildInterfaces.FolderQueryOrder): Promise<BuildInterfaces.Folder[]>;
    /**
     * Updates an existing folder at given  existing path
     *
     * @param {BuildInterfaces.Folder} folder - The new version of the folder.
     * @param {string} project - Project ID or project name
     * @param {string} path - The full path to the folder.
     */
    updateFolder(folder: BuildInterfaces.Folder, project: string, path: string): Promise<BuildInterfaces.Folder>;
    /**
     * Gets pipeline general settings.
     *
     * @param {string} project - Project ID or project name
     */
    getBuildGeneralSettings(project: string): Promise<BuildInterfaces.PipelineGeneralSettings>;
    /**
     * Updates pipeline general settings.
     *
     * @param {BuildInterfaces.PipelineGeneralSettings} newSettings
     * @param {string} project - Project ID or project name
     */
    updateBuildGeneralSettings(newSettings: BuildInterfaces.PipelineGeneralSettings, project: string): Promise<BuildInterfaces.PipelineGeneralSettings>;
    /**
     * Returns the retention history for the project collection. This includes pipelines that have custom retention rules that may prevent the retention job from cleaning them up, runs per pipeline with retention type, files associated with pipelines owned by the collection with retention type, and the number of files per pipeline.
     *
     * @param {number} daysToLookback
     */
    getRetentionHistory(daysToLookback?: number): Promise<BuildInterfaces.BuildRetentionHistory>;
    /**
     * Gets the latest build for a definition, optionally scoped to a specific branch.
     *
     * @param {string} project - Project ID or project name
     * @param {string} definition - definition name with optional leading folder path, or the definition id
     * @param {string} branchName - optional parameter that indicates the specific branch to use. If not specified, the default branch is used.
     */
    getLatestBuild(project: string, definition: string, branchName?: string): Promise<BuildInterfaces.Build>;
    /**
     * Adds new leases for pipeline runs.
     *
     * @param {BuildInterfaces.NewRetentionLease[]} newLeases
     * @param {string} project - Project ID or project name
     */
    addRetentionLeases(newLeases: BuildInterfaces.NewRetentionLease[], project: string): Promise<BuildInterfaces.RetentionLease[]>;
    /**
     * Removes specific retention leases.
     *
     * @param {string} project - Project ID or project name
     * @param {number[]} ids
     */
    deleteRetentionLeasesById(project: string, ids: number[]): Promise<void>;
    /**
     * Returns the details of the retention lease given a lease id.
     *
     * @param {string} project - Project ID or project name
     * @param {number} leaseId
     */
    getRetentionLease(project: string, leaseId: number): Promise<BuildInterfaces.RetentionLease>;
    /**
     * Returns any leases matching the specified MinimalRetentionLeases
     *
     * @param {string} project - Project ID or project name
     * @param {BuildInterfaces.MinimalRetentionLease[]} leasesToFetch - List of JSON-serialized MinimalRetentionLeases separated by '|'
     */
    getRetentionLeasesByMinimalRetentionLeases(project: string, leasesToFetch: BuildInterfaces.MinimalRetentionLease[]): Promise<BuildInterfaces.RetentionLease[]>;
    /**
     * Returns any leases owned by the specified entity, optionally scoped to a single pipeline definition and run.
     *
     * @param {string} project - Project ID or project name
     * @param {string} ownerId
     * @param {number} definitionId - An optional parameter to limit the search to a specific pipeline definition.
     * @param {number} runId - An optional parameter to limit the search to a single pipeline run. Requires definitionId.
     */
    getRetentionLeasesByOwnerId(project: string, ownerId?: string, definitionId?: number, runId?: number): Promise<BuildInterfaces.RetentionLease[]>;
    /**
     * Returns any leases owned by the specified user, optionally scoped to a single pipeline definition and run.
     *
     * @param {string} project - Project ID or project name
     * @param {string} userOwnerId - The user id to search for.
     * @param {number} definitionId - An optional parameter to limit the search to a specific pipeline definition.
     * @param {number} runId - An optional parameter to limit the search to a single pipeline run. Requires definitionId.
     */
    getRetentionLeasesByUserId(project: string, userOwnerId: string, definitionId?: number, runId?: number): Promise<BuildInterfaces.RetentionLease[]>;
    /**
     * Updates the duration or pipeline protection status of a retention lease.
     *
     * @param {BuildInterfaces.RetentionLeaseUpdate} leaseUpdate - The new data for the retention lease.
     * @param {string} project - Project ID or project name
     * @param {number} leaseId - The ID of the lease to update.
     */
    updateRetentionLease(leaseUpdate: BuildInterfaces.RetentionLeaseUpdate, project: string, leaseId: number): Promise<BuildInterfaces.RetentionLease>;
    /**
     * Gets an individual log file for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {number} logId - The ID of the log file.
     * @param {number} startLine - The start line.
     * @param {number} endLine - The end line.
     */
    getBuildLog(project: string, buildId: number, logId: number, startLine?: number, endLine?: number): Promise<NodeJS.ReadableStream>;
    /**
     * Gets an individual log file for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {number} logId - The ID of the log file.
     * @param {number} startLine - The start line.
     * @param {number} endLine - The end line.
     */
    getBuildLogLines(project: string, buildId: number, logId: number, startLine?: number, endLine?: number): Promise<string[]>;
    /**
     * Gets the logs for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    getBuildLogs(project: string, buildId: number): Promise<BuildInterfaces.BuildLog[]>;
    /**
     * Gets the logs for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    getBuildLogsZip(project: string, buildId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Gets an individual log file for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {number} logId - The ID of the log file.
     * @param {number} startLine - The start line.
     * @param {number} endLine - The end line.
     */
    getBuildLogZip(project: string, buildId: number, logId: number, startLine?: number, endLine?: number): Promise<NodeJS.ReadableStream>;
    /**
     * Gets build metrics for a project.
     *
     * @param {string} project - Project ID or project name
     * @param {string} metricAggregationType - The aggregation type to use (hourly, daily).
     * @param {Date} minMetricsTime - The date from which to calculate metrics.
     */
    getProjectMetrics(project: string, metricAggregationType?: string, minMetricsTime?: Date): Promise<BuildInterfaces.BuildMetric[]>;
    /**
     * Gets build metrics for a definition.
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     * @param {Date} minMetricsTime - The date from which to calculate metrics.
     */
    getDefinitionMetrics(project: string, definitionId: number, minMetricsTime?: Date): Promise<BuildInterfaces.BuildMetric[]>;
    /**
     * Gets all build definition options supported by the system.
     *
     * @param {string} project - Project ID or project name
     */
    getBuildOptionDefinitions(project?: string): Promise<BuildInterfaces.BuildOptionDefinition[]>;
    /**
     * Gets the contents of a directory in the given source code repository.
     *
     * @param {string} project - Project ID or project name
     * @param {string} providerName - The name of the source provider.
     * @param {string} serviceEndpointId - If specified, the ID of the service endpoint to query. Can only be omitted for providers that do not use service endpoints, e.g. TFVC or TFGit.
     * @param {string} repository - If specified, the vendor-specific identifier or the name of the repository to get branches. Can only be omitted for providers that do not support multiple repositories.
     * @param {string} commitOrBranch - The identifier of the commit or branch from which a file's contents are retrieved.
     * @param {string} path - The path contents to list, relative to the root of the repository.
     */
    getPathContents(project: string, providerName: string, serviceEndpointId?: string, repository?: string, commitOrBranch?: string, path?: string): Promise<BuildInterfaces.SourceRepositoryItem[]>;
    /**
     * Gets properties for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string[]} filter - A comma-delimited list of properties. If specified, filters to these specific properties.
     */
    getBuildProperties(project: string, buildId: number, filter?: string[]): Promise<any>;
    /**
     * Updates properties for a build.
     *
     * @param {VSSInterfaces.JsonPatchDocument} document - A json-patch document describing the properties to update.
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    updateBuildProperties(customHeaders: any, document: VSSInterfaces.JsonPatchDocument, project: string, buildId: number): Promise<any>;
    /**
     * Gets properties for a definition.
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     * @param {string[]} filter - A comma-delimited list of properties. If specified, filters to these specific properties.
     */
    getDefinitionProperties(project: string, definitionId: number, filter?: string[]): Promise<any>;
    /**
     * Updates properties for a definition.
     *
     * @param {VSSInterfaces.JsonPatchDocument} document - A json-patch document describing the properties to update.
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     */
    updateDefinitionProperties(customHeaders: any, document: VSSInterfaces.JsonPatchDocument, project: string, definitionId: number): Promise<any>;
    /**
     * Gets a pull request object from source provider.
     *
     * @param {string} project - Project ID or project name
     * @param {string} providerName - The name of the source provider.
     * @param {string} pullRequestId - Vendor-specific id of the pull request.
     * @param {string} repositoryId - Vendor-specific identifier or the name of the repository that contains the pull request.
     * @param {string} serviceEndpointId - If specified, the ID of the service endpoint to query. Can only be omitted for providers that do not use service endpoints, e.g. TFVC or TFGit.
     */
    getPullRequest(project: string, providerName: string, pullRequestId: string, repositoryId?: string, serviceEndpointId?: string): Promise<BuildInterfaces.PullRequest>;
    /**
     * Gets a build report.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} type
     */
    getBuildReport(project: string, buildId: number, type?: string): Promise<BuildInterfaces.BuildReportMetadata>;
    /**
     * Gets a build report.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} type
     */
    getBuildReportHtmlContent(project: string, buildId: number, type?: string): Promise<NodeJS.ReadableStream>;
    /**
     * Gets a list of source code repositories.
     *
     * @param {string} project - Project ID or project name
     * @param {string} providerName - The name of the source provider.
     * @param {string} serviceEndpointId - If specified, the ID of the service endpoint to query. Can only be omitted for providers that do not use service endpoints, e.g. TFVC or TFGit.
     * @param {string} repository - If specified, the vendor-specific identifier or the name of a single repository to get.
     * @param {BuildInterfaces.ResultSet} resultSet - 'top' for the repositories most relevant for the endpoint. If not set, all repositories are returned. Ignored if 'repository' is set.
     * @param {boolean} pageResults - If set to true, this will limit the set of results and will return a continuation token to continue the query.
     * @param {string} continuationToken - When paging results, this is a continuation token, returned by a previous call to this method, that can be used to return the next set of repositories.
     */
    listRepositories(project: string, providerName: string, serviceEndpointId?: string, repository?: string, resultSet?: BuildInterfaces.ResultSet, pageResults?: boolean, continuationToken?: string): Promise<BuildInterfaces.SourceRepositories>;
    /**
     * @param {BuildInterfaces.DefinitionResourceReference[]} resources
     * @param {string} project - Project ID or project name
     * @param {number} definitionId
     */
    authorizeDefinitionResources(resources: BuildInterfaces.DefinitionResourceReference[], project: string, definitionId: number): Promise<BuildInterfaces.DefinitionResourceReference[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} definitionId
     */
    getDefinitionResources(project: string, definitionId: number): Promise<BuildInterfaces.DefinitionResourceReference[]>;
    /**
     * Gets information about build resources in the system.
     *
     */
    getResourceUsage(): Promise<BuildInterfaces.BuildResourceUsage>;
    /**
     * Gets the project's retention settings.
     *
     * @param {string} project - Project ID or project name
     */
    getRetentionSettings(project: string): Promise<BuildInterfaces.ProjectRetentionSetting>;
    /**
     * Updates the project's retention settings.
     *
     * @param {BuildInterfaces.UpdateProjectRetentionSettingModel} updateModel
     * @param {string} project - Project ID or project name
     */
    updateRetentionSettings(updateModel: BuildInterfaces.UpdateProjectRetentionSettingModel, project: string): Promise<BuildInterfaces.ProjectRetentionSetting>;
    /**
     * Gets all revisions of a definition.
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     */
    getDefinitionRevisions(project: string, definitionId: number): Promise<BuildInterfaces.BuildDefinitionRevision[]>;
    /**
     * Gets the build settings.
     *
     * @param {string} project - Project ID or project name
     */
    getBuildSettings(project?: string): Promise<BuildInterfaces.BuildSettings>;
    /**
     * Updates the build settings.
     *
     * @param {BuildInterfaces.BuildSettings} settings - The new settings.
     * @param {string} project - Project ID or project name
     */
    updateBuildSettings(settings: BuildInterfaces.BuildSettings, project?: string): Promise<BuildInterfaces.BuildSettings>;
    /**
     * Get a list of source providers and their capabilities.
     *
     * @param {string} project - Project ID or project name
     */
    listSourceProviders(project: string): Promise<BuildInterfaces.SourceProviderAttributes[]>;
    /**
     * Update a build stage
     *
     * @param {BuildInterfaces.UpdateStageParameters} updateParameters
     * @param {number} buildId
     * @param {string} stageRefName
     * @param {string} project - Project ID or project name
     */
    updateStage(updateParameters: BuildInterfaces.UpdateStageParameters, buildId: number, stageRefName: string, project?: string): Promise<void>;
    /**
     * <p>Gets the build status for a definition, optionally scoped to a specific branch, stage, job, and configuration.</p> <p>If there are more than one, then it is required to pass in a stageName value when specifying a jobName, and the same rule then applies for both if passing a configuration parameter.</p>
     *
     * @param {string} project - Project ID or project name
     * @param {string} definition - Either the definition name with optional leading folder path, or the definition id.
     * @param {string} branchName - Only consider the most recent build for this branch. If not specified, the default branch is used.
     * @param {string} stageName - Use this stage within the pipeline to render the status.
     * @param {string} jobName - Use this job within a stage of the pipeline to render the status.
     * @param {string} configuration - Use this job configuration to render the status
     * @param {string} label - Replaces the default text on the left side of the badge.
     */
    getStatusBadge(project: string, definition: string, branchName?: string, stageName?: string, jobName?: string, configuration?: string, label?: string): Promise<string>;
    /**
     * Adds a tag to a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} tag - The tag to add.
     */
    addBuildTag(project: string, buildId: number, tag: string): Promise<string[]>;
    /**
     * Adds tags to a build.
     *
     * @param {string[]} tags - The tags to add. Request body is composed directly from listed tags.
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    addBuildTags(tags: string[], project: string, buildId: number): Promise<string[]>;
    /**
     * Removes a tag from a build. NOTE: This API will not work for tags with special characters. To remove tags with special characters, use the PATCH method instead (in 6.0+)
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {string} tag - The tag to remove.
     */
    deleteBuildTag(project: string, buildId: number, tag: string): Promise<string[]>;
    /**
     * Gets the tags for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    getBuildTags(project: string, buildId: number): Promise<string[]>;
    /**
     * Adds/Removes tags from a build.
     *
     * @param {BuildInterfaces.UpdateTagParameters} updateParameters - The tags to add/remove.
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     */
    updateBuildTags(updateParameters: BuildInterfaces.UpdateTagParameters, project: string, buildId: number): Promise<string[]>;
    /**
     * Adds a tag to a definition
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     * @param {string} tag - The tag to add.
     */
    addDefinitionTag(project: string, definitionId: number, tag: string): Promise<string[]>;
    /**
     * Adds multiple tags to a definition.
     *
     * @param {string[]} tags - The tags to add.
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     */
    addDefinitionTags(tags: string[], project: string, definitionId: number): Promise<string[]>;
    /**
     * Removes a tag from a definition. NOTE: This API will not work for tags with special characters. To remove tags with special characters, use the PATCH method instead (in 6.0+)
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     * @param {string} tag - The tag to remove.
     */
    deleteDefinitionTag(project: string, definitionId: number, tag: string): Promise<string[]>;
    /**
     * Gets the tags for a definition.
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     * @param {number} revision - The definition revision number. If not specified, uses the latest revision of the definition.
     */
    getDefinitionTags(project: string, definitionId: number, revision?: number): Promise<string[]>;
    /**
     * Adds/Removes tags from a definition.
     *
     * @param {BuildInterfaces.UpdateTagParameters} updateParameters - The tags to add/remove.
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     */
    updateDefinitionTags(updateParameters: BuildInterfaces.UpdateTagParameters, project: string, definitionId: number): Promise<string[]>;
    /**
     * Removes a tag from builds, definitions, and from the tag store
     *
     * @param {string} project - Project ID or project name
     * @param {string} tag - The tag to remove.
     */
    deleteTag(project: string, tag: string): Promise<string[]>;
    /**
     * Gets a list of all build tags in the project.
     *
     * @param {string} project - Project ID or project name
     */
    getTags(project: string): Promise<string[]>;
    /**
     * Deletes a build definition template.
     *
     * @param {string} project - Project ID or project name
     * @param {string} templateId - The ID of the template.
     */
    deleteTemplate(project: string, templateId: string): Promise<void>;
    /**
     * Gets a specific build definition template.
     *
     * @param {string} project - Project ID or project name
     * @param {string} templateId - The ID of the requested template.
     */
    getTemplate(project: string, templateId: string): Promise<BuildInterfaces.BuildDefinitionTemplate>;
    /**
     * Gets all definition templates.
     *
     * @param {string} project - Project ID or project name
     */
    getTemplates(project: string): Promise<BuildInterfaces.BuildDefinitionTemplate[]>;
    /**
     * Updates an existing build definition template.
     *
     * @param {BuildInterfaces.BuildDefinitionTemplate} template - The new version of the template.
     * @param {string} project - Project ID or project name
     * @param {string} templateId - The ID of the template.
     */
    saveTemplate(template: BuildInterfaces.BuildDefinitionTemplate, project: string, templateId: string): Promise<BuildInterfaces.BuildDefinitionTemplate>;
    /**
     * Gets details for a build
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} timelineId
     * @param {number} changeId
     * @param {string} planId
     */
    getBuildTimeline(project: string, buildId: number, timelineId?: string, changeId?: number, planId?: string): Promise<BuildInterfaces.Timeline>;
    /**
     * Recreates the webhooks for the specified triggers in the given source code repository.
     *
     * @param {BuildInterfaces.DefinitionTriggerType[]} triggerTypes - The types of triggers to restore webhooks for.
     * @param {string} project - Project ID or project name
     * @param {string} providerName - The name of the source provider.
     * @param {string} serviceEndpointId - If specified, the ID of the service endpoint to query. Can only be omitted for providers that do not use service endpoints, e.g. TFVC or TFGit.
     * @param {string} repository - If specified, the vendor-specific identifier or the name of the repository to get webhooks. Can only be omitted for providers that do not support multiple repositories.
     */
    restoreWebhooks(triggerTypes: BuildInterfaces.DefinitionTriggerType[], project: string, providerName: string, serviceEndpointId?: string, repository?: string): Promise<void>;
    /**
     * Gets a list of webhooks installed in the given source code repository.
     *
     * @param {string} project - Project ID or project name
     * @param {string} providerName - The name of the source provider.
     * @param {string} serviceEndpointId - If specified, the ID of the service endpoint to query. Can only be omitted for providers that do not use service endpoints, e.g. TFVC or TFGit.
     * @param {string} repository - If specified, the vendor-specific identifier or the name of the repository to get webhooks. Can only be omitted for providers that do not support multiple repositories.
     */
    listWebhooks(project: string, providerName: string, serviceEndpointId?: string, repository?: string): Promise<BuildInterfaces.RepositoryWebhook[]>;
    /**
     * Gets the work items associated with a build. Only work items in the same project are returned.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {number} top - The maximum number of work items to return.
     */
    getBuildWorkItemsRefs(project: string, buildId: number, top?: number): Promise<VSSInterfaces.ResourceRef[]>;
    /**
     * Gets the work items associated with a build, filtered to specific commits.
     *
     * @param {string[]} commitIds - A comma-delimited list of commit IDs.
     * @param {string} project - Project ID or project name
     * @param {number} buildId - The ID of the build.
     * @param {number} top - The maximum number of work items to return, or the number of commits to consider if no commit IDs are specified.
     */
    getBuildWorkItemsRefsFromCommits(commitIds: string[], project: string, buildId: number, top?: number): Promise<VSSInterfaces.ResourceRef[]>;
    /**
     * Gets all the work items between two builds.
     *
     * @param {string} project - Project ID or project name
     * @param {number} fromBuildId - The ID of the first build.
     * @param {number} toBuildId - The ID of the last build.
     * @param {number} top - The maximum number of work items to return.
     */
    getWorkItemsBetweenBuilds(project: string, fromBuildId: number, toBuildId: number, top?: number): Promise<VSSInterfaces.ResourceRef[]>;
    /**
     * Converts a definition to YAML, optionally at a specific revision.
     *
     * @param {string} project - Project ID or project name
     * @param {number} definitionId - The ID of the definition.
     * @param {number} revision - The revision number to retrieve. If this is not specified, the latest version will be returned.
     * @param {Date} minMetricsTime - If specified, indicates the date from which metrics should be included.
     * @param {string[]} propertyFilters - A comma-delimited list of properties to include in the results.
     * @param {boolean} includeLatestBuilds
     */
    getDefinitionYaml(project: string, definitionId: number, revision?: number, minMetricsTime?: Date, propertyFilters?: string[], includeLatestBuilds?: boolean): Promise<BuildInterfaces.YamlBuild>;
}
