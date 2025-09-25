import IdentitiesInterfaces = require("../interfaces/IdentitiesInterfaces");
import VSSInterfaces = require("../interfaces/common/VSSInterfaces");
export interface CategorizedWebApiTeams {
    /**
     * Teams that the user is a member of.
     */
    myTeams?: WebApiTeam[];
    /**
     * Teams that the user can read but is not member of.
     */
    otherReadableTeams?: WebApiTeam[];
}
export declare enum ConnectedServiceKind {
    /**
     * Custom or unknown service
     */
    Custom = 0,
    /**
     * Azure Subscription
     */
    AzureSubscription = 1,
    /**
     * Chef Connection
     */
    Chef = 2,
    /**
     * Generic Connection
     */
    Generic = 3
}
export interface IdentityData {
    identityIds?: string[];
}
export interface Process extends ProcessReference {
    _links?: any;
    description?: string;
    id?: string;
    isDefault?: boolean;
    type?: ProcessType;
}
/**
 * Type of process customization on a collection.
 */
export declare enum ProcessCustomizationType {
    /**
     * Process customization can't be computed.
     */
    Unknown = -1,
    /**
     * Customization based on project-scoped xml customization
     */
    Xml = 0,
    /**
     * Customization based on process inheritance
     */
    Inherited = 1
}
export interface ProcessReference {
    name?: string;
    url?: string;
}
export declare enum ProcessType {
    System = 0,
    Custom = 1,
    Inherited = 2
}
/**
 * Contains the image data for project avatar.
 */
export interface ProjectAvatar {
    /**
     * The avatar image represented as a byte array.
     */
    image?: number[];
}
export declare enum ProjectChangeType {
    Modified = 0,
    Deleted = 1,
    Added = 2
}
/**
 * Contains information describing a project.
 */
export interface ProjectInfo {
    /**
     * The abbreviated name of the project.
     */
    abbreviation?: string;
    /**
     * The description of the project.
     */
    description?: string;
    /**
     * The id of the project.
     */
    id?: string;
    /**
     * The time that this project was last updated.
     */
    lastUpdateTime?: Date;
    /**
     * The name of the project.
     */
    name?: string;
    /**
     * A set of name-value pairs storing additional property data related to the project.
     */
    properties?: ProjectProperty[];
    /**
     * The current revision of the project.
     */
    revision?: number;
    /**
     * The current state of the project.
     */
    state?: any;
    /**
     * A Uri that can be used to refer to this project.
     */
    uri?: string;
    /**
     * The version number of the project.
     */
    version?: number;
    /**
     * Indicates whom the project is visible to.
     */
    visibility?: ProjectVisibility;
}
export interface ProjectMessage {
    project?: ProjectInfo;
    projectChangeType?: ProjectChangeType;
    shouldInvalidateSystemStore?: boolean;
}
export interface ProjectProperties {
    /**
     * The team project Id
     */
    projectId?: string;
    /**
     * The collection of team project properties
     */
    properties?: ProjectProperty[];
}
/**
 * A named value associated with a project.
 */
export interface ProjectProperty {
    /**
     * The name of the property.
     */
    name?: string;
    /**
     * The value of the property.
     */
    value?: any;
}
export declare enum ProjectVisibility {
    Unchanged = -1,
    /**
     * The project is only visible to users with explicit access.
     */
    Private = 0,
    /**
     * Enterprise level project visibility
     */
    Organization = 1,
    /**
     * The project is visible to all.
     */
    Public = 2,
    SystemPrivate = 3
}
export interface Proxy {
    authorization?: ProxyAuthorization;
    /**
     * This is a description string
     */
    description?: string;
    /**
     * The friendly name of the server
     */
    friendlyName?: string;
    globalDefault?: boolean;
    /**
     * This is a string representation of the site that the proxy server is located in (e.g. "NA-WA-RED")
     */
    site?: string;
    siteDefault?: boolean;
    /**
     * The URL of the proxy server
     */
    url?: string;
}
export interface ProxyAuthorization {
    /**
     * Gets or sets the endpoint used to obtain access tokens from the configured token service.
     */
    authorizationUrl?: string;
    /**
     * Gets or sets the client identifier for this proxy.
     */
    clientId?: string;
    /**
     * Gets or sets the user identity to authorize for on-prem.
     */
    identity?: IdentitiesInterfaces.IdentityDescriptor;
    /**
     * Gets or sets the public key used to verify the identity of this proxy. Only specify on hosted.
     */
    publicKey?: VSSInterfaces.PublicKey;
}
export declare enum SourceControlTypes {
    Tfvc = 1,
    Git = 2
}
/**
 * The Team Context for an operation.
 */
export interface TeamContext {
    /**
     * The team project Id or name.  Ignored if ProjectId is set.
     */
    project?: string;
    /**
     * The Team Project ID.  Required if Project is not set.
     */
    projectId?: string;
    /**
     * The Team Id or name.  Ignored if TeamId is set.
     */
    team?: string;
    /**
     * The Team Id
     */
    teamId?: string;
}
/**
 * Represents a Team Project object.
 */
export interface TeamProject extends TeamProjectReference {
    /**
     * The links to other objects related to this object.
     */
    _links?: any;
    /**
     * Set of capabilities this project has (such as process template & version control).
     */
    capabilities?: {
        [key: string]: {
            [key: string]: string;
        };
    };
    /**
     * The shallow ref to the default team.
     */
    defaultTeam?: WebApiTeamRef;
}
/**
 * Data contract for a TeamProjectCollection.
 */
export interface TeamProjectCollection extends TeamProjectCollectionReference {
    /**
     * The links to other objects related to this object.
     */
    _links?: any;
    /**
     * Project collection description.
     */
    description?: string;
    /**
     * Process customization type on this collection. It can be Xml or Inherited.
     */
    processCustomizationType?: ProcessCustomizationType;
    /**
     * Project collection state.
     */
    state?: string;
}
/**
 * Reference object for a TeamProjectCollection.
 */
export interface TeamProjectCollectionReference {
    /**
     * Collection avatar Url.
     */
    avatarUrl?: string;
    /**
     * Collection Id.
     */
    id?: string;
    /**
     * Collection Name.
     */
    name?: string;
    /**
     * Collection REST Url.
     */
    url?: string;
}
/**
 * Represents a shallow reference to a TeamProject.
 */
export interface TeamProjectReference {
    /**
     * Project abbreviation.
     */
    abbreviation?: string;
    /**
     * Url to default team identity image.
     */
    defaultTeamImageUrl?: string;
    /**
     * The project's description (if any).
     */
    description?: string;
    /**
     * Project identifier.
     */
    id?: string;
    /**
     * Project last update time.
     */
    lastUpdateTime?: Date;
    /**
     * Project name.
     */
    name?: string;
    /**
     * Project revision.
     */
    revision?: number;
    /**
     * Project state.
     */
    state?: any;
    /**
     * Url to the full version of the object.
     */
    url?: string;
    /**
     * Project visibility.
     */
    visibility?: ProjectVisibility;
}
/**
 * A data transfer object that stores the metadata associated with the creation of temporary data.
 */
export interface TemporaryDataCreatedDTO extends TemporaryDataDTO {
    /**
     * Temporary data expiration date.
     */
    expirationDate?: Date;
    /**
     * Temporary data id.
     */
    id?: string;
    /**
     * Rest url for the temporary data.
     */
    url?: string;
}
/**
 * A data transfer object that stores the metadata associated with the temporary data.
 */
export interface TemporaryDataDTO {
    /**
     * Temporary data expire in seconds
     */
    expirationSeconds?: number;
    /**
     * Temporary data origin
     */
    origin?: string;
    /**
     * Temporary data.
     */
    value?: any;
}
/**
 * Updateable properties for a WebApiTeam.
 */
export interface UpdateTeam {
    /**
     * New description for the team.
     */
    description?: string;
    /**
     * New name for the team.
     */
    name?: string;
}
export interface WebApiConnectedService extends WebApiConnectedServiceRef {
    /**
     * The user who did the OAuth authentication to created this service
     */
    authenticatedBy?: VSSInterfaces.IdentityRef;
    /**
     * Extra description on the service.
     */
    description?: string;
    /**
     * Friendly Name of service connection
     */
    friendlyName?: string;
    /**
     * Id/Name of the connection service. For Ex: Subscription Id for Azure Connection
     */
    id?: string;
    /**
     * The kind of service.
     */
    kind?: string;
    /**
     * The project associated with this service
     */
    project?: TeamProjectReference;
    /**
     * Optional uri to connect directly to the service such as https://windows.azure.com
     */
    serviceUri?: string;
}
export interface WebApiConnectedServiceDetails extends WebApiConnectedServiceRef {
    /**
     * Meta data for service connection
     */
    connectedServiceMetaData?: WebApiConnectedService;
    /**
     * Credential info
     */
    credentialsXml?: string;
    /**
     * Optional uri to connect directly to the service such as https://windows.azure.com
     */
    endPoint?: string;
}
export interface WebApiConnectedServiceRef {
    id?: string;
    url?: string;
}
/**
 * The representation of data needed to create a tag definition which is sent across the wire.
 */
export interface WebApiCreateTagRequestData {
    /**
     * Name of the tag definition that will be created.
     */
    name: string;
}
export interface WebApiProject extends TeamProjectReference {
    /**
     * Set of capabilities this project has
     */
    capabilities?: {
        [key: string]: {
            [key: string]: string;
        };
    };
    /**
     * Reference to collection which contains this project
     */
    collection?: WebApiProjectCollectionRef;
    /**
     * Default team for this project
     */
    defaultTeam?: WebApiTeamRef;
}
export interface WebApiProjectCollection extends WebApiProjectCollectionRef {
    /**
     * Project collection description
     */
    description?: string;
    /**
     * Project collection state
     */
    state?: string;
}
export interface WebApiProjectCollectionRef {
    /**
     * Collection Tfs Url (Host Url)
     */
    collectionUrl?: string;
    /**
     * Collection Guid
     */
    id?: string;
    /**
     * Collection Name
     */
    name?: string;
    /**
     * Collection REST Url
     */
    url?: string;
}
/**
 * The representation of a tag definition which is sent across the wire.
 */
export interface WebApiTagDefinition {
    /**
     * Whether or not the tag definition is active.
     */
    active?: boolean;
    /**
     * ID of the tag definition.
     */
    id?: string;
    /**
     * The name of the tag definition.
     */
    name?: string;
    /**
     * Resource URL for the Tag Definition.
     */
    url?: string;
}
export interface WebApiTeam extends WebApiTeamRef {
    /**
     * Team description
     */
    description?: string;
    /**
     * Team identity.
     */
    identity?: IdentitiesInterfaces.Identity;
    /**
     * Identity REST API Url to this team
     */
    identityUrl?: string;
    projectId?: string;
    projectName?: string;
}
export interface WebApiTeamRef {
    /**
     * Team (Identity) Guid. A Team Foundation ID.
     */
    id?: string;
    /**
     * Team name
     */
    name?: string;
    /**
     * Team REST API Url
     */
    url?: string;
}
export declare var TypeInfo: {
    ConnectedServiceKind: {
        enumValues: {
            "custom": number;
            "azureSubscription": number;
            "chef": number;
            "generic": number;
        };
    };
    Process: any;
    ProcessCustomizationType: {
        enumValues: {
            "unknown": number;
            "xml": number;
            "inherited": number;
        };
    };
    ProcessType: {
        enumValues: {
            "system": number;
            "custom": number;
            "inherited": number;
        };
    };
    ProjectChangeType: {
        enumValues: {
            "modified": number;
            "deleted": number;
            "added": number;
        };
    };
    ProjectInfo: any;
    ProjectMessage: any;
    ProjectVisibility: {
        enumValues: {
            "private": number;
            "organization": number;
            "public": number;
        };
    };
    SourceControlTypes: {
        enumValues: {
            "tfvc": number;
            "git": number;
        };
    };
    TeamProject: any;
    TeamProjectCollection: any;
    TeamProjectReference: any;
    TemporaryDataCreatedDTO: any;
    WebApiConnectedService: any;
    WebApiConnectedServiceDetails: any;
    WebApiProject: any;
};
