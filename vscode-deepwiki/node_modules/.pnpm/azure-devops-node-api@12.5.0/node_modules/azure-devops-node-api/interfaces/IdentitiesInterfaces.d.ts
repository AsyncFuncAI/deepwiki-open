/**
 * Container class for changed identities
 */
export interface ChangedIdentities {
    /**
     * Changed Identities
     */
    identities?: Identity[];
    /**
     * More data available, set to true if pagesize is specified.
     */
    moreData?: boolean;
    /**
     * Last Identity SequenceId
     */
    sequenceContext?: ChangedIdentitiesContext;
}
/**
 * Context class for changed identities
 */
export interface ChangedIdentitiesContext {
    /**
     * Last Group SequenceId
     */
    groupSequenceId?: number;
    /**
     * Last Identity SequenceId
     */
    identitySequenceId?: number;
    /**
     * Last Group OrganizationIdentitySequenceId
     */
    organizationIdentitySequenceId?: number;
    /**
     * Page size
     */
    pageSize?: number;
}
export interface CreateScopeInfo {
    adminGroupDescription?: string;
    adminGroupName?: string;
    creatorId?: string;
    parentScopeId?: string;
    scopeName?: string;
    scopeType?: GroupScopeType;
}
export interface FrameworkIdentityInfo {
    displayName?: string;
    identifier?: string;
    identityType?: FrameworkIdentityType;
    role?: string;
}
export declare enum FrameworkIdentityType {
    None = 0,
    ServiceIdentity = 1,
    AggregateIdentity = 2,
    ImportedIdentity = 3
}
export interface GroupMembership {
    active?: boolean;
    descriptor?: IdentityDescriptor;
    id?: string;
    queriedId?: string;
}
export declare enum GroupScopeType {
    Generic = 0,
    ServiceHost = 1,
    TeamProject = 2
}
export interface Identity extends IdentityBase {
}
/**
 * Base Identity class to allow "trimmed" identity class in the GetConnectionData API Makes sure that on-the-wire representations of the derived classes are compatible with each other (e.g. Server responds with PublicIdentity object while client deserializes it as Identity object) Derived classes should not have additional [DataMember] properties
 */
export interface IdentityBase {
    /**
     * The custom display name for the identity (if any). Setting this property to an empty string will clear the existing custom display name. Setting this property to null will not affect the existing persisted value (since null values do not get sent over the wire or to the database)
     */
    customDisplayName?: string;
    descriptor?: IdentityDescriptor;
    /**
     * Identity Identifier. Also called Storage Key, or VSID
     */
    id?: string;
    /**
     * True if the identity has a membership in any Azure Devops group in the organization.
     */
    isActive?: boolean;
    /**
     * True if the identity is a group.
     */
    isContainer?: boolean;
    masterId?: string;
    /**
     * Id of the members of the identity (groups only).
     */
    memberIds?: string[];
    memberOf?: IdentityDescriptor[];
    members?: IdentityDescriptor[];
    metaTypeId?: number;
    properties?: any;
    /**
     * The display name for the identity as specified by the source identity provider.
     */
    providerDisplayName?: string;
    resourceVersion?: number;
    socialDescriptor?: string;
    /**
     * Subject descriptor of a Graph entity.
     */
    subjectDescriptor?: string;
    uniqueUserId?: number;
}
export interface IdentityBatchInfo {
    descriptors?: IdentityDescriptor[];
    identityIds?: string[];
    includeRestrictedVisibility?: boolean;
    propertyNames?: string[];
    queryMembership?: QueryMembership;
    socialDescriptors?: string[];
    subjectDescriptors?: string[];
}
/**
 * An Identity descriptor is a wrapper for the identity type (Windows SID, Passport) along with a unique identifier such as the SID or PUID.
 */
export interface IdentityDescriptor {
    /**
     * The unique identifier for this identity, not exceeding 256 chars, which will be persisted.
     */
    identifier?: string;
    /**
     * Type of descriptor (for example, Windows, Passport, etc.).
     */
    identityType?: string;
}
export interface IdentityRightsTransferData {
    userPrincipalNameMappings?: {
        [key: string]: string;
    };
}
export interface IdentityScope {
    administrators?: IdentityDescriptor;
    id: string;
    isActive?: boolean;
    isGlobal?: boolean;
    localScopeId?: string;
    name?: string;
    parentId?: string;
    scopeType?: GroupScopeType;
    securingHostId?: string;
    subjectDescriptor?: string;
}
/**
 * Identity information.
 */
export interface IdentitySelf {
    /**
     * The UserPrincipalName (UPN) of the account. This value comes from the source provider.
     */
    accountName?: string;
    /**
     * The display name. For AAD accounts with multiple tenants this is the display name of the profile in the home tenant.
     */
    displayName?: string;
    /**
     * This represents the name of the container of origin. For AAD accounts this is the tenantID of the home tenant. For MSA accounts this is the string "Windows Live ID".
     */
    domain?: string;
    /**
     * This is the VSID of the home tenant profile. If the profile is signed into the home tenant or if the profile has no tenants then this Id is the same as the Id returned by the profile/profiles/me endpoint. Going forward it is recommended that you use the combined values of Origin, OriginId and Domain to uniquely identify a user rather than this Id.
     */
    id?: string;
    /**
     * The type of source provider for the origin identifier. For MSA accounts this is "msa". For AAD accounts this is "aad".
     */
    origin?: string;
    /**
     * The unique identifier from the system of origin. If there are multiple tenants this is the unique identifier of the account in the home tenant. (For MSA this is the PUID in hex notation, for AAD this is the object id.)
     */
    originId?: string;
    /**
     * For AAD accounts this is all of the tenants that this account is a member of.
     */
    tenants?: TenantInfo[];
}
export interface IdentitySnapshot {
    groups?: Identity[];
    identityIds?: string[];
    memberships?: GroupMembership[];
    scopeId?: string;
    scopes?: IdentityScope[];
}
export interface IdentityUpdateData {
    id?: string;
    index?: number;
    updated?: boolean;
}
export interface PagedIdentities {
    continuationToken?: string[];
    identities?: Identity[];
}
export declare enum QueryMembership {
    /**
     * Query will not return any membership data
     */
    None = 0,
    /**
     * Query will return only direct membership data
     */
    Direct = 1,
    /**
     * Query will return expanded membership data
     */
    Expanded = 2,
    /**
     * Query will return expanded up membership data (parents only)
     */
    ExpandedUp = 3,
    /**
     * Query will return expanded down membership data (children only)
     */
    ExpandedDown = 4
}
export declare enum ReadIdentitiesOptions {
    None = 0,
    FilterIllegalMemberships = 1
}
export interface SwapIdentityInfo {
    id1?: string;
    id2?: string;
}
export interface TenantInfo {
    homeTenant?: boolean;
    tenantId?: string;
    tenantName?: string;
    verifiedDomains?: string[];
}
export declare var TypeInfo: {
    CreateScopeInfo: any;
    FrameworkIdentityInfo: any;
    FrameworkIdentityType: {
        enumValues: {
            "none": number;
            "serviceIdentity": number;
            "aggregateIdentity": number;
            "importedIdentity": number;
        };
    };
    GroupScopeType: {
        enumValues: {
            "generic": number;
            "serviceHost": number;
            "teamProject": number;
        };
    };
    IdentityBatchInfo: any;
    IdentityScope: any;
    IdentitySnapshot: any;
    QueryMembership: {
        enumValues: {
            "none": number;
            "direct": number;
            "expanded": number;
            "expandedUp": number;
            "expandedDown": number;
        };
    };
    ReadIdentitiesOptions: {
        enumValues: {
            "none": number;
            "filterIllegalMemberships": number;
        };
    };
};
