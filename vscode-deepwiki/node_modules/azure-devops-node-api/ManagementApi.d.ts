import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import ManagementInterfaces = require("./interfaces/ManagementInterfaces");
export interface IManagementApi extends basem.ClientApiBase {
    deleteBillingInfo(organizationId: string): Promise<void>;
    deleteMeterUsageHistory(organizationId: string): Promise<void>;
    getBillingInfo(organizationId: string): Promise<ManagementInterfaces.BillingInfo>;
    saveBillingInfo(billingInfo: ManagementInterfaces.BillingInfo, organizationId: string): Promise<void>;
    getBillableCommitterDetails(billingDate?: Date): Promise<ManagementInterfaces.BillableCommitterDetails[]>;
    getLastMeterUsage(): Promise<ManagementInterfaces.MeterUsage>;
    getMeterUsage(billingDate?: Date): Promise<ManagementInterfaces.MeterUsage>;
    setBillingSnapshot(meterUsage: ManagementInterfaces.MeterUsage): Promise<void>;
    getOrgEnablementStatus(includeAllProperties?: boolean): Promise<ManagementInterfaces.AdvSecEnablementSettings>;
    updateOrgEnablementStatus(savedAdvSecEnablementStatus: ManagementInterfaces.AdvSecEnablementSettingsUpdate): Promise<void>;
    getEstimatedOrgBillablePushers(): Promise<string[]>;
    getProjectEnablementStatus(project: string, includeAllProperties?: boolean): Promise<ManagementInterfaces.AdvSecEnablementSettings>;
    updateProjectEnablementStatus(savedAdvSecEnablementStatus: ManagementInterfaces.AdvSecEnablementSettingsUpdate, project: string): Promise<void>;
    getEstimatedProjectBillablePushers(project: string): Promise<string[]>;
    getRepoEnablementStatus(project: string, repository: string, includeAllProperties?: boolean): Promise<ManagementInterfaces.AdvSecEnablementStatus>;
    updateRepoAdvSecEnablementStatus(savedAdvSecEnablementStatus: ManagementInterfaces.AdvSecEnablementStatusUpdate, project: string, repository: string): Promise<void>;
    getEstimatedRepoBillableCommitters(project: string, repository: string): Promise<string[]>;
}
export declare class ManagementApi extends basem.ClientApiBase implements IManagementApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    /**
     * Delete the billing info for an organization.
     *
     * @param {string} organizationId
     */
    deleteBillingInfo(organizationId: string): Promise<void>;
    /**
     * Delete the meter usage history from Primary SU for an organization.
     *
     * @param {string} organizationId
     */
    deleteMeterUsageHistory(organizationId: string): Promise<void>;
    /**
     * Get the billing info for an organization.
     *
     * @param {string} organizationId - Organization ID to get billing info for.
     */
    getBillingInfo(organizationId: string): Promise<ManagementInterfaces.BillingInfo>;
    /**
     * Save the billing info for an organization.
     *
     * @param {ManagementInterfaces.BillingInfo} billingInfo
     * @param {string} organizationId
     */
    saveBillingInfo(billingInfo: ManagementInterfaces.BillingInfo, organizationId: string): Promise<void>;
    /**
     * Get all billable committers details, including those not matched with a VSID.
     *
     * @param {Date} billingDate - The date to query, or if not provided, today
     */
    getBillableCommitterDetails(billingDate?: Date): Promise<ManagementInterfaces.BillableCommitterDetails[]>;
    /**
     */
    getLastMeterUsage(): Promise<ManagementInterfaces.MeterUsage>;
    /**
     * Get commiters used when calculating billing information.
     *
     * @param {Date} billingDate - The date to query, or if not provided, today
     */
    getMeterUsage(billingDate?: Date): Promise<ManagementInterfaces.MeterUsage>;
    /**
     * @param {ManagementInterfaces.MeterUsage} meterUsage
     */
    setBillingSnapshot(meterUsage: ManagementInterfaces.MeterUsage): Promise<void>;
    /**
     * Get the current status of Advanced Security for the organization
     *
     * @param {boolean} includeAllProperties - When true, also determine if pushes are blocked if they contain secrets
     */
    getOrgEnablementStatus(includeAllProperties?: boolean): Promise<ManagementInterfaces.AdvSecEnablementSettings>;
    /**
     * Update the status of Advanced Security for the organization
     *
     * @param {ManagementInterfaces.AdvSecEnablementSettingsUpdate} savedAdvSecEnablementStatus - The new status
     */
    updateOrgEnablementStatus(savedAdvSecEnablementStatus: ManagementInterfaces.AdvSecEnablementSettingsUpdate): Promise<void>;
    /**
     * Estimate the committers that would be added to the customer's usage if Advanced Security was enabled for this organization.
     *
     */
    getEstimatedOrgBillablePushers(): Promise<string[]>;
    /**
     * Get the current status of Advanced Security for a project
     *
     * @param {string} project - Project ID or project name
     * @param {boolean} includeAllProperties - When true, also determine if pushes are blocked if they contain secrets
     */
    getProjectEnablementStatus(project: string, includeAllProperties?: boolean): Promise<ManagementInterfaces.AdvSecEnablementSettings>;
    /**
     * Update the status of Advanced Security for the project
     *
     * @param {ManagementInterfaces.AdvSecEnablementSettingsUpdate} savedAdvSecEnablementStatus - The new status
     * @param {string} project - Project ID or project name
     */
    updateProjectEnablementStatus(savedAdvSecEnablementStatus: ManagementInterfaces.AdvSecEnablementSettingsUpdate, project: string): Promise<void>;
    /**
     * Estimate the number of committers that would be added to the customer's usage if Advanced Security was enabled for this project.
     *
     * @param {string} project - Project ID or project name
     */
    getEstimatedProjectBillablePushers(project: string): Promise<string[]>;
    /**
     * Determine if Advanced Security is enabled for a repository
     *
     * @param {string} project - Project ID or project name
     * @param {string} repository - The name or ID of the repository
     * @param {boolean} includeAllProperties - When true, will also determine if pushes are blocked when secrets are detected
     */
    getRepoEnablementStatus(project: string, repository: string, includeAllProperties?: boolean): Promise<ManagementInterfaces.AdvSecEnablementStatus>;
    /**
     * Update the enablement of Advanced Security for a repository
     *
     * @param {ManagementInterfaces.AdvSecEnablementStatusUpdate} savedAdvSecEnablementStatus - new status
     * @param {string} project - Project ID or project name
     * @param {string} repository - Name or ID of the repository
     */
    updateRepoAdvSecEnablementStatus(savedAdvSecEnablementStatus: ManagementInterfaces.AdvSecEnablementStatusUpdate, project: string, repository: string): Promise<void>;
    /**
     * Estimate the committers that would be added to the customer's usage if Advanced Security was enabled for this repository.
     *
     * @param {string} project - Project ID or project name
     * @param {string} repository - The name or ID of the repository
     */
    getEstimatedRepoBillableCommitters(project: string, repository: string): Promise<string[]>;
}
