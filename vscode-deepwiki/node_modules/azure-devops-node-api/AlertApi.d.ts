/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import AlertInterfaces = require("./interfaces/AlertInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface IAlertApi extends basem.ClientApiBase {
    getAlert(project: string, alertId: number, repository: string, ref?: string, expand?: AlertInterfaces.ExpandOption): Promise<AlertInterfaces.Alert>;
    getAlerts(project: string, repository: string, top?: number, orderBy?: string, criteria?: AlertInterfaces.SearchCriteria, continuationToken?: string): Promise<VSSInterfaces.PagedList<AlertInterfaces.Alert>>;
    getAlertSarif(project: string, alertId: number, repository: string, ref?: string, expand?: AlertInterfaces.ExpandOption): Promise<string>;
    updateAlert(stateUpdate: AlertInterfaces.AlertStateUpdate, project: string, alertId: number, repository: string): Promise<AlertInterfaces.Alert>;
    getAlertInstances(project: string, alertId: number, repository: string, ref?: string): Promise<AlertInterfaces.AlertAnalysisInstance[]>;
    uploadSarif(customHeaders: any, contentStream: NodeJS.ReadableStream, project: string, repository: string): Promise<number>;
    getUxFilters(project: string, repository: string, alertType: AlertInterfaces.AlertType): Promise<AlertInterfaces.UxFilters>;
    getSarif(sarifId: number): Promise<AlertInterfaces.SarifUploadStatus>;
}
export declare class AlertApi extends basem.ClientApiBase implements IAlertApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    /**
     * Get an alert.
     *
     * @param {string} project - Project ID or project name
     * @param {number} alertId - ID of alert to retrieve
     * @param {string} repository - Name or id  of a repository that alert is part of
     * @param {string} ref
     * @param {AlertInterfaces.ExpandOption} expand - Expand alert attributes. Possible options are {ValidationFingerprint, None}
     */
    getAlert(project: string, alertId: number, repository: string, ref?: string, expand?: AlertInterfaces.ExpandOption): Promise<AlertInterfaces.Alert>;
    /**
     * Get alerts for a repository
     *
     * @param {string} project - Project ID or project name
     * @param {string} repository - The name or ID of the repository
     * @param {number} top - The maximum number of alerts to return
     * @param {string} orderBy - Must be "id" "firstSeen" "lastSeen" "fixedOn" or "severity"  Defaults to "id"
     * @param {AlertInterfaces.SearchCriteria} criteria - Options to limit the alerts returned
     * @param {string} continuationToken - If there are more alerts than can be returned, a continuation token is placed in the "x-ms-continuationtoken" header.  Use that token here to get the next page of alerts
     */
    getAlerts(project: string, repository: string, top?: number, orderBy?: string, criteria?: AlertInterfaces.SearchCriteria, continuationToken?: string): Promise<VSSInterfaces.PagedList<AlertInterfaces.Alert>>;
    /**
     * Get an alert.
     *
     * @param {string} project - Project ID or project name
     * @param {number} alertId - ID of alert to retrieve
     * @param {string} repository - Name or id  of a repository that alert is part of
     * @param {string} ref
     * @param {AlertInterfaces.ExpandOption} expand - Expand alert attributes. Possible options are {ValidationFingerprint, None}
     */
    getAlertSarif(project: string, alertId: number, repository: string, ref?: string, expand?: AlertInterfaces.ExpandOption): Promise<string>;
    /**
     * Update the status of an alert
     *
     * @param {AlertInterfaces.AlertStateUpdate} stateUpdate - The new status of the alert
     * @param {string} project - Project ID or project name
     * @param {number} alertId - The ID of the alert
     * @param {string} repository - The name or ID of the repository
     */
    updateAlert(stateUpdate: AlertInterfaces.AlertStateUpdate, project: string, alertId: number, repository: string): Promise<AlertInterfaces.Alert>;
    /**
     * Get instances of an alert.
     *
     * @param {string} project - Project ID or project name
     * @param {number} alertId - ID of alert to retrieve
     * @param {string} repository - Name or id of a repository that alert is part of
     * @param {string} ref
     */
    getAlertInstances(project: string, alertId: number, repository: string, ref?: string): Promise<AlertInterfaces.AlertAnalysisInstance[]>;
    /**
     * Upload a Sarif containing security alerts
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} project - Project ID or project name
     * @param {string} repository - The name or ID of a repository
     */
    uploadSarif(customHeaders: any, contentStream: NodeJS.ReadableStream, project: string, repository: string): Promise<number>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} repository
     * @param {AlertInterfaces.AlertType} alertType
     */
    getUxFilters(project: string, repository: string, alertType: AlertInterfaces.AlertType): Promise<AlertInterfaces.UxFilters>;
    /**
     * Get the status of the Sarif processing job
     *
     * @param {number} sarifId - Sarif ID returned when the Sarif was uploaded
     */
    getSarif(sarifId: number): Promise<AlertInterfaces.SarifUploadStatus>;
}
