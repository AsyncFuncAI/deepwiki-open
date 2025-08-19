import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import WorkItemTrackingProcessInterfaces = require("./interfaces/WorkItemTrackingProcessInterfaces");
export interface IWorkItemTrackingProcessApi extends basem.ClientApiBase {
    createProcessBehavior(behavior: WorkItemTrackingProcessInterfaces.ProcessBehaviorCreateRequest, processId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessBehavior>;
    deleteProcessBehavior(processId: string, behaviorRefName: string): Promise<void>;
    getProcessBehavior(processId: string, behaviorRefName: string, expand?: WorkItemTrackingProcessInterfaces.GetBehaviorsExpand): Promise<WorkItemTrackingProcessInterfaces.ProcessBehavior>;
    getProcessBehaviors(processId: string, expand?: WorkItemTrackingProcessInterfaces.GetBehaviorsExpand): Promise<WorkItemTrackingProcessInterfaces.ProcessBehavior[]>;
    updateProcessBehavior(behaviorData: WorkItemTrackingProcessInterfaces.ProcessBehaviorUpdateRequest, processId: string, behaviorRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessBehavior>;
    createControlInGroup(control: WorkItemTrackingProcessInterfaces.Control, processId: string, witRefName: string, groupId: string): Promise<WorkItemTrackingProcessInterfaces.Control>;
    moveControlToGroup(control: WorkItemTrackingProcessInterfaces.Control, processId: string, witRefName: string, groupId: string, controlId: string, removeFromGroupId?: string): Promise<WorkItemTrackingProcessInterfaces.Control>;
    removeControlFromGroup(processId: string, witRefName: string, groupId: string, controlId: string): Promise<void>;
    updateControl(control: WorkItemTrackingProcessInterfaces.Control, processId: string, witRefName: string, groupId: string, controlId: string): Promise<WorkItemTrackingProcessInterfaces.Control>;
    addFieldToWorkItemType(field: WorkItemTrackingProcessInterfaces.AddProcessWorkItemTypeFieldRequest, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeField>;
    getAllWorkItemTypeFields(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeField[]>;
    getWorkItemTypeField(processId: string, witRefName: string, fieldRefName: string, expand?: WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeFieldsExpandLevel): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeField>;
    removeWorkItemTypeField(processId: string, witRefName: string, fieldRefName: string): Promise<void>;
    updateWorkItemTypeField(field: WorkItemTrackingProcessInterfaces.UpdateProcessWorkItemTypeFieldRequest, processId: string, witRefName: string, fieldRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeField>;
    addGroup(group: WorkItemTrackingProcessInterfaces.Group, processId: string, witRefName: string, pageId: string, sectionId: string): Promise<WorkItemTrackingProcessInterfaces.Group>;
    moveGroupToPage(group: WorkItemTrackingProcessInterfaces.Group, processId: string, witRefName: string, pageId: string, sectionId: string, groupId: string, removeFromPageId: string, removeFromSectionId: string): Promise<WorkItemTrackingProcessInterfaces.Group>;
    moveGroupToSection(group: WorkItemTrackingProcessInterfaces.Group, processId: string, witRefName: string, pageId: string, sectionId: string, groupId: string, removeFromSectionId: string): Promise<WorkItemTrackingProcessInterfaces.Group>;
    removeGroup(processId: string, witRefName: string, pageId: string, sectionId: string, groupId: string): Promise<void>;
    updateGroup(group: WorkItemTrackingProcessInterfaces.Group, processId: string, witRefName: string, pageId: string, sectionId: string, groupId: string): Promise<WorkItemTrackingProcessInterfaces.Group>;
    getFormLayout(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.FormLayout>;
    createList(picklist: WorkItemTrackingProcessInterfaces.PickList): Promise<WorkItemTrackingProcessInterfaces.PickList>;
    deleteList(listId: string): Promise<void>;
    getList(listId: string): Promise<WorkItemTrackingProcessInterfaces.PickList>;
    getListsMetadata(): Promise<WorkItemTrackingProcessInterfaces.PickListMetadata[]>;
    updateList(picklist: WorkItemTrackingProcessInterfaces.PickList, listId: string): Promise<WorkItemTrackingProcessInterfaces.PickList>;
    addPage(page: WorkItemTrackingProcessInterfaces.Page, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.Page>;
    removePage(processId: string, witRefName: string, pageId: string): Promise<void>;
    updatePage(page: WorkItemTrackingProcessInterfaces.Page, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.Page>;
    createNewProcess(createRequest: WorkItemTrackingProcessInterfaces.CreateProcessModel): Promise<WorkItemTrackingProcessInterfaces.ProcessInfo>;
    deleteProcessById(processTypeId: string): Promise<void>;
    editProcess(updateRequest: WorkItemTrackingProcessInterfaces.UpdateProcessModel, processTypeId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessInfo>;
    getListOfProcesses(expand?: WorkItemTrackingProcessInterfaces.GetProcessExpandLevel): Promise<WorkItemTrackingProcessInterfaces.ProcessInfo[]>;
    getProcessByItsId(processTypeId: string, expand?: WorkItemTrackingProcessInterfaces.GetProcessExpandLevel): Promise<WorkItemTrackingProcessInterfaces.ProcessInfo>;
    addProcessWorkItemTypeRule(processRuleCreate: WorkItemTrackingProcessInterfaces.CreateProcessRuleRequest, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessRule>;
    deleteProcessWorkItemTypeRule(processId: string, witRefName: string, ruleId: string): Promise<void>;
    getProcessWorkItemTypeRule(processId: string, witRefName: string, ruleId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessRule>;
    getProcessWorkItemTypeRules(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessRule[]>;
    updateProcessWorkItemTypeRule(processRule: WorkItemTrackingProcessInterfaces.UpdateProcessRuleRequest, processId: string, witRefName: string, ruleId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessRule>;
    createStateDefinition(stateModel: WorkItemTrackingProcessInterfaces.WorkItemStateInputModel, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel>;
    deleteStateDefinition(processId: string, witRefName: string, stateId: string): Promise<void>;
    getStateDefinition(processId: string, witRefName: string, stateId: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel>;
    getStateDefinitions(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel[]>;
    hideStateDefinition(hideStateModel: WorkItemTrackingProcessInterfaces.HideStateModel, processId: string, witRefName: string, stateId: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel>;
    updateStateDefinition(stateModel: WorkItemTrackingProcessInterfaces.WorkItemStateInputModel, processId: string, witRefName: string, stateId: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel>;
    deleteSystemControl(processId: string, witRefName: string, controlId: string): Promise<WorkItemTrackingProcessInterfaces.Control[]>;
    getSystemControls(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.Control[]>;
    updateSystemControl(control: WorkItemTrackingProcessInterfaces.Control, processId: string, witRefName: string, controlId: string): Promise<WorkItemTrackingProcessInterfaces.Control>;
    createProcessWorkItemType(workItemType: WorkItemTrackingProcessInterfaces.CreateProcessWorkItemTypeRequest, processId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemType>;
    deleteProcessWorkItemType(processId: string, witRefName: string): Promise<void>;
    getProcessWorkItemType(processId: string, witRefName: string, expand?: WorkItemTrackingProcessInterfaces.GetWorkItemTypeExpand): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemType>;
    getProcessWorkItemTypes(processId: string, expand?: WorkItemTrackingProcessInterfaces.GetWorkItemTypeExpand): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemType[]>;
    updateProcessWorkItemType(workItemTypeUpdate: WorkItemTrackingProcessInterfaces.UpdateProcessWorkItemTypeRequest, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemType>;
    addBehaviorToWorkItemType(behavior: WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior, processId: string, witRefNameForBehaviors: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior>;
    getBehaviorForWorkItemType(processId: string, witRefNameForBehaviors: string, behaviorRefName: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior>;
    getBehaviorsForWorkItemType(processId: string, witRefNameForBehaviors: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior[]>;
    removeBehaviorFromWorkItemType(processId: string, witRefNameForBehaviors: string, behaviorRefName: string): Promise<void>;
    updateBehaviorToWorkItemType(behavior: WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior, processId: string, witRefNameForBehaviors: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior>;
}
export declare class WorkItemTrackingProcessApi extends basem.ClientApiBase implements IWorkItemTrackingProcessApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "5264459e-e5e0-4bd8-b118-0985e68a4ec5";
    /**
     * Creates a single behavior in the given process.
     *
     * @param {WorkItemTrackingProcessInterfaces.ProcessBehaviorCreateRequest} behavior
     * @param {string} processId - The ID of the process
     */
    createProcessBehavior(behavior: WorkItemTrackingProcessInterfaces.ProcessBehaviorCreateRequest, processId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessBehavior>;
    /**
     * Removes a behavior in the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} behaviorRefName - The reference name of the behavior
     */
    deleteProcessBehavior(processId: string, behaviorRefName: string): Promise<void>;
    /**
     * Returns a behavior of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} behaviorRefName - The reference name of the behavior
     * @param {WorkItemTrackingProcessInterfaces.GetBehaviorsExpand} expand
     */
    getProcessBehavior(processId: string, behaviorRefName: string, expand?: WorkItemTrackingProcessInterfaces.GetBehaviorsExpand): Promise<WorkItemTrackingProcessInterfaces.ProcessBehavior>;
    /**
     * Returns a list of all behaviors in the process.
     *
     * @param {string} processId - The ID of the process
     * @param {WorkItemTrackingProcessInterfaces.GetBehaviorsExpand} expand
     */
    getProcessBehaviors(processId: string, expand?: WorkItemTrackingProcessInterfaces.GetBehaviorsExpand): Promise<WorkItemTrackingProcessInterfaces.ProcessBehavior[]>;
    /**
     * Replaces a behavior in the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.ProcessBehaviorUpdateRequest} behaviorData
     * @param {string} processId - The ID of the process
     * @param {string} behaviorRefName - The reference name of the behavior
     */
    updateProcessBehavior(behaviorData: WorkItemTrackingProcessInterfaces.ProcessBehaviorUpdateRequest, processId: string, behaviorRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessBehavior>;
    /**
     * Creates a control in a group.
     *
     * @param {WorkItemTrackingProcessInterfaces.Control} control - The control.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} groupId - The ID of the group to add the control to.
     */
    createControlInGroup(control: WorkItemTrackingProcessInterfaces.Control, processId: string, witRefName: string, groupId: string): Promise<WorkItemTrackingProcessInterfaces.Control>;
    /**
     * Moves a control to a specified group.
     *
     * @param {WorkItemTrackingProcessInterfaces.Control} control - The control.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} groupId - The ID of the group to move the control to.
     * @param {string} controlId - The ID of the control.
     * @param {string} removeFromGroupId - The group ID to remove the control from.
     */
    moveControlToGroup(control: WorkItemTrackingProcessInterfaces.Control, processId: string, witRefName: string, groupId: string, controlId: string, removeFromGroupId?: string): Promise<WorkItemTrackingProcessInterfaces.Control>;
    /**
     * Removes a control from the work item form.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} groupId - The ID of the group.
     * @param {string} controlId - The ID of the control to remove.
     */
    removeControlFromGroup(processId: string, witRefName: string, groupId: string, controlId: string): Promise<void>;
    /**
     * Updates a control on the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Control} control - The updated control.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} groupId - The ID of the group.
     * @param {string} controlId - The ID of the control.
     */
    updateControl(control: WorkItemTrackingProcessInterfaces.Control, processId: string, witRefName: string, groupId: string, controlId: string): Promise<WorkItemTrackingProcessInterfaces.Control>;
    /**
     * Adds a field to a work item type.
     *
     * @param {WorkItemTrackingProcessInterfaces.AddProcessWorkItemTypeFieldRequest} field
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    addFieldToWorkItemType(field: WorkItemTrackingProcessInterfaces.AddProcessWorkItemTypeFieldRequest, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeField>;
    /**
     * Returns a list of all fields in a work item type.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    getAllWorkItemTypeFields(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeField[]>;
    /**
     * Returns a field in a work item type.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} fieldRefName - The reference name of the field.
     * @param {WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeFieldsExpandLevel} expand
     */
    getWorkItemTypeField(processId: string, witRefName: string, fieldRefName: string, expand?: WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeFieldsExpandLevel): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeField>;
    /**
     * Removes a field from a work item type. Does not permanently delete the field.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} fieldRefName - The reference name of the field.
     */
    removeWorkItemTypeField(processId: string, witRefName: string, fieldRefName: string): Promise<void>;
    /**
     * Updates a field in a work item type.
     *
     * @param {WorkItemTrackingProcessInterfaces.UpdateProcessWorkItemTypeFieldRequest} field
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} fieldRefName - The reference name of the field.
     */
    updateWorkItemTypeField(field: WorkItemTrackingProcessInterfaces.UpdateProcessWorkItemTypeFieldRequest, processId: string, witRefName: string, fieldRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeField>;
    /**
     * Adds a group to the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Group} group - The group.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} pageId - The ID of the page to add the group to.
     * @param {string} sectionId - The ID of the section to add the group to.
     */
    addGroup(group: WorkItemTrackingProcessInterfaces.Group, processId: string, witRefName: string, pageId: string, sectionId: string): Promise<WorkItemTrackingProcessInterfaces.Group>;
    /**
     * Moves a group to a different page and section.
     *
     * @param {WorkItemTrackingProcessInterfaces.Group} group - The updated group.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} pageId - The ID of the page the group is in.
     * @param {string} sectionId - The ID of the section the group is i.n
     * @param {string} groupId - The ID of the group.
     * @param {string} removeFromPageId - ID of the page to remove the group from.
     * @param {string} removeFromSectionId - ID of the section to remove the group from.
     */
    moveGroupToPage(group: WorkItemTrackingProcessInterfaces.Group, processId: string, witRefName: string, pageId: string, sectionId: string, groupId: string, removeFromPageId: string, removeFromSectionId: string): Promise<WorkItemTrackingProcessInterfaces.Group>;
    /**
     * Moves a group to a different section.
     *
     * @param {WorkItemTrackingProcessInterfaces.Group} group - The updated group.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} pageId - The ID of the page the group is in.
     * @param {string} sectionId - The ID of the section the group is in.
     * @param {string} groupId - The ID of the group.
     * @param {string} removeFromSectionId - ID of the section to remove the group from.
     */
    moveGroupToSection(group: WorkItemTrackingProcessInterfaces.Group, processId: string, witRefName: string, pageId: string, sectionId: string, groupId: string, removeFromSectionId: string): Promise<WorkItemTrackingProcessInterfaces.Group>;
    /**
     * Removes a group from the work item form.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} pageId - The ID of the page the group is in
     * @param {string} sectionId - The ID of the section to the group is in
     * @param {string} groupId - The ID of the group
     */
    removeGroup(processId: string, witRefName: string, pageId: string, sectionId: string, groupId: string): Promise<void>;
    /**
     * Updates a group in the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Group} group - The updated group.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} pageId - The ID of the page the group is in.
     * @param {string} sectionId - The ID of the section the group is in.
     * @param {string} groupId - The ID of the group.
     */
    updateGroup(group: WorkItemTrackingProcessInterfaces.Group, processId: string, witRefName: string, pageId: string, sectionId: string, groupId: string): Promise<WorkItemTrackingProcessInterfaces.Group>;
    /**
     * Gets the form layout.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    getFormLayout(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.FormLayout>;
    /**
     * Creates a picklist.
     *
     * @param {WorkItemTrackingProcessInterfaces.PickList} picklist - Picklist
     */
    createList(picklist: WorkItemTrackingProcessInterfaces.PickList): Promise<WorkItemTrackingProcessInterfaces.PickList>;
    /**
     * Removes a picklist.
     *
     * @param {string} listId - The ID of the list
     */
    deleteList(listId: string): Promise<void>;
    /**
     * Returns a picklist.
     *
     * @param {string} listId - The ID of the list
     */
    getList(listId: string): Promise<WorkItemTrackingProcessInterfaces.PickList>;
    /**
     * Returns meta data of the picklist.
     *
     */
    getListsMetadata(): Promise<WorkItemTrackingProcessInterfaces.PickListMetadata[]>;
    /**
     * Updates a list.
     *
     * @param {WorkItemTrackingProcessInterfaces.PickList} picklist
     * @param {string} listId - The ID of the list
     */
    updateList(picklist: WorkItemTrackingProcessInterfaces.PickList, listId: string): Promise<WorkItemTrackingProcessInterfaces.PickList>;
    /**
     * Adds a page to the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Page} page - The page.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    addPage(page: WorkItemTrackingProcessInterfaces.Page, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.Page>;
    /**
     * Removes a page from the work item form
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} pageId - The ID of the page
     */
    removePage(processId: string, witRefName: string, pageId: string): Promise<void>;
    /**
     * Updates a page on the work item form
     *
     * @param {WorkItemTrackingProcessInterfaces.Page} page - The page
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    updatePage(page: WorkItemTrackingProcessInterfaces.Page, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.Page>;
    /**
     * Creates a process.
     *
     * @param {WorkItemTrackingProcessInterfaces.CreateProcessModel} createRequest - CreateProcessModel.
     */
    createNewProcess(createRequest: WorkItemTrackingProcessInterfaces.CreateProcessModel): Promise<WorkItemTrackingProcessInterfaces.ProcessInfo>;
    /**
     * Removes a process of a specific ID.
     *
     * @param {string} processTypeId
     */
    deleteProcessById(processTypeId: string): Promise<void>;
    /**
     * Edit a process of a specific ID.
     *
     * @param {WorkItemTrackingProcessInterfaces.UpdateProcessModel} updateRequest
     * @param {string} processTypeId
     */
    editProcess(updateRequest: WorkItemTrackingProcessInterfaces.UpdateProcessModel, processTypeId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessInfo>;
    /**
     * Get list of all processes including system and inherited.
     *
     * @param {WorkItemTrackingProcessInterfaces.GetProcessExpandLevel} expand
     */
    getListOfProcesses(expand?: WorkItemTrackingProcessInterfaces.GetProcessExpandLevel): Promise<WorkItemTrackingProcessInterfaces.ProcessInfo[]>;
    /**
     * Get a single process of a specified ID.
     *
     * @param {string} processTypeId
     * @param {WorkItemTrackingProcessInterfaces.GetProcessExpandLevel} expand
     */
    getProcessByItsId(processTypeId: string, expand?: WorkItemTrackingProcessInterfaces.GetProcessExpandLevel): Promise<WorkItemTrackingProcessInterfaces.ProcessInfo>;
    /**
     * Adds a rule to work item type in the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.CreateProcessRuleRequest} processRuleCreate
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    addProcessWorkItemTypeRule(processRuleCreate: WorkItemTrackingProcessInterfaces.CreateProcessRuleRequest, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessRule>;
    /**
     * Removes a rule from the work item type in the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} ruleId - The ID of the rule
     */
    deleteProcessWorkItemTypeRule(processId: string, witRefName: string, ruleId: string): Promise<void>;
    /**
     * Returns a single rule in the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} ruleId - The ID of the rule
     */
    getProcessWorkItemTypeRule(processId: string, witRefName: string, ruleId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessRule>;
    /**
     * Returns a list of all rules in the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    getProcessWorkItemTypeRules(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessRule[]>;
    /**
     * Updates a rule in the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.UpdateProcessRuleRequest} processRule
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} ruleId - The ID of the rule
     */
    updateProcessWorkItemTypeRule(processRule: WorkItemTrackingProcessInterfaces.UpdateProcessRuleRequest, processId: string, witRefName: string, ruleId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessRule>;
    /**
     * Creates a state definition in the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.WorkItemStateInputModel} stateModel
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    createStateDefinition(stateModel: WorkItemTrackingProcessInterfaces.WorkItemStateInputModel, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel>;
    /**
     * Removes a state definition in the work item type of the process.
     *
     * @param {string} processId - ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} stateId - ID of the state
     */
    deleteStateDefinition(processId: string, witRefName: string, stateId: string): Promise<void>;
    /**
     * Returns a single state definition in a work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} stateId - The ID of the state
     */
    getStateDefinition(processId: string, witRefName: string, stateId: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel>;
    /**
     * Returns a list of all state definitions in a work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    getStateDefinitions(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel[]>;
    /**
     * Hides a state definition in the work item type of the process.Only states with customizationType:System can be hidden.
     *
     * @param {WorkItemTrackingProcessInterfaces.HideStateModel} hideStateModel
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} stateId - The ID of the state
     */
    hideStateDefinition(hideStateModel: WorkItemTrackingProcessInterfaces.HideStateModel, processId: string, witRefName: string, stateId: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel>;
    /**
     * Updates a given state definition in the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.WorkItemStateInputModel} stateModel
     * @param {string} processId - ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} stateId - ID of the state
     */
    updateStateDefinition(stateModel: WorkItemTrackingProcessInterfaces.WorkItemStateInputModel, processId: string, witRefName: string, stateId: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemStateResultModel>;
    /**
     * Deletes a system control modification on the work item form.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} controlId - The ID of the control.
     */
    deleteSystemControl(processId: string, witRefName: string, controlId: string): Promise<WorkItemTrackingProcessInterfaces.Control[]>;
    /**
     * Gets edited system controls for a work item type in a process. To get all system controls (base + edited) use layout API(s)
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    getSystemControls(processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.Control[]>;
    /**
     * Updates/adds a system control on the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Control} control
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} controlId - The ID of the control.
     */
    updateSystemControl(control: WorkItemTrackingProcessInterfaces.Control, processId: string, witRefName: string, controlId: string): Promise<WorkItemTrackingProcessInterfaces.Control>;
    /**
     * Creates a work item type in the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.CreateProcessWorkItemTypeRequest} workItemType
     * @param {string} processId - The ID of the process on which to create work item type.
     */
    createProcessWorkItemType(workItemType: WorkItemTrackingProcessInterfaces.CreateProcessWorkItemTypeRequest, processId: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemType>;
    /**
     * Removes a work item type in the process.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    deleteProcessWorkItemType(processId: string, witRefName: string): Promise<void>;
    /**
     * Returns a single work item type in a process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {WorkItemTrackingProcessInterfaces.GetWorkItemTypeExpand} expand - Flag to determine what properties of work item type to return
     */
    getProcessWorkItemType(processId: string, witRefName: string, expand?: WorkItemTrackingProcessInterfaces.GetWorkItemTypeExpand): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemType>;
    /**
     * Returns a list of all work item types in a process.
     *
     * @param {string} processId - The ID of the process
     * @param {WorkItemTrackingProcessInterfaces.GetWorkItemTypeExpand} expand - Flag to determine what properties of work item type to return
     */
    getProcessWorkItemTypes(processId: string, expand?: WorkItemTrackingProcessInterfaces.GetWorkItemTypeExpand): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemType[]>;
    /**
     * Updates a work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.UpdateProcessWorkItemTypeRequest} workItemTypeUpdate
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    updateProcessWorkItemType(workItemTypeUpdate: WorkItemTrackingProcessInterfaces.UpdateProcessWorkItemTypeRequest, processId: string, witRefName: string): Promise<WorkItemTrackingProcessInterfaces.ProcessWorkItemType>;
    /**
     * Adds a behavior to the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior} behavior
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     */
    addBehaviorToWorkItemType(behavior: WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior, processId: string, witRefNameForBehaviors: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior>;
    /**
     * Returns a behavior for the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     * @param {string} behaviorRefName - The reference name of the behavior
     */
    getBehaviorForWorkItemType(processId: string, witRefNameForBehaviors: string, behaviorRefName: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior>;
    /**
     * Returns a list of all behaviors for the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     */
    getBehaviorsForWorkItemType(processId: string, witRefNameForBehaviors: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior[]>;
    /**
     * Removes a behavior for the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     * @param {string} behaviorRefName - The reference name of the behavior
     */
    removeBehaviorFromWorkItemType(processId: string, witRefNameForBehaviors: string, behaviorRefName: string): Promise<void>;
    /**
     * Updates a behavior for the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior} behavior
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     */
    updateBehaviorToWorkItemType(behavior: WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior, processId: string, witRefNameForBehaviors: string): Promise<WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior>;
}
