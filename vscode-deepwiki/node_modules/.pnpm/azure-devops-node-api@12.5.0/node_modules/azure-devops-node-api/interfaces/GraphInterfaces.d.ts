import IdentitiesInterfaces = require("../interfaces/IdentitiesInterfaces");
export interface AadGraphMember extends GraphMember {
    /**
     * The short, generally unique name for the user in the backing directory. For AAD users, this corresponds to the mail nickname, which is often but not necessarily similar to the part of the user's mail address before the @ sign. For GitHub users, this corresponds to the GitHub user handle.
     */
    directoryAlias?: string;
    /**
     * When true, the group has been deleted in the identity provider
     */
    isDeletedInOrigin?: boolean;
    metadataUpdateDate?: Date;
    /**
     * The meta type of the user in the origin, such as "member", "guest", etc. See UserMetaType for the set of possible values.
     */
    metaType?: string;
}
export interface GraphCachePolicies {
    /**
     * Size of the cache
     */
    cacheSize?: number;
}
/**
 * Subject descriptor of a Graph entity
 */
export interface GraphDescriptorResult {
    /**
     * This field contains zero or more interesting links about the graph descriptor. These links may be invoked to obtain additional relationships or more detailed information about this graph descriptor.
     */
    _links?: any;
    value?: string;
}
/**
 * Represents a set of data used to communicate with a federated provider on behalf of a particular user.
 */
export interface GraphFederatedProviderData {
    /**
     * The access token that can be used to communicated with the federated provider on behalf on the target identity, if we were able to successfully acquire one, otherwise <code>null</code>, if we were not.
     */
    accessToken?: string;
    /**
     * The name of the federated provider, e.g. "github.com".
     */
    providerName?: string;
    /**
     * The descriptor of the graph subject to which this federated provider data corresponds.
     */
    subjectDescriptor?: string;
    /**
     * The version number of this federated provider data, which corresponds to when it was last updated. Can be used to prevent returning stale provider data from the cache when the caller is aware of a newer version, such as to prevent local cache poisoning from a remote cache or store. This is the app layer equivalent of the data layer sequence ID.
     */
    version?: number;
}
export interface GraphGlobalExtendedPropertyBatch {
    propertyNameFilters?: string[];
    subjectDescriptors?: string[];
}
/**
 * Graph group entity
 */
export interface GraphGroup extends GraphMember {
    /**
     * A short phrase to help human readers disambiguate groups with similar names
     */
    description?: string;
    isCrossProject?: boolean;
    isDeleted?: boolean;
    isGlobalScope?: boolean;
    isRestrictedVisible?: boolean;
    localScopeId?: string;
    scopeId?: string;
    scopeName?: string;
    scopeType?: string;
    securingHostId?: string;
    specialType?: string;
}
/**
 * Do not attempt to use this type to create a new group. This type does not contain sufficient fields to create a new group.
 */
export interface GraphGroupCreationContext {
    /**
     * Optional: If provided, we will use this identifier for the storage key of the created group
     */
    storageKey?: string;
}
/**
 * Use this type to create a new group using the mail address as a reference to an existing group from an external AD or AAD backed provider. This is the subset of GraphGroup fields required for creation of a group for the AAD and AD use case.
 */
export interface GraphGroupMailAddressCreationContext extends GraphGroupCreationContext {
    /**
     * This should be the mail address or the group in the source AD or AAD provider. Example: jamal@contoso.com Team Services will communicate with the source provider to fill all other fields on creation.
     */
    mailAddress: string;
}
/**
 * Use this type to create a new group using the OriginID as a reference to an existing group from an external AD or AAD backed provider. This is the subset of GraphGroup fields required for creation of a group for the AD and AAD use case.
 */
export interface GraphGroupOriginIdCreationContext extends GraphGroupCreationContext {
    /**
     * This should be the object id or sid of the group from the source AD or AAD provider. Example: d47d025a-ce2f-4a79-8618-e8862ade30dd Team Services will communicate with the source provider to fill all other fields on creation.
     */
    originId: string;
}
/**
 * Use this type to create a new Vsts group that is not backed by an external provider.
 */
export interface GraphGroupVstsCreationContext extends GraphGroupCreationContext {
    /**
     * For internal use only in back compat scenarios.
     */
    crossProject?: boolean;
    /**
     * Used by VSTS groups; if set this will be the group description, otherwise ignored
     */
    description?: string;
    descriptor?: string;
    /**
     * Used by VSTS groups; if set this will be the group DisplayName, otherwise ignored
     */
    displayName: string;
    /**
     * For internal use only in back compat scenarios.
     */
    restrictedVisibility?: boolean;
    /**
     * For internal use only in back compat scenarios.
     */
    specialGroupType?: string;
}
export interface GraphMember extends GraphSubject {
    /**
     * This represents the name of the container of origin for a graph member. (For MSA this is "Windows Live ID", for AD the name of the domain, for AAD the tenantID of the directory, for VSTS groups the ScopeId, etc)
     */
    domain?: string;
    /**
     * The email address of record for a given graph member. This may be different than the principal name.
     */
    mailAddress?: string;
    /**
     * This is the PrincipalName of this graph member from the source provider. The source provider may change this field over time and it is not guaranteed to be immutable for the life of the graph member by VSTS.
     */
    principalName?: string;
}
/**
 * Relationship between a container and a member
 */
export interface GraphMembership {
    /**
     * This field contains zero or more interesting links about the graph membership. These links may be invoked to obtain additional relationships or more detailed information about this graph membership.
     */
    _links?: any;
    containerDescriptor?: string;
    memberDescriptor?: string;
}
/**
 * Status of a Graph membership (active/inactive)
 */
export interface GraphMembershipState {
    /**
     * This field contains zero or more interesting links about the graph membership state. These links may be invoked to obtain additional relationships or more detailed information about this graph membership state.
     */
    _links?: any;
    /**
     * When true, the membership is active
     */
    active?: boolean;
}
export interface GraphMembershipTraversal {
    /**
     * Reason why the subject could not be traversed completely
     */
    incompletenessReason?: string;
    /**
     * When true, the subject is traversed completely
     */
    isComplete?: boolean;
    /**
     * The traversed subject descriptor
     */
    subjectDescriptor?: string;
    /**
     * Subject descriptor ids of the traversed members
     */
    traversedSubjectIds?: string[];
    /**
     * Subject descriptors of the traversed members
     */
    traversedSubjects?: string[];
}
/**
 * Who is the provider for this user and what is the identifier and domain that is used to uniquely identify the user.
 */
export interface GraphProviderInfo {
    /**
     * The descriptor is the primary way to reference the graph subject while the system is running. This field will uniquely identify the same graph subject across both Accounts and Organizations.
     */
    descriptor?: string;
    /**
     * This represents the name of the container of origin for a graph member. (For MSA this is "Windows Live ID", for AAD the tenantID of the directory.)
     */
    domain?: string;
    /**
     * The type of source provider for the origin identifier (ex: "aad", "msa")
     */
    origin?: string;
    /**
     * The unique identifier from the system of origin. (For MSA this is the PUID in hex notation, for AAD this is the object id.)
     */
    originId?: string;
}
/**
 * Container where a graph entity is defined (organization, project, team)
 */
export interface GraphScope extends GraphSubject {
    /**
     * The subject descriptor that references the administrators group for this scope. Only members of this group can change the contents of this scope or assign other users permissions to access this scope.
     */
    administratorDescriptor?: string;
    /**
     * When true, this scope is also a securing host for one or more scopes.
     */
    isGlobal?: boolean;
    /**
     * The subject descriptor for the closest account or organization in the ancestor tree of this scope.
     */
    parentDescriptor?: string;
    /**
     * The type of this scope. Typically ServiceHost or TeamProject.
     */
    scopeType?: IdentitiesInterfaces.GroupScopeType;
    /**
     * The subject descriptor for the containing organization in the ancestor tree of this scope.
     */
    securingHostDescriptor?: string;
}
/**
 * This type is the subset of fields that can be provided by the user to create a Vsts scope. Scope creation is currently limited to internal back-compat scenarios. End users that attempt to create a scope with this API will fail.
 */
export interface GraphScopeCreationContext {
    /**
     * Set this field to override the default description of this scope's admin group.
     */
    adminGroupDescription?: string;
    /**
     * All scopes have an Administrator Group that controls access to the contents of the scope. Set this field to use a non-default group name for that administrators group.
     */
    adminGroupName?: string;
    /**
     * Set this optional field if this scope is created on behalf of a user other than the user making the request. This should be the Id of the user that is not the requester.
     */
    creatorId?: string;
    /**
     * The scope must be provided with a unique name within the parent scope. This means the created scope can have a parent or child with the same name, but no siblings with the same name.
     */
    name?: string;
    /**
     * The type of scope being created.
     */
    scopeType?: IdentitiesInterfaces.GroupScopeType;
    /**
     * An optional ID that uniquely represents the scope within it's parent scope. If this parameter is not provided, Vsts will generate on automatically.
     */
    storageKey?: string;
}
export interface GraphServicePrincipal extends AadGraphMember {
    applicationId?: string;
}
/**
 * Do not attempt to use this type to create a new service principal. Use one of the subclasses instead. This type does not contain sufficient fields to create a new service principal.
 */
export interface GraphServicePrincipalCreationContext {
    /**
     * Optional: If provided, we will use this identifier for the storage key of the created service principal
     */
    storageKey?: string;
}
/**
 * Use this type to create a new service principal using the OriginID as a reference to an existing service principal from an external AAD backed provider. This is the subset of GraphServicePrincipal fields required for creation of a GraphServicePrincipal for the AAD use case when looking up the service principal by its unique ID in the backing provider.
 */
export interface GraphServicePrincipalOriginIdCreationContext extends GraphServicePrincipalCreationContext {
    /**
     * This should be the object id of the service principal from the AAD provider. Example: d47d025a-ce2f-4a79-8618-e8862ade30dd Team Services will communicate with the source provider to fill all other fields on creation.
     */
    originId: string;
}
/**
 * Use this type to update an existing service principal using the OriginID as a reference to an existing service principal from an external AAD backed provider. This is the subset of GraphServicePrincipal fields required for creation of a GraphServicePrincipal for AAD use case when looking up the service principal by its unique ID in the backing provider.
 */
export interface GraphServicePrincipalOriginIdUpdateContext extends GraphServicePrincipalUpdateContext {
    /**
     * This should be the object id or sid of the service principal from the source AAD provider. Example: d47d025a-ce2f-4a79-8618-e8862ade30dd Azure Devops will communicate with the source provider to fill all other fields on creation.
     */
    originId: string;
}
/**
 * Do not attempt to use this type to update service principal. Use one of the subclasses instead. This type does not contain sufficient fields to create a new service principal.
 */
export interface GraphServicePrincipalUpdateContext {
    /**
     * Storage key should not be specified in case of updating service principal
     */
    storageKey?: string;
}
/**
 * Storage key of a Graph entity
 */
export interface GraphStorageKeyResult {
    /**
     * This field contains zero or more interesting links about the graph storage key. These links may be invoked to obtain additional relationships or more detailed information about this graph storage key.
     */
    _links?: any;
    value?: string;
}
/**
 * Top-level graph entity
 */
export interface GraphSubject extends GraphSubjectBase {
    /**
     * [Internal Use Only] The legacy descriptor is here in case you need to access old version IMS using identity descriptor.
     */
    legacyDescriptor?: string;
    /**
     * The type of source provider for the origin identifier (ex:AD, AAD, MSA)
     */
    origin?: string;
    /**
     * The unique identifier from the system of origin. Typically a sid, object id or Guid. Linking and unlinking operations can cause this value to change for a user because the user is not backed by a different provider and has a different unique id in the new provider.
     */
    originId?: string;
    /**
     * This field identifies the type of the graph subject (ex: Group, Scope, User).
     */
    subjectKind?: string;
}
export interface GraphSubjectBase {
    /**
     * This field contains zero or more interesting links about the graph subject. These links may be invoked to obtain additional relationships or more detailed information about this graph subject.
     */
    _links?: any;
    /**
     * The descriptor is the primary way to reference the graph subject while the system is running. This field will uniquely identify the same graph subject across both Accounts and Organizations.
     */
    descriptor?: string;
    /**
     * This is the non-unique display name of the graph subject. To change this field, you must alter its value in the source provider.
     */
    displayName?: string;
    /**
     * This url is the full route to the source resource of this graph subject.
     */
    url?: string;
}
/**
 * Batching of subjects to lookup using the Graph API
 */
export interface GraphSubjectLookup {
    lookupKeys?: GraphSubjectLookupKey[];
}
export interface GraphSubjectLookupKey {
    descriptor?: string;
}
/**
 * Subject to search using the Graph API
 */
export interface GraphSubjectQuery {
    /**
     * Search term to search for Azure Devops users or/and groups
     */
    query?: string;
    /**
     * Optional parameter. Specify a non-default scope (collection, project) to search for users or groups within the scope.
     */
    scopeDescriptor?: string;
    /**
     * "User" or "Group" can be specified, both or either
     */
    subjectKind?: string[];
}
export interface GraphSystemSubject extends GraphSubject {
}
export declare enum GraphTraversalDirection {
    Unknown = 0,
    Down = 1,
    Up = 2
}
export interface GraphUser extends AadGraphMember {
}
/**
 * Do not attempt to use this type to create a new user. Use one of the subclasses instead. This type does not contain sufficient fields to create a new user.
 */
export interface GraphUserCreationContext {
    /**
     * Optional: If provided, we will use this identifier for the storage key of the created user
     */
    storageKey?: string;
}
/**
 * Use this type to create a new user using the mail address as a reference to an existing user from an external AD or AAD backed provider. This is the subset of GraphUser fields required for creation of a GraphUser for the AD and AAD use case when looking up the user by its mail address in the backing provider.
 */
export interface GraphUserMailAddressCreationContext extends GraphUserCreationContext {
    /**
     * This should be the mail address of the user in the source AD or AAD provider. Example: Jamal.Hartnett@contoso.com Team Services will communicate with the source provider to fill all other fields on creation.
     */
    mailAddress: string;
}
/**
 * Use this type to create a new user using the OriginID as a reference to an existing user from an external AD or AAD backed provider. This is the subset of GraphUser fields required for creation of a GraphUser for the AD and AAD use case when looking up the user by its unique ID in the backing provider.
 */
export interface GraphUserOriginIdCreationContext extends GraphUserCreationContext {
    /**
     * This should be the name of the origin provider. Example: github.com
     */
    origin?: string;
    /**
     * This should be the object id or sid of the user from the source AD or AAD provider. Example: d47d025a-ce2f-4a79-8618-e8862ade30dd Team Services will communicate with the source provider to fill all other fields on creation.
     */
    originId: string;
}
/**
 * Use this type to update an existing user using the OriginID as a reference to an existing user from an external AD or AAD backed provider. This is the subset of GraphUser fields required for creation of a GraphUser for the AD and AAD use case when looking up the user by its unique ID in the backing provider.
 */
export interface GraphUserOriginIdUpdateContext extends GraphUserUpdateContext {
    /**
     * This should be the object id or sid of the user from the source AD or AAD provider. Example: d47d025a-ce2f-4a79-8618-e8862ade30dd Azure Devops will communicate with the source provider to fill all other fields on creation.
     */
    originId: string;
}
/**
 * Use this type to create a new user using the principal name as a reference to an existing user from an external AD or AAD backed provider. This is the subset of GraphUser fields required for creation of a GraphUser for the AD and AAD use case when looking up the user by its principal name in the backing provider.
 */
export interface GraphUserPrincipalNameCreationContext extends GraphUserCreationContext {
    /**
     * This should be the principal name or upn of the user in the source AD or AAD provider. Example: jamal@contoso.com Team Services will communicate with the source provider to fill all other fields on creation.
     */
    principalName: string;
}
/**
 * Use this type for transfering identity rights, for instance after performing a Tenant switch.
 */
export interface GraphUserPrincipalNameUpdateContext extends GraphUserUpdateContext {
    /**
     * This should be Principal Name (UPN) to which we want to transfer rights. Example: destination@email.com
     */
    principalName: string;
}
/**
 * Do not attempt to use this type to update user. Use one of the subclasses instead. This type does not contain sufficient fields to create a new user.
 */
export interface GraphUserUpdateContext {
    /**
     * Storage key should not be specified in case of updating user
     */
    storageKey?: string;
}
export interface IdentityMapping {
    source?: UserPrincipalName;
    target?: UserPrincipalName;
}
export interface IdentityMappings {
    mappings?: IdentityMapping[];
}
export interface MappingResult {
    code?: string;
    errorMessage?: string;
}
export interface PagedGraphGroups {
    /**
     * This will be non-null if there is another page of data. There will never be more than one continuation token returned by a request.
     */
    continuationToken?: string[];
    /**
     * The enumerable list of groups found within a page.
     */
    graphGroups?: GraphGroup[];
}
export interface PagedGraphMembers {
    /**
     * This will be non-null if there is another page of data. There will never be more than one continuation token returned by a request.
     */
    continuationToken?: string[];
    /**
     * The enumerable list of members found within a page.
     */
    graphMembers?: GraphMember[];
}
export interface PagedGraphServicePrincipals {
    /**
     * This will be non-null if there is another page of data. There will never be more than one continuation token returned by a request.
     */
    continuationToken?: string[];
    /**
     * The enumerable list of service principals found within a page.
     */
    graphServicePrincipals?: GraphServicePrincipal[];
}
export interface PagedGraphUsers {
    /**
     * This will be non-null if there is another page of data. There will never be more than one continuation token returned by a request.
     */
    continuationToken?: string[];
    /**
     * The enumerable set of users found within a page.
     */
    graphUsers?: GraphUser[];
}
export interface RequestAccessPayLoad {
    message?: string;
    projectUri?: string;
    urlRequested?: string;
}
export interface ResolveDisconnectedUsersResponse {
    code?: string;
    errorMessage?: string;
    mappingResults?: MappingResult[];
}
export interface UserPrincipalName {
    principalName?: string;
}
export declare var TypeInfo: {
    AadGraphMember: any;
    GraphScope: any;
    GraphScopeCreationContext: any;
    GraphServicePrincipal: any;
    GraphTraversalDirection: {
        enumValues: {
            "unknown": number;
            "down": number;
            "up": number;
        };
    };
    GraphUser: any;
    PagedGraphServicePrincipals: any;
    PagedGraphUsers: any;
};
