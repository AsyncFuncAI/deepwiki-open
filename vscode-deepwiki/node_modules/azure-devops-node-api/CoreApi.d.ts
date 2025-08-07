import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import CoreInterfaces = require("./interfaces/CoreInterfaces");
import OperationsInterfaces = require("./interfaces/common/OperationsInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface ICoreApi extends basem.ClientApiBase {
    removeProjectAvatar(projectId: string): Promise<void>;
    setProjectAvatar(avatarBlob: CoreInterfaces.ProjectAvatar, projectId: string): Promise<void>;
    getProjectTeamsByCategory(projectId: string, expandIdentity?: boolean, top?: number, skip?: number): Promise<CoreInterfaces.CategorizedWebApiTeams>;
    createConnectedService(connectedServiceCreationData: CoreInterfaces.WebApiConnectedServiceDetails, projectId: string): Promise<CoreInterfaces.WebApiConnectedService>;
    getConnectedServiceDetails(projectId: string, name: string): Promise<CoreInterfaces.WebApiConnectedServiceDetails>;
    getConnectedServices(projectId: string, kind?: CoreInterfaces.ConnectedServiceKind): Promise<CoreInterfaces.WebApiConnectedService[]>;
    createIdentityMru(mruData: CoreInterfaces.IdentityData, mruName: string): Promise<void>;
    deleteIdentityMru(mruData: CoreInterfaces.IdentityData, mruName: string): Promise<void>;
    getIdentityMru(mruName: string): Promise<VSSInterfaces.IdentityRef[]>;
    updateIdentityMru(mruData: CoreInterfaces.IdentityData, mruName: string): Promise<void>;
    getTeamMembersWithExtendedProperties(projectId: string, teamId: string, top?: number, skip?: number): Promise<VSSInterfaces.TeamMember[]>;
    getProcessById(processId: string): Promise<CoreInterfaces.Process>;
    getProcesses(): Promise<CoreInterfaces.Process[]>;
    getProjectCollection(collectionId: string): Promise<CoreInterfaces.TeamProjectCollection>;
    getProjectCollections(top?: number, skip?: number): Promise<CoreInterfaces.TeamProjectCollectionReference[]>;
    getProjectHistoryEntries(minRevision?: number): Promise<CoreInterfaces.ProjectInfo[]>;
    getProject(projectId: string, includeCapabilities?: boolean, includeHistory?: boolean): Promise<CoreInterfaces.TeamProject>;
    getProjects(stateFilter?: any, top?: number, skip?: number, continuationToken?: number, getDefaultTeamImageUrl?: boolean): Promise<VSSInterfaces.PagedList<CoreInterfaces.TeamProjectReference>>;
    queueCreateProject(projectToCreate: CoreInterfaces.TeamProject): Promise<OperationsInterfaces.OperationReference>;
    queueDeleteProject(projectId: string): Promise<OperationsInterfaces.OperationReference>;
    updateProject(projectUpdate: CoreInterfaces.TeamProject, projectId: string): Promise<OperationsInterfaces.OperationReference>;
    getProjectsProperties(projectIds: string[], properties?: string[]): Promise<CoreInterfaces.ProjectProperties[]>;
    getProjectProperties(projectId: string, keys?: string[]): Promise<CoreInterfaces.ProjectProperty[]>;
    setProjectProperties(customHeaders: any, projectId: string, patchDocument: VSSInterfaces.JsonPatchDocument): Promise<void>;
    createOrUpdateProxy(proxy: CoreInterfaces.Proxy): Promise<CoreInterfaces.Proxy>;
    deleteProxy(proxyUrl: string, site?: string): Promise<void>;
    getProxies(proxyUrl?: string): Promise<CoreInterfaces.Proxy[]>;
    getAllTeams(mine?: boolean, top?: number, skip?: number, expandIdentity?: boolean): Promise<CoreInterfaces.WebApiTeam[]>;
    createTeam(team: CoreInterfaces.WebApiTeam, projectId: string): Promise<CoreInterfaces.WebApiTeam>;
    deleteTeam(projectId: string, teamId: string): Promise<void>;
    getTeam(projectId: string, teamId: string, expandIdentity?: boolean): Promise<CoreInterfaces.WebApiTeam>;
    getTeams(projectId: string, mine?: boolean, top?: number, skip?: number, expandIdentity?: boolean): Promise<CoreInterfaces.WebApiTeam[]>;
    updateTeam(teamData: CoreInterfaces.WebApiTeam, projectId: string, teamId: string): Promise<CoreInterfaces.WebApiTeam>;
}
export declare class CoreApi extends basem.ClientApiBase implements ICoreApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "79134c72-4a58-4b42-976c-04e7115f32bf";
    /**
     * Removes the avatar for the project.
     *
     * @param {string} projectId - The ID or name of the project.
     */
    removeProjectAvatar(projectId: string): Promise<void>;
    /**
     * Sets the avatar for the project.
     *
     * @param {CoreInterfaces.ProjectAvatar} avatarBlob - The avatar blob data object to upload.
     * @param {string} projectId - The ID or name of the project.
     */
    setProjectAvatar(avatarBlob: CoreInterfaces.ProjectAvatar, projectId: string): Promise<void>;
    /**
     * Gets list of user readable teams in a project and teams user is member of (excluded from readable list).
     *
     * @param {string} projectId - The name or ID (GUID) of the team project containing the teams to retrieve.
     * @param {boolean} expandIdentity - A value indicating whether or not to expand Identity information in the result WebApiTeam object.
     * @param {number} top - Maximum number of teams to return.
     * @param {number} skip - Number of teams to skip.
     */
    getProjectTeamsByCategory(projectId: string, expandIdentity?: boolean, top?: number, skip?: number): Promise<CoreInterfaces.CategorizedWebApiTeams>;
    /**
     * @param {CoreInterfaces.WebApiConnectedServiceDetails} connectedServiceCreationData
     * @param {string} projectId
     */
    createConnectedService(connectedServiceCreationData: CoreInterfaces.WebApiConnectedServiceDetails, projectId: string): Promise<CoreInterfaces.WebApiConnectedService>;
    /**
     * @param {string} projectId
     * @param {string} name
     */
    getConnectedServiceDetails(projectId: string, name: string): Promise<CoreInterfaces.WebApiConnectedServiceDetails>;
    /**
     * @param {string} projectId
     * @param {CoreInterfaces.ConnectedServiceKind} kind
     */
    getConnectedServices(projectId: string, kind?: CoreInterfaces.ConnectedServiceKind): Promise<CoreInterfaces.WebApiConnectedService[]>;
    /**
     * @param {CoreInterfaces.IdentityData} mruData
     * @param {string} mruName
     */
    createIdentityMru(mruData: CoreInterfaces.IdentityData, mruName: string): Promise<void>;
    /**
     * @param {CoreInterfaces.IdentityData} mruData
     * @param {string} mruName
     */
    deleteIdentityMru(mruData: CoreInterfaces.IdentityData, mruName: string): Promise<void>;
    /**
     * @param {string} mruName
     */
    getIdentityMru(mruName: string): Promise<VSSInterfaces.IdentityRef[]>;
    /**
     * @param {CoreInterfaces.IdentityData} mruData
     * @param {string} mruName
     */
    updateIdentityMru(mruData: CoreInterfaces.IdentityData, mruName: string): Promise<void>;
    /**
     * Get a list of members for a specific team.
     *
     * @param {string} projectId - The name or ID (GUID) of the team project the team belongs to.
     * @param {string} teamId - The name or ID (GUID) of the team .
     * @param {number} top
     * @param {number} skip
     */
    getTeamMembersWithExtendedProperties(projectId: string, teamId: string, top?: number, skip?: number): Promise<VSSInterfaces.TeamMember[]>;
    /**
     * Get a process by ID.
     *
     * @param {string} processId - ID for a process.
     */
    getProcessById(processId: string): Promise<CoreInterfaces.Process>;
    /**
     * Get a list of processes.
     *
     */
    getProcesses(): Promise<CoreInterfaces.Process[]>;
    /**
     * Get project collection with the specified id or name.
     *
     * @param {string} collectionId
     */
    getProjectCollection(collectionId: string): Promise<CoreInterfaces.TeamProjectCollection>;
    /**
     * Get project collection references for this application.
     *
     * @param {number} top
     * @param {number} skip
     */
    getProjectCollections(top?: number, skip?: number): Promise<CoreInterfaces.TeamProjectCollectionReference[]>;
    /**
     * Gets the history of changes to the project.
     *
     * @param {number} minRevision - The minimum revision number to return in the history.
     */
    getProjectHistoryEntries(minRevision?: number): Promise<CoreInterfaces.ProjectInfo[]>;
    /**
     * Get project with the specified id or name, optionally including capabilities.
     *
     * @param {string} projectId
     * @param {boolean} includeCapabilities - Include capabilities (such as source control) in the team project result (default: false).
     * @param {boolean} includeHistory - Search within renamed projects (that had such name in the past).
     */
    getProject(projectId: string, includeCapabilities?: boolean, includeHistory?: boolean): Promise<CoreInterfaces.TeamProject>;
    /**
     * Get all projects in the organization that the authenticated user has access to.
     *
     * @param {any} stateFilter - Filter on team projects in a specific team project state (default: WellFormed).
     * @param {number} top
     * @param {number} skip
     * @param {number} continuationToken - Pointer that shows how many projects already been fetched.
     * @param {boolean} getDefaultTeamImageUrl
     */
    getProjects(stateFilter?: any, top?: number, skip?: number, continuationToken?: number, getDefaultTeamImageUrl?: boolean): Promise<VSSInterfaces.PagedList<CoreInterfaces.TeamProjectReference>>;
    /**
     * Queues a project to be created. Use the [GetOperation](../../operations/operations/get) to periodically check for create project status.
     *
     * @param {CoreInterfaces.TeamProject} projectToCreate - The project to create.
     */
    queueCreateProject(projectToCreate: CoreInterfaces.TeamProject): Promise<OperationsInterfaces.OperationReference>;
    /**
     * Queues a project to be deleted. Use the [GetOperation](../../operations/operations/get) to periodically check for delete project status.
     *
     * @param {string} projectId - The project id of the project to delete.
     */
    queueDeleteProject(projectId: string): Promise<OperationsInterfaces.OperationReference>;
    /**
     * Update an existing project's name, abbreviation, description, or restore a project.
     *
     * @param {CoreInterfaces.TeamProject} projectUpdate - The updates for the project. The state must be set to wellFormed to restore the project.
     * @param {string} projectId - The project id of the project to update.
     */
    updateProject(projectUpdate: CoreInterfaces.TeamProject, projectId: string): Promise<OperationsInterfaces.OperationReference>;
    /**
     * Get a collection of team project properties for multiple projects.
     *
     * @param {string[]} projectIds - A comma-delimited string of team project IDs
     * @param {string[]} properties
     */
    getProjectsProperties(projectIds: string[], properties?: string[]): Promise<CoreInterfaces.ProjectProperties[]>;
    /**
     * Get a collection of team project properties.
     *
     * @param {string} projectId - The team project ID.
     * @param {string[]} keys - A comma-delimited string of team project property names. Wildcard characters ("?" and "*") are supported. If no key is specified, all properties will be returned.
     */
    getProjectProperties(projectId: string, keys?: string[]): Promise<CoreInterfaces.ProjectProperty[]>;
    /**
     * Create, update, and delete team project properties.
     *
     * @param {string} projectId - The team project ID.
     * @param {VSSInterfaces.JsonPatchDocument} patchDocument - A JSON Patch document that represents an array of property operations. See RFC 6902 for more details on JSON Patch. The accepted operation verbs are Add and Remove, where Add is used for both creating and updating properties. The path consists of a forward slash and a property name.
     */
    setProjectProperties(customHeaders: any, projectId: string, patchDocument: VSSInterfaces.JsonPatchDocument): Promise<void>;
    /**
     * @param {CoreInterfaces.Proxy} proxy
     */
    createOrUpdateProxy(proxy: CoreInterfaces.Proxy): Promise<CoreInterfaces.Proxy>;
    /**
     * @param {string} proxyUrl
     * @param {string} site
     */
    deleteProxy(proxyUrl: string, site?: string): Promise<void>;
    /**
     * @param {string} proxyUrl
     */
    getProxies(proxyUrl?: string): Promise<CoreInterfaces.Proxy[]>;
    /**
     * Get a list of all teams.
     *
     * @param {boolean} mine - If true, then return all teams requesting user is member. Otherwise return all teams user has read access.
     * @param {number} top - Maximum number of teams to return.
     * @param {number} skip - Number of teams to skip.
     * @param {boolean} expandIdentity - A value indicating whether or not to expand Identity information in the result WebApiTeam object.
     */
    getAllTeams(mine?: boolean, top?: number, skip?: number, expandIdentity?: boolean): Promise<CoreInterfaces.WebApiTeam[]>;
    /**
     * Create a team in a team project.
     *
     * @param {CoreInterfaces.WebApiTeam} team - The team data used to create the team.
     * @param {string} projectId - The name or ID (GUID) of the team project in which to create the team.
     */
    createTeam(team: CoreInterfaces.WebApiTeam, projectId: string): Promise<CoreInterfaces.WebApiTeam>;
    /**
     * Delete a team.
     *
     * @param {string} projectId - The name or ID (GUID) of the team project containing the team to delete.
     * @param {string} teamId - The name or ID of the team to delete.
     */
    deleteTeam(projectId: string, teamId: string): Promise<void>;
    /**
     * Get a specific team.
     *
     * @param {string} projectId - The name or ID (GUID) of the team project containing the team.
     * @param {string} teamId - The name or ID (GUID) of the team.
     * @param {boolean} expandIdentity - A value indicating whether or not to expand Identity information in the result WebApiTeam object.
     */
    getTeam(projectId: string, teamId: string, expandIdentity?: boolean): Promise<CoreInterfaces.WebApiTeam>;
    /**
     * Get a list of teams.
     *
     * @param {string} projectId
     * @param {boolean} mine - If true return all the teams requesting user is member, otherwise return all the teams user has read access.
     * @param {number} top - Maximum number of teams to return.
     * @param {number} skip - Number of teams to skip.
     * @param {boolean} expandIdentity - A value indicating whether or not to expand Identity information in the result WebApiTeam object.
     */
    getTeams(projectId: string, mine?: boolean, top?: number, skip?: number, expandIdentity?: boolean): Promise<CoreInterfaces.WebApiTeam[]>;
    /**
     * Update a team's name and/or description.
     *
     * @param {CoreInterfaces.WebApiTeam} teamData
     * @param {string} projectId - The name or ID (GUID) of the team project containing the team to update.
     * @param {string} teamId - The name of ID of the team to update.
     */
    updateTeam(teamData: CoreInterfaces.WebApiTeam, projectId: string, teamId: string): Promise<CoreInterfaces.WebApiTeam>;
}
