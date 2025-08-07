import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import PolicyInterfaces = require("./interfaces/PolicyInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface IPolicyApi extends basem.ClientApiBase {
    createPolicyConfiguration(configuration: PolicyInterfaces.PolicyConfiguration, project: string): Promise<PolicyInterfaces.PolicyConfiguration>;
    deletePolicyConfiguration(project: string, configurationId: number): Promise<void>;
    getPolicyConfiguration(project: string, configurationId: number): Promise<PolicyInterfaces.PolicyConfiguration>;
    getPolicyConfigurations(project: string, scope?: string, policyType?: string): Promise<VSSInterfaces.PagedList<PolicyInterfaces.PolicyConfiguration>>;
    updatePolicyConfiguration(configuration: PolicyInterfaces.PolicyConfiguration, project: string, configurationId: number): Promise<PolicyInterfaces.PolicyConfiguration>;
    getPolicyEvaluation(project: string, evaluationId: string): Promise<PolicyInterfaces.PolicyEvaluationRecord>;
    requeuePolicyEvaluation(project: string, evaluationId: string): Promise<PolicyInterfaces.PolicyEvaluationRecord>;
    getPolicyEvaluations(project: string, artifactId: string, includeNotApplicable?: boolean, top?: number, skip?: number): Promise<PolicyInterfaces.PolicyEvaluationRecord[]>;
    getPolicyConfigurationRevision(project: string, configurationId: number, revisionId: number): Promise<PolicyInterfaces.PolicyConfiguration>;
    getPolicyConfigurationRevisions(project: string, configurationId: number, top?: number, skip?: number): Promise<PolicyInterfaces.PolicyConfiguration[]>;
    getPolicyType(project: string, typeId: string): Promise<PolicyInterfaces.PolicyType>;
    getPolicyTypes(project: string): Promise<PolicyInterfaces.PolicyType[]>;
}
export declare class PolicyApi extends basem.ClientApiBase implements IPolicyApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "fb13a388-40dd-4a04-b530-013a739c72ef";
    /**
     * Create a policy configuration of a given policy type.
     *
     * @param {PolicyInterfaces.PolicyConfiguration} configuration - The policy configuration to create.
     * @param {string} project - Project ID or project name
     */
    createPolicyConfiguration(configuration: PolicyInterfaces.PolicyConfiguration, project: string): Promise<PolicyInterfaces.PolicyConfiguration>;
    /**
     * Delete a policy configuration by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} configurationId - ID of the policy configuration to delete.
     */
    deletePolicyConfiguration(project: string, configurationId: number): Promise<void>;
    /**
     * Get a policy configuration by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} configurationId - ID of the policy configuration
     */
    getPolicyConfiguration(project: string, configurationId: number): Promise<PolicyInterfaces.PolicyConfiguration>;
    /**
     * Get a list of policy configurations in a project.
     *
     * @param {string} project - Project ID or project name
     * @param {string} scope - [Provided for legacy reasons] The scope on which a subset of policies is defined.
     * @param {string} policyType - Filter returned policies to only this type
     */
    getPolicyConfigurations(project: string, scope?: string, policyType?: string): Promise<VSSInterfaces.PagedList<PolicyInterfaces.PolicyConfiguration>>;
    /**
     * Update a policy configuration by its ID.
     *
     * @param {PolicyInterfaces.PolicyConfiguration} configuration - The policy configuration to update.
     * @param {string} project - Project ID or project name
     * @param {number} configurationId - ID of the existing policy configuration to be updated.
     */
    updatePolicyConfiguration(configuration: PolicyInterfaces.PolicyConfiguration, project: string, configurationId: number): Promise<PolicyInterfaces.PolicyConfiguration>;
    /**
     * Gets the present evaluation state of a policy.
     *
     * @param {string} project - Project ID or project name
     * @param {string} evaluationId - ID of the policy evaluation to be retrieved.
     */
    getPolicyEvaluation(project: string, evaluationId: string): Promise<PolicyInterfaces.PolicyEvaluationRecord>;
    /**
     * Requeue the policy evaluation.
     *
     * @param {string} project - Project ID or project name
     * @param {string} evaluationId - ID of the policy evaluation to be retrieved.
     */
    requeuePolicyEvaluation(project: string, evaluationId: string): Promise<PolicyInterfaces.PolicyEvaluationRecord>;
    /**
     * Retrieves a list of all the policy evaluation statuses for a specific pull request.
     *
     * @param {string} project - Project ID or project name
     * @param {string} artifactId - A string which uniquely identifies the target of a policy evaluation.
     * @param {boolean} includeNotApplicable - Some policies might determine that they do not apply to a specific pull request. Setting this parameter to true will return evaluation records even for policies which don't apply to this pull request.
     * @param {number} top - The number of policy evaluation records to retrieve.
     * @param {number} skip - The number of policy evaluation records to ignore. For example, to retrieve results 101-150, set top to 50 and skip to 100.
     */
    getPolicyEvaluations(project: string, artifactId: string, includeNotApplicable?: boolean, top?: number, skip?: number): Promise<PolicyInterfaces.PolicyEvaluationRecord[]>;
    /**
     * Retrieve a specific revision of a given policy by ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} configurationId - The policy configuration ID.
     * @param {number} revisionId - The revision ID.
     */
    getPolicyConfigurationRevision(project: string, configurationId: number, revisionId: number): Promise<PolicyInterfaces.PolicyConfiguration>;
    /**
     * Retrieve all revisions for a given policy.
     *
     * @param {string} project - Project ID or project name
     * @param {number} configurationId - The policy configuration ID.
     * @param {number} top - The number of revisions to retrieve.
     * @param {number} skip - The number of revisions to ignore. For example, to retrieve results 101-150, set top to 50 and skip to 100.
     */
    getPolicyConfigurationRevisions(project: string, configurationId: number, top?: number, skip?: number): Promise<PolicyInterfaces.PolicyConfiguration[]>;
    /**
     * Retrieve a specific policy type by ID.
     *
     * @param {string} project - Project ID or project name
     * @param {string} typeId - The policy ID.
     */
    getPolicyType(project: string, typeId: string): Promise<PolicyInterfaces.PolicyType>;
    /**
     * Retrieve all available policy types.
     *
     * @param {string} project - Project ID or project name
     */
    getPolicyTypes(project: string): Promise<PolicyInterfaces.PolicyType[]>;
}
