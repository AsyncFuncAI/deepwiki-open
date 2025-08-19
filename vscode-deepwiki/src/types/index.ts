export interface Document {
    id: string;
    title: string;
    content: string;
    path: string;
    type: string;
    metadata?: Record<string, any>;
}

export interface RetrievalResult {
    documents: Document[];
    query: string;
    totalResults: number;
}

export interface RAGAnswer {
    answer: string;
    rationale?: string;
    sources?: Document[];
    timestamp?: number;
}

export interface EmbedderConfig {
    client_class: string;
    initialize_kwargs: {
        api_key?: string;
        base_url?: string;
    };
    batch_size: number;
    model_kwargs: {
        model: string;
        dimensions?: number;
        encoding_format?: string;
    };
}

export interface AIConfig {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string;
    embedderConfig?: EmbedderConfig;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
}

export interface RAGStats {
    documentsLoaded: number;
    isInitialized: boolean;
    lastUpdated?: number;
}

export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
    sources?: Document[];
}

export interface ConversationSession {
    id: string;
    title: string;
    messages: ConversationMessage[];
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
}