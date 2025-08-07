// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import * as MessagesMessagesAPI from './messages';
import * as BetaAPI from '../beta';
import * as MessagesAPI from '../../messages/messages';
import * as BatchesAPI from './batches';
import {
  BatchCancelParams,
  BatchCreateParams,
  BatchDeleteParams,
  BatchListParams,
  BatchResultsParams,
  BatchRetrieveParams,
  Batches,
  BetaDeletedMessageBatch,
  BetaMessageBatch,
  BetaMessageBatchCanceledResult,
  BetaMessageBatchErroredResult,
  BetaMessageBatchExpiredResult,
  BetaMessageBatchIndividualResponse,
  BetaMessageBatchRequestCounts,
  BetaMessageBatchResult,
  BetaMessageBatchSucceededResult,
  BetaMessageBatchesPage,
} from './batches';
import { APIPromise } from '../../../core/api-promise';
import { Stream } from '../../../core/streaming';
import { buildHeaders } from '../../../internal/headers';
import { RequestOptions } from '../../../internal/request-options';
import type { Model } from '../../messages/messages';
import { BetaMessageStream } from '../../../lib/BetaMessageStream';

const DEPRECATED_MODELS: {
  [K in Model]?: string;
} = {
  'claude-1.3': 'November 6th, 2024',
  'claude-1.3-100k': 'November 6th, 2024',
  'claude-instant-1.1': 'November 6th, 2024',
  'claude-instant-1.1-100k': 'November 6th, 2024',
  'claude-instant-1.2': 'November 6th, 2024',
  'claude-3-sonnet-20240229': 'July 21st, 2025',
  'claude-3-opus-20240229': 'January 5th, 2026',
  'claude-2.1': 'July 21st, 2025',
  'claude-2.0': 'July 21st, 2025',
};
import { MODEL_NONSTREAMING_TOKENS } from '../../../internal/constants';

export class Messages extends APIResource {
  batches: BatchesAPI.Batches = new BatchesAPI.Batches(this._client);

  /**
   * Send a structured list of input messages with text and/or image content, and the
   * model will generate the next message in the conversation.
   *
   * The Messages API can be used for either single queries or stateless multi-turn
   * conversations.
   *
   * Learn more about the Messages API in our [user guide](/en/docs/initial-setup)
   *
   * @example
   * ```ts
   * const betaMessage = await client.beta.messages.create({
   *   max_tokens: 1024,
   *   messages: [{ content: 'Hello, world', role: 'user' }],
   *   model: 'claude-sonnet-4-20250514',
   * });
   * ```
   */
  create(params: MessageCreateParamsNonStreaming, options?: RequestOptions): APIPromise<BetaMessage>;
  create(
    params: MessageCreateParamsStreaming,
    options?: RequestOptions,
  ): APIPromise<Stream<BetaRawMessageStreamEvent>>;
  create(
    params: MessageCreateParamsBase,
    options?: RequestOptions,
  ): APIPromise<Stream<BetaRawMessageStreamEvent> | BetaMessage>;
  create(
    params: MessageCreateParams,
    options?: RequestOptions,
  ): APIPromise<BetaMessage> | APIPromise<Stream<BetaRawMessageStreamEvent>> {
    const { betas, ...body } = params;

    if (body.model in DEPRECATED_MODELS) {
      console.warn(
        `The model '${body.model}' is deprecated and will reach end-of-life on ${
          DEPRECATED_MODELS[body.model]
        }\nPlease migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`,
      );
    }

    let timeout = (this._client as any)._options.timeout as number | null;
    if (!body.stream && timeout == null) {
      const maxNonstreamingTokens = MODEL_NONSTREAMING_TOKENS[body.model] ?? undefined;
      timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
    }
    return this._client.post('/v1/messages?beta=true', {
      body,
      timeout: timeout ?? 600000,
      ...options,
      headers: buildHeaders([
        { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
        options?.headers,
      ]),
      stream: params.stream ?? false,
    }) as APIPromise<BetaMessage> | APIPromise<Stream<BetaRawMessageStreamEvent>>;
  }

  /**
   * Create a Message stream
   */
  stream(body: BetaMessageStreamParams, options?: RequestOptions): BetaMessageStream {
    return BetaMessageStream.createMessage(this, body, options);
  }

  /**
   * Count the number of tokens in a Message.
   *
   * The Token Count API can be used to count the number of tokens in a Message,
   * including tools, images, and documents, without creating it.
   *
   * Learn more about token counting in our
   * [user guide](/en/docs/build-with-claude/token-counting)
   *
   * @example
   * ```ts
   * const betaMessageTokensCount =
   *   await client.beta.messages.countTokens({
   *     messages: [{ content: 'string', role: 'user' }],
   *     model: 'claude-3-7-sonnet-latest',
   *   });
   * ```
   */
  countTokens(
    params: MessageCountTokensParams,
    options?: RequestOptions,
  ): APIPromise<BetaMessageTokensCount> {
    const { betas, ...body } = params;
    return this._client.post('/v1/messages/count_tokens?beta=true', {
      body,
      ...options,
      headers: buildHeaders([
        { 'anthropic-beta': [...(betas ?? []), 'token-counting-2024-11-01'].toString() },
        options?.headers,
      ]),
    });
  }
}

export type BetaMessageStreamParams = MessageCreateParamsBase;

export interface BetaBase64ImageSource {
  data: string;

  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  type: 'base64';
}

export interface BetaBase64PDFSource {
  data: string;

  media_type: 'application/pdf';

  type: 'base64';
}

export interface BetaCacheControlEphemeral {
  type: 'ephemeral';

  /**
   * The time-to-live for the cache control breakpoint.
   *
   * This may be one the following values:
   *
   * - `5m`: 5 minutes
   * - `1h`: 1 hour
   *
   * Defaults to `5m`.
   */
  ttl?: '5m' | '1h';
}

export interface BetaCacheCreation {
  /**
   * The number of input tokens used to create the 1 hour cache entry.
   */
  ephemeral_1h_input_tokens: number;

  /**
   * The number of input tokens used to create the 5 minute cache entry.
   */
  ephemeral_5m_input_tokens: number;
}

export interface BetaCitationCharLocation {
  cited_text: string;

  document_index: number;

  document_title: string | null;

  end_char_index: number;

  start_char_index: number;

  type: 'char_location';
}

export interface BetaCitationCharLocationParam {
  cited_text: string;

  document_index: number;

  document_title: string | null;

  end_char_index: number;

  start_char_index: number;

  type: 'char_location';
}

export interface BetaCitationContentBlockLocation {
  cited_text: string;

  document_index: number;

  document_title: string | null;

  end_block_index: number;

  start_block_index: number;

  type: 'content_block_location';
}

export interface BetaCitationContentBlockLocationParam {
  cited_text: string;

  document_index: number;

  document_title: string | null;

  end_block_index: number;

  start_block_index: number;

  type: 'content_block_location';
}

export interface BetaCitationPageLocation {
  cited_text: string;

  document_index: number;

  document_title: string | null;

  end_page_number: number;

  start_page_number: number;

  type: 'page_location';
}

export interface BetaCitationPageLocationParam {
  cited_text: string;

  document_index: number;

  document_title: string | null;

  end_page_number: number;

  start_page_number: number;

  type: 'page_location';
}

export interface BetaCitationSearchResultLocation {
  cited_text: string;

  end_block_index: number;

  search_result_index: number;

  source: string;

  start_block_index: number;

  title: string | null;

  type: 'search_result_location';
}

export interface BetaCitationSearchResultLocationParam {
  cited_text: string;

  end_block_index: number;

  search_result_index: number;

  source: string;

  start_block_index: number;

  title: string | null;

  type: 'search_result_location';
}

export interface BetaCitationWebSearchResultLocationParam {
  cited_text: string;

  encrypted_index: string;

  title: string | null;

  type: 'web_search_result_location';

  url: string;
}

export interface BetaCitationsConfigParam {
  enabled?: boolean;
}

export interface BetaCitationsDelta {
  citation:
    | BetaCitationCharLocation
    | BetaCitationPageLocation
    | BetaCitationContentBlockLocation
    | BetaCitationsWebSearchResultLocation
    | BetaCitationSearchResultLocation;

  type: 'citations_delta';
}

export interface BetaCitationsWebSearchResultLocation {
  cited_text: string;

  encrypted_index: string;

  title: string | null;

  type: 'web_search_result_location';

  url: string;
}

export interface BetaCodeExecutionOutputBlock {
  file_id: string;

  type: 'code_execution_output';
}

export interface BetaCodeExecutionOutputBlockParam {
  file_id: string;

  type: 'code_execution_output';
}

export interface BetaCodeExecutionResultBlock {
  content: Array<BetaCodeExecutionOutputBlock>;

  return_code: number;

  stderr: string;

  stdout: string;

  type: 'code_execution_result';
}

export interface BetaCodeExecutionResultBlockParam {
  content: Array<BetaCodeExecutionOutputBlockParam>;

  return_code: number;

  stderr: string;

  stdout: string;

  type: 'code_execution_result';
}

export interface BetaCodeExecutionTool20250522 {
  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'code_execution';

  type: 'code_execution_20250522';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export interface BetaCodeExecutionToolResultBlock {
  content: BetaCodeExecutionToolResultBlockContent;

  tool_use_id: string;

  type: 'code_execution_tool_result';
}

export type BetaCodeExecutionToolResultBlockContent =
  | BetaCodeExecutionToolResultError
  | BetaCodeExecutionResultBlock;

export interface BetaCodeExecutionToolResultBlockParam {
  content: BetaCodeExecutionToolResultBlockParamContent;

  tool_use_id: string;

  type: 'code_execution_tool_result';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export type BetaCodeExecutionToolResultBlockParamContent =
  | BetaCodeExecutionToolResultErrorParam
  | BetaCodeExecutionResultBlockParam;

export interface BetaCodeExecutionToolResultError {
  error_code: BetaCodeExecutionToolResultErrorCode;

  type: 'code_execution_tool_result_error';
}

export type BetaCodeExecutionToolResultErrorCode =
  | 'invalid_tool_input'
  | 'unavailable'
  | 'too_many_requests'
  | 'execution_time_exceeded';

export interface BetaCodeExecutionToolResultErrorParam {
  error_code: BetaCodeExecutionToolResultErrorCode;

  type: 'code_execution_tool_result_error';
}

/**
 * Information about the container used in the request (for the code execution
 * tool)
 */
export interface BetaContainer {
  /**
   * Identifier for the container used in this request
   */
  id: string;

  /**
   * The time at which the container will expire.
   */
  expires_at: string;
}

/**
 * Response model for a file uploaded to the container.
 */
export interface BetaContainerUploadBlock {
  file_id: string;

  type: 'container_upload';
}

/**
 * A content block that represents a file to be uploaded to the container Files
 * uploaded via this block will be available in the container's input directory.
 */
export interface BetaContainerUploadBlockParam {
  file_id: string;

  type: 'container_upload';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

/**
 * Response model for a file uploaded to the container.
 */
export type BetaContentBlock =
  | BetaTextBlock
  | BetaThinkingBlock
  | BetaRedactedThinkingBlock
  | BetaToolUseBlock
  | BetaServerToolUseBlock
  | BetaWebSearchToolResultBlock
  | BetaCodeExecutionToolResultBlock
  | BetaMCPToolUseBlock
  | BetaMCPToolResultBlock
  | BetaContainerUploadBlock;

/**
 * Regular text content.
 */
export type BetaContentBlockParam =
  | BetaTextBlockParam
  | BetaImageBlockParam
  | BetaRequestDocumentBlock
  | BetaSearchResultBlockParam
  | BetaThinkingBlockParam
  | BetaRedactedThinkingBlockParam
  | BetaToolUseBlockParam
  | BetaToolResultBlockParam
  | BetaServerToolUseBlockParam
  | BetaWebSearchToolResultBlockParam
  | BetaCodeExecutionToolResultBlockParam
  | BetaMCPToolUseBlockParam
  | BetaRequestMCPToolResultBlockParam
  | BetaContainerUploadBlockParam;

export interface BetaContentBlockSource {
  content: string | Array<BetaContentBlockSourceContent>;

  type: 'content';
}

export type BetaContentBlockSourceContent = BetaTextBlockParam | BetaImageBlockParam;

export interface BetaFileDocumentSource {
  file_id: string;

  type: 'file';
}

export interface BetaFileImageSource {
  file_id: string;

  type: 'file';
}

export interface BetaImageBlockParam {
  source: BetaBase64ImageSource | BetaURLImageSource | BetaFileImageSource;

  type: 'image';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export interface BetaInputJSONDelta {
  partial_json: string;

  type: 'input_json_delta';
}

export interface BetaMCPToolResultBlock {
  content: string | Array<BetaTextBlock>;

  is_error: boolean;

  tool_use_id: string;

  type: 'mcp_tool_result';
}

export interface BetaMCPToolUseBlock {
  id: string;

  input: unknown;

  /**
   * The name of the MCP tool
   */
  name: string;

  /**
   * The name of the MCP server
   */
  server_name: string;

  type: 'mcp_tool_use';
}

export interface BetaMCPToolUseBlockParam {
  id: string;

  input: unknown;

  name: string;

  /**
   * The name of the MCP server
   */
  server_name: string;

  type: 'mcp_tool_use';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export interface BetaMessage {
  /**
   * Unique object identifier.
   *
   * The format and length of IDs may change over time.
   */
  id: string;

  /**
   * Information about the container used in the request (for the code execution
   * tool)
   */
  container: BetaContainer | null;

  /**
   * Content generated by the model.
   *
   * This is an array of content blocks, each of which has a `type` that determines
   * its shape.
   *
   * Example:
   *
   * ```json
   * [{ "type": "text", "text": "Hi, I'm Claude." }]
   * ```
   *
   * If the request input `messages` ended with an `assistant` turn, then the
   * response `content` will continue directly from that last turn. You can use this
   * to constrain the model's output.
   *
   * For example, if the input `messages` were:
   *
   * ```json
   * [
   *   {
   *     "role": "user",
   *     "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
   *   },
   *   { "role": "assistant", "content": "The best answer is (" }
   * ]
   * ```
   *
   * Then the response `content` might be:
   *
   * ```json
   * [{ "type": "text", "text": "B)" }]
   * ```
   */
  content: Array<BetaContentBlock>;

  /**
   * The model that will complete your prompt.\n\nSee
   * [models](https://docs.anthropic.com/en/docs/models-overview) for additional
   * details and options.
   */
  model: MessagesAPI.Model;

  /**
   * Conversational role of the generated message.
   *
   * This will always be `"assistant"`.
   */
  role: 'assistant';

  /**
   * The reason that we stopped.
   *
   * This may be one the following values:
   *
   * - `"end_turn"`: the model reached a natural stopping point
   * - `"max_tokens"`: we exceeded the requested `max_tokens` or the model's maximum
   * - `"stop_sequence"`: one of your provided custom `stop_sequences` was generated
   * - `"tool_use"`: the model invoked one or more tools
   * - `"pause_turn"`: we paused a long-running turn. You may provide the response
   *   back as-is in a subsequent request to let the model continue.
   * - `"refusal"`: when streaming classifiers intervene to handle potential policy
   *   violations
   *
   * In non-streaming mode this value is always non-null. In streaming mode, it is
   * null in the `message_start` event and non-null otherwise.
   */
  stop_reason: BetaStopReason | null;

  /**
   * Which custom stop sequence was generated, if any.
   *
   * This value will be a non-null string if one of your custom stop sequences was
   * generated.
   */
  stop_sequence: string | null;

  /**
   * Object type.
   *
   * For Messages, this is always `"message"`.
   */
  type: 'message';

  /**
   * Billing and rate-limit usage.
   *
   * Anthropic's API bills and rate-limits by token counts, as tokens represent the
   * underlying cost to our systems.
   *
   * Under the hood, the API transforms requests into a format suitable for the
   * model. The model's output then goes through a parsing stage before becoming an
   * API response. As a result, the token counts in `usage` will not match one-to-one
   * with the exact visible content of an API request or response.
   *
   * For example, `output_tokens` will be non-zero, even for an empty string response
   * from Claude.
   *
   * Total input tokens in a request is the summation of `input_tokens`,
   * `cache_creation_input_tokens`, and `cache_read_input_tokens`.
   */
  usage: BetaUsage;
}

export interface BetaMessageDeltaUsage {
  /**
   * The cumulative number of input tokens used to create the cache entry.
   */
  cache_creation_input_tokens: number | null;

  /**
   * The cumulative number of input tokens read from the cache.
   */
  cache_read_input_tokens: number | null;

  /**
   * The cumulative number of input tokens which were used.
   */
  input_tokens: number | null;

  /**
   * The cumulative number of output tokens which were used.
   */
  output_tokens: number;

  /**
   * The number of server tool requests.
   */
  server_tool_use: BetaServerToolUsage | null;
}

export interface BetaMessageParam {
  content: string | Array<BetaContentBlockParam>;

  role: 'user' | 'assistant';
}

export interface BetaMessageTokensCount {
  /**
   * The total number of tokens across the provided list of messages, system prompt,
   * and tools.
   */
  input_tokens: number;
}

export interface BetaMetadata {
  /**
   * An external identifier for the user who is associated with the request.
   *
   * This should be a uuid, hash value, or other opaque identifier. Anthropic may use
   * this id to help detect abuse. Do not include any identifying information such as
   * name, email address, or phone number.
   */
  user_id?: string | null;
}

export interface BetaPlainTextSource {
  data: string;

  media_type: 'text/plain';

  type: 'text';
}

export type BetaRawContentBlockDelta =
  | BetaTextDelta
  | BetaInputJSONDelta
  | BetaCitationsDelta
  | BetaThinkingDelta
  | BetaSignatureDelta;

export interface BetaRawContentBlockDeltaEvent {
  delta: BetaRawContentBlockDelta;

  index: number;

  type: 'content_block_delta';
}

export interface BetaRawContentBlockStartEvent {
  /**
   * Response model for a file uploaded to the container.
   */
  content_block:
    | BetaTextBlock
    | BetaThinkingBlock
    | BetaRedactedThinkingBlock
    | BetaToolUseBlock
    | BetaServerToolUseBlock
    | BetaWebSearchToolResultBlock
    | BetaCodeExecutionToolResultBlock
    | BetaMCPToolUseBlock
    | BetaMCPToolResultBlock
    | BetaContainerUploadBlock;

  index: number;

  type: 'content_block_start';
}

export interface BetaRawContentBlockStopEvent {
  index: number;

  type: 'content_block_stop';
}

export interface BetaRawMessageDeltaEvent {
  delta: BetaRawMessageDeltaEvent.Delta;

  type: 'message_delta';

  /**
   * Billing and rate-limit usage.
   *
   * Anthropic's API bills and rate-limits by token counts, as tokens represent the
   * underlying cost to our systems.
   *
   * Under the hood, the API transforms requests into a format suitable for the
   * model. The model's output then goes through a parsing stage before becoming an
   * API response. As a result, the token counts in `usage` will not match one-to-one
   * with the exact visible content of an API request or response.
   *
   * For example, `output_tokens` will be non-zero, even for an empty string response
   * from Claude.
   *
   * Total input tokens in a request is the summation of `input_tokens`,
   * `cache_creation_input_tokens`, and `cache_read_input_tokens`.
   */
  usage: BetaMessageDeltaUsage;
}

export namespace BetaRawMessageDeltaEvent {
  export interface Delta {
    /**
     * Information about the container used in the request (for the code execution
     * tool)
     */
    container: MessagesMessagesAPI.BetaContainer | null;

    stop_reason: MessagesMessagesAPI.BetaStopReason | null;

    stop_sequence: string | null;
  }
}

export interface BetaRawMessageStartEvent {
  message: BetaMessage;

  type: 'message_start';
}

export interface BetaRawMessageStopEvent {
  type: 'message_stop';
}

export type BetaRawMessageStreamEvent =
  | BetaRawMessageStartEvent
  | BetaRawMessageDeltaEvent
  | BetaRawMessageStopEvent
  | BetaRawContentBlockStartEvent
  | BetaRawContentBlockDeltaEvent
  | BetaRawContentBlockStopEvent;

export interface BetaRedactedThinkingBlock {
  data: string;

  type: 'redacted_thinking';
}

export interface BetaRedactedThinkingBlockParam {
  data: string;

  type: 'redacted_thinking';
}

export interface BetaRequestDocumentBlock {
  source:
    | BetaBase64PDFSource
    | BetaPlainTextSource
    | BetaContentBlockSource
    | BetaURLPDFSource
    | BetaFileDocumentSource;

  type: 'document';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  citations?: BetaCitationsConfigParam;

  context?: string | null;

  title?: string | null;
}

export interface BetaRequestMCPServerToolConfiguration {
  allowed_tools?: Array<string> | null;

  enabled?: boolean | null;
}

export interface BetaRequestMCPServerURLDefinition {
  name: string;

  type: 'url';

  url: string;

  authorization_token?: string | null;

  tool_configuration?: BetaRequestMCPServerToolConfiguration | null;
}

export interface BetaRequestMCPToolResultBlockParam {
  tool_use_id: string;

  type: 'mcp_tool_result';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  content?: string | Array<BetaTextBlockParam>;

  is_error?: boolean;
}

export interface BetaSearchResultBlockParam {
  content: Array<BetaTextBlockParam>;

  source: string;

  title: string;

  type: 'search_result';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  citations?: BetaCitationsConfigParam;
}

export interface BetaServerToolUsage {
  /**
   * The number of web search tool requests.
   */
  web_search_requests: number;
}

export interface BetaServerToolUseBlock {
  id: string;

  input: unknown;

  name: 'web_search' | 'code_execution';

  type: 'server_tool_use';
}

export interface BetaServerToolUseBlockParam {
  id: string;

  input: unknown;

  name: 'web_search' | 'code_execution';

  type: 'server_tool_use';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export interface BetaSignatureDelta {
  signature: string;

  type: 'signature_delta';
}

export type BetaStopReason =
  | 'end_turn'
  | 'max_tokens'
  | 'stop_sequence'
  | 'tool_use'
  | 'pause_turn'
  | 'refusal';

export interface BetaTextBlock {
  /**
   * Citations supporting the text block.
   *
   * The type of citation returned will depend on the type of document being cited.
   * Citing a PDF results in `page_location`, plain text results in `char_location`,
   * and content document results in `content_block_location`.
   */
  citations: Array<BetaTextCitation> | null;

  text: string;

  type: 'text';
}

export interface BetaTextBlockParam {
  text: string;

  type: 'text';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  citations?: Array<BetaTextCitationParam> | null;
}

export type BetaTextCitation =
  | BetaCitationCharLocation
  | BetaCitationPageLocation
  | BetaCitationContentBlockLocation
  | BetaCitationsWebSearchResultLocation
  | BetaCitationSearchResultLocation;

export type BetaTextCitationParam =
  | BetaCitationCharLocationParam
  | BetaCitationPageLocationParam
  | BetaCitationContentBlockLocationParam
  | BetaCitationWebSearchResultLocationParam
  | BetaCitationSearchResultLocationParam;

export interface BetaTextDelta {
  text: string;

  type: 'text_delta';
}

export interface BetaThinkingBlock {
  signature: string;

  thinking: string;

  type: 'thinking';
}

export interface BetaThinkingBlockParam {
  signature: string;

  thinking: string;

  type: 'thinking';
}

export interface BetaThinkingConfigDisabled {
  type: 'disabled';
}

export interface BetaThinkingConfigEnabled {
  /**
   * Determines how many tokens Claude can use for its internal reasoning process.
   * Larger budgets can enable more thorough analysis for complex problems, improving
   * response quality.
   *
   * Must be ≥1024 and less than `max_tokens`.
   *
   * See
   * [extended thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
   * for details.
   */
  budget_tokens: number;

  type: 'enabled';
}

/**
 * Configuration for enabling Claude's extended thinking.
 *
 * When enabled, responses include `thinking` content blocks showing Claude's
 * thinking process before the final answer. Requires a minimum budget of 1,024
 * tokens and counts towards your `max_tokens` limit.
 *
 * See
 * [extended thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
 * for details.
 */
export type BetaThinkingConfigParam = BetaThinkingConfigEnabled | BetaThinkingConfigDisabled;

export interface BetaThinkingDelta {
  thinking: string;

  type: 'thinking_delta';
}

export interface BetaTool {
  /**
   * [JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.
   *
   * This defines the shape of the `input` that your tool accepts and that the model
   * will produce.
   */
  input_schema: BetaTool.InputSchema;

  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: string;

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  /**
   * Description of what this tool does.
   *
   * Tool descriptions should be as detailed as possible. The more information that
   * the model has about what the tool is and how to use it, the better it will
   * perform. You can use natural language descriptions to reinforce important
   * aspects of the tool input JSON schema.
   */
  description?: string;

  type?: 'custom' | null;
}

export namespace BetaTool {
  /**
   * [JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.
   *
   * This defines the shape of the `input` that your tool accepts and that the model
   * will produce.
   */
  export interface InputSchema {
    type: 'object';

    properties?: unknown | null;

    required?: Array<string> | null;

    [k: string]: unknown;
  }
}

export interface BetaToolBash20241022 {
  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'bash';

  type: 'bash_20241022';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export interface BetaToolBash20250124 {
  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'bash';

  type: 'bash_20250124';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

/**
 * How the model should use the provided tools. The model can use a specific tool,
 * any available tool, decide by itself, or not use tools at all.
 */
export type BetaToolChoice = BetaToolChoiceAuto | BetaToolChoiceAny | BetaToolChoiceTool | BetaToolChoiceNone;

/**
 * The model will use any available tools.
 */
export interface BetaToolChoiceAny {
  type: 'any';

  /**
   * Whether to disable parallel tool use.
   *
   * Defaults to `false`. If set to `true`, the model will output exactly one tool
   * use.
   */
  disable_parallel_tool_use?: boolean;
}

/**
 * The model will automatically decide whether to use tools.
 */
export interface BetaToolChoiceAuto {
  type: 'auto';

  /**
   * Whether to disable parallel tool use.
   *
   * Defaults to `false`. If set to `true`, the model will output at most one tool
   * use.
   */
  disable_parallel_tool_use?: boolean;
}

/**
 * The model will not be allowed to use tools.
 */
export interface BetaToolChoiceNone {
  type: 'none';
}

/**
 * The model will use the specified tool with `tool_choice.name`.
 */
export interface BetaToolChoiceTool {
  /**
   * The name of the tool to use.
   */
  name: string;

  type: 'tool';

  /**
   * Whether to disable parallel tool use.
   *
   * Defaults to `false`. If set to `true`, the model will output exactly one tool
   * use.
   */
  disable_parallel_tool_use?: boolean;
}

export interface BetaToolComputerUse20241022 {
  /**
   * The height of the display in pixels.
   */
  display_height_px: number;

  /**
   * The width of the display in pixels.
   */
  display_width_px: number;

  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'computer';

  type: 'computer_20241022';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  /**
   * The X11 display number (e.g. 0, 1) for the display.
   */
  display_number?: number | null;
}

export interface BetaToolComputerUse20250124 {
  /**
   * The height of the display in pixels.
   */
  display_height_px: number;

  /**
   * The width of the display in pixels.
   */
  display_width_px: number;

  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'computer';

  type: 'computer_20250124';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  /**
   * The X11 display number (e.g. 0, 1) for the display.
   */
  display_number?: number | null;
}

export interface BetaToolResultBlockParam {
  tool_use_id: string;

  type: 'tool_result';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  content?: string | Array<BetaTextBlockParam | BetaImageBlockParam | BetaSearchResultBlockParam>;

  is_error?: boolean;
}

export interface BetaToolTextEditor20241022 {
  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'str_replace_editor';

  type: 'text_editor_20241022';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export interface BetaToolTextEditor20250124 {
  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'str_replace_editor';

  type: 'text_editor_20250124';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export interface BetaToolTextEditor20250429 {
  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'str_replace_based_edit_tool';

  type: 'text_editor_20250429';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export type BetaToolUnion =
  | BetaTool
  | BetaToolBash20241022
  | BetaToolBash20250124
  | BetaCodeExecutionTool20250522
  | BetaToolComputerUse20241022
  | BetaToolComputerUse20250124
  | BetaToolTextEditor20241022
  | BetaToolTextEditor20250124
  | BetaToolTextEditor20250429
  | BetaWebSearchTool20250305;

export interface BetaToolUseBlock {
  id: string;

  input: unknown;

  name: string;

  type: 'tool_use';
}

export interface BetaToolUseBlockParam {
  id: string;

  input: unknown;

  name: string;

  type: 'tool_use';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export interface BetaURLImageSource {
  type: 'url';

  url: string;
}

export interface BetaURLPDFSource {
  type: 'url';

  url: string;
}

export interface BetaUsage {
  /**
   * Breakdown of cached tokens by TTL
   */
  cache_creation: BetaCacheCreation | null;

  /**
   * The number of input tokens used to create the cache entry.
   */
  cache_creation_input_tokens: number | null;

  /**
   * The number of input tokens read from the cache.
   */
  cache_read_input_tokens: number | null;

  /**
   * The number of input tokens which were used.
   */
  input_tokens: number;

  /**
   * The number of output tokens which were used.
   */
  output_tokens: number;

  /**
   * The number of server tool requests.
   */
  server_tool_use: BetaServerToolUsage | null;

  /**
   * If the request used the priority, standard, or batch tier.
   */
  service_tier: 'standard' | 'priority' | 'batch' | null;
}

export interface BetaWebSearchResultBlock {
  encrypted_content: string;

  page_age: string | null;

  title: string;

  type: 'web_search_result';

  url: string;
}

export interface BetaWebSearchResultBlockParam {
  encrypted_content: string;

  title: string;

  type: 'web_search_result';

  url: string;

  page_age?: string | null;
}

export interface BetaWebSearchTool20250305 {
  /**
   * Name of the tool.
   *
   * This is how the tool will be called by the model and in `tool_use` blocks.
   */
  name: 'web_search';

  type: 'web_search_20250305';

  /**
   * If provided, only these domains will be included in results. Cannot be used
   * alongside `blocked_domains`.
   */
  allowed_domains?: Array<string> | null;

  /**
   * If provided, these domains will never appear in results. Cannot be used
   * alongside `allowed_domains`.
   */
  blocked_domains?: Array<string> | null;

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;

  /**
   * Maximum number of times the tool can be used in the API request.
   */
  max_uses?: number | null;

  /**
   * Parameters for the user's location. Used to provide more relevant search
   * results.
   */
  user_location?: BetaWebSearchTool20250305.UserLocation | null;
}

export namespace BetaWebSearchTool20250305 {
  /**
   * Parameters for the user's location. Used to provide more relevant search
   * results.
   */
  export interface UserLocation {
    type: 'approximate';

    /**
     * The city of the user.
     */
    city?: string | null;

    /**
     * The two letter
     * [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the
     * user.
     */
    country?: string | null;

    /**
     * The region of the user.
     */
    region?: string | null;

    /**
     * The [IANA timezone](https://nodatime.org/TimeZones) of the user.
     */
    timezone?: string | null;
  }
}

export interface BetaWebSearchToolRequestError {
  error_code: BetaWebSearchToolResultErrorCode;

  type: 'web_search_tool_result_error';
}

export interface BetaWebSearchToolResultBlock {
  content: BetaWebSearchToolResultBlockContent;

  tool_use_id: string;

  type: 'web_search_tool_result';
}

export type BetaWebSearchToolResultBlockContent =
  | BetaWebSearchToolResultError
  | Array<BetaWebSearchResultBlock>;

export interface BetaWebSearchToolResultBlockParam {
  content: BetaWebSearchToolResultBlockParamContent;

  tool_use_id: string;

  type: 'web_search_tool_result';

  /**
   * Create a cache control breakpoint at this content block.
   */
  cache_control?: BetaCacheControlEphemeral | null;
}

export type BetaWebSearchToolResultBlockParamContent =
  | Array<BetaWebSearchResultBlockParam>
  | BetaWebSearchToolRequestError;

export interface BetaWebSearchToolResultError {
  error_code: BetaWebSearchToolResultErrorCode;

  type: 'web_search_tool_result_error';
}

export type BetaWebSearchToolResultErrorCode =
  | 'invalid_tool_input'
  | 'unavailable'
  | 'max_uses_exceeded'
  | 'too_many_requests'
  | 'query_too_long';

/**
 * @deprecated BetaRequestDocumentBlock should be used insated
 */
export type BetaBase64PDFBlock = BetaRequestDocumentBlock;

export type MessageCreateParams = MessageCreateParamsNonStreaming | MessageCreateParamsStreaming;

export interface MessageCreateParamsBase {
  /**
   * Body param: The maximum number of tokens to generate before stopping.
   *
   * Note that our models may stop _before_ reaching this maximum. This parameter
   * only specifies the absolute maximum number of tokens to generate.
   *
   * Different models have different maximum values for this parameter. See
   * [models](https://docs.anthropic.com/en/docs/models-overview) for details.
   */
  max_tokens: number;

  /**
   * Body param: Input messages.
   *
   * Our models are trained to operate on alternating `user` and `assistant`
   * conversational turns. When creating a new `Message`, you specify the prior
   * conversational turns with the `messages` parameter, and the model then generates
   * the next `Message` in the conversation. Consecutive `user` or `assistant` turns
   * in your request will be combined into a single turn.
   *
   * Each input message must be an object with a `role` and `content`. You can
   * specify a single `user`-role message, or you can include multiple `user` and
   * `assistant` messages.
   *
   * If the final message uses the `assistant` role, the response content will
   * continue immediately from the content in that message. This can be used to
   * constrain part of the model's response.
   *
   * Example with a single `user` message:
   *
   * ```json
   * [{ "role": "user", "content": "Hello, Claude" }]
   * ```
   *
   * Example with multiple conversational turns:
   *
   * ```json
   * [
   *   { "role": "user", "content": "Hello there." },
   *   { "role": "assistant", "content": "Hi, I'm Claude. How can I help you?" },
   *   { "role": "user", "content": "Can you explain LLMs in plain English?" }
   * ]
   * ```
   *
   * Example with a partially-filled response from Claude:
   *
   * ```json
   * [
   *   {
   *     "role": "user",
   *     "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
   *   },
   *   { "role": "assistant", "content": "The best answer is (" }
   * ]
   * ```
   *
   * Each input message `content` may be either a single `string` or an array of
   * content blocks, where each block has a specific `type`. Using a `string` for
   * `content` is shorthand for an array of one content block of type `"text"`. The
   * following input messages are equivalent:
   *
   * ```json
   * { "role": "user", "content": "Hello, Claude" }
   * ```
   *
   * ```json
   * { "role": "user", "content": [{ "type": "text", "text": "Hello, Claude" }] }
   * ```
   *
   * Starting with Claude 3 models, you can also send image content blocks:
   *
   * ```json
   * {
   *   "role": "user",
   *   "content": [
   *     {
   *       "type": "image",
   *       "source": {
   *         "type": "base64",
   *         "media_type": "image/jpeg",
   *         "data": "/9j/4AAQSkZJRg..."
   *       }
   *     },
   *     { "type": "text", "text": "What is in this image?" }
   *   ]
   * }
   * ```
   *
   * We currently support the `base64` source type for images, and the `image/jpeg`,
   * `image/png`, `image/gif`, and `image/webp` media types.
   *
   * See [examples](https://docs.anthropic.com/en/api/messages-examples#vision) for
   * more input examples.
   *
   * Note that if you want to include a
   * [system prompt](https://docs.anthropic.com/en/docs/system-prompts), you can use
   * the top-level `system` parameter — there is no `"system"` role for input
   * messages in the Messages API.
   *
   * There is a limit of 100,000 messages in a single request.
   */
  messages: Array<BetaMessageParam>;

  /**
   * Body param: The model that will complete your prompt.\n\nSee
   * [models](https://docs.anthropic.com/en/docs/models-overview) for additional
   * details and options.
   */
  model: MessagesAPI.Model;

  /**
   * Body param: Container identifier for reuse across requests.
   */
  container?: string | null;

  /**
   * Body param: MCP servers to be utilized in this request
   */
  mcp_servers?: Array<BetaRequestMCPServerURLDefinition>;

  /**
   * Body param: An object describing metadata about the request.
   */
  metadata?: BetaMetadata;

  /**
   * Body param: Determines whether to use priority capacity (if available) or
   * standard capacity for this request.
   *
   * Anthropic offers different levels of service for your API requests. See
   * [service-tiers](https://docs.anthropic.com/en/api/service-tiers) for details.
   */
  service_tier?: 'auto' | 'standard_only';

  /**
   * Body param: Custom text sequences that will cause the model to stop generating.
   *
   * Our models will normally stop when they have naturally completed their turn,
   * which will result in a response `stop_reason` of `"end_turn"`.
   *
   * If you want the model to stop generating when it encounters custom strings of
   * text, you can use the `stop_sequences` parameter. If the model encounters one of
   * the custom sequences, the response `stop_reason` value will be `"stop_sequence"`
   * and the response `stop_sequence` value will contain the matched stop sequence.
   */
  stop_sequences?: Array<string>;

  /**
   * Body param: Whether to incrementally stream the response using server-sent
   * events.
   *
   * See [streaming](https://docs.anthropic.com/en/api/messages-streaming) for
   * details.
   */
  stream?: boolean;

  /**
   * Body param: System prompt.
   *
   * A system prompt is a way of providing context and instructions to Claude, such
   * as specifying a particular goal or role. See our
   * [guide to system prompts](https://docs.anthropic.com/en/docs/system-prompts).
   */
  system?: string | Array<BetaTextBlockParam>;

  /**
   * Body param: Amount of randomness injected into the response.
   *
   * Defaults to `1.0`. Ranges from `0.0` to `1.0`. Use `temperature` closer to `0.0`
   * for analytical / multiple choice, and closer to `1.0` for creative and
   * generative tasks.
   *
   * Note that even with `temperature` of `0.0`, the results will not be fully
   * deterministic.
   */
  temperature?: number;

  /**
   * Body param: Configuration for enabling Claude's extended thinking.
   *
   * When enabled, responses include `thinking` content blocks showing Claude's
   * thinking process before the final answer. Requires a minimum budget of 1,024
   * tokens and counts towards your `max_tokens` limit.
   *
   * See
   * [extended thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
   * for details.
   */
  thinking?: BetaThinkingConfigParam;

  /**
   * Body param: How the model should use the provided tools. The model can use a
   * specific tool, any available tool, decide by itself, or not use tools at all.
   */
  tool_choice?: BetaToolChoice;

  /**
   * Body param: Definitions of tools that the model may use.
   *
   * If you include `tools` in your API request, the model may return `tool_use`
   * content blocks that represent the model's use of those tools. You can then run
   * those tools using the tool input generated by the model and then optionally
   * return results back to the model using `tool_result` content blocks.
   *
   * There are two types of tools: **client tools** and **server tools**. The
   * behavior described below applies to client tools. For
   * [server tools](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview#server-tools),
   * see their individual documentation as each has its own behavior (e.g., the
   * [web search tool](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool)).
   *
   * Each tool definition includes:
   *
   * - `name`: Name of the tool.
   * - `description`: Optional, but strongly-recommended description of the tool.
   * - `input_schema`: [JSON schema](https://json-schema.org/draft/2020-12) for the
   *   tool `input` shape that the model will produce in `tool_use` output content
   *   blocks.
   *
   * For example, if you defined `tools` as:
   *
   * ```json
   * [
   *   {
   *     "name": "get_stock_price",
   *     "description": "Get the current stock price for a given ticker symbol.",
   *     "input_schema": {
   *       "type": "object",
   *       "properties": {
   *         "ticker": {
   *           "type": "string",
   *           "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
   *         }
   *       },
   *       "required": ["ticker"]
   *     }
   *   }
   * ]
   * ```
   *
   * And then asked the model "What's the S&P 500 at today?", the model might produce
   * `tool_use` content blocks in the response like this:
   *
   * ```json
   * [
   *   {
   *     "type": "tool_use",
   *     "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
   *     "name": "get_stock_price",
   *     "input": { "ticker": "^GSPC" }
   *   }
   * ]
   * ```
   *
   * You might then run your `get_stock_price` tool with `{"ticker": "^GSPC"}` as an
   * input, and return the following back to the model in a subsequent `user`
   * message:
   *
   * ```json
   * [
   *   {
   *     "type": "tool_result",
   *     "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
   *     "content": "259.75 USD"
   *   }
   * ]
   * ```
   *
   * Tools can be used for workflows that include running client-side tools and
   * functions, or more generally whenever you want the model to produce a particular
   * JSON structure of output.
   *
   * See our [guide](https://docs.anthropic.com/en/docs/tool-use) for more details.
   */
  tools?: Array<BetaToolUnion>;

  /**
   * Body param: Only sample from the top K options for each subsequent token.
   *
   * Used to remove "long tail" low probability responses.
   * [Learn more technical details here](https://towardsdatascience.com/how-to-sample-from-language-models-682bceb97277).
   *
   * Recommended for advanced use cases only. You usually only need to use
   * `temperature`.
   */
  top_k?: number;

  /**
   * Body param: Use nucleus sampling.
   *
   * In nucleus sampling, we compute the cumulative distribution over all the options
   * for each subsequent token in decreasing probability order and cut it off once it
   * reaches a particular probability specified by `top_p`. You should either alter
   * `temperature` or `top_p`, but not both.
   *
   * Recommended for advanced use cases only. You usually only need to use
   * `temperature`.
   */
  top_p?: number;

  /**
   * Header param: Optional header to specify the beta version(s) you want to use.
   */
  betas?: Array<BetaAPI.AnthropicBeta>;
}

export namespace MessageCreateParams {
  export type MessageCreateParamsNonStreaming = MessagesMessagesAPI.MessageCreateParamsNonStreaming;
  export type MessageCreateParamsStreaming = MessagesMessagesAPI.MessageCreateParamsStreaming;
}

export interface MessageCreateParamsNonStreaming extends MessageCreateParamsBase {
  /**
   * Body param: Whether to incrementally stream the response using server-sent
   * events.
   *
   * See [streaming](https://docs.anthropic.com/en/api/messages-streaming) for
   * details.
   */
  stream?: false;
}

export interface MessageCreateParamsStreaming extends MessageCreateParamsBase {
  /**
   * Body param: Whether to incrementally stream the response using server-sent
   * events.
   *
   * See [streaming](https://docs.anthropic.com/en/api/messages-streaming) for
   * details.
   */
  stream: true;
}

export interface MessageCountTokensParams {
  /**
   * Body param: Input messages.
   *
   * Our models are trained to operate on alternating `user` and `assistant`
   * conversational turns. When creating a new `Message`, you specify the prior
   * conversational turns with the `messages` parameter, and the model then generates
   * the next `Message` in the conversation. Consecutive `user` or `assistant` turns
   * in your request will be combined into a single turn.
   *
   * Each input message must be an object with a `role` and `content`. You can
   * specify a single `user`-role message, or you can include multiple `user` and
   * `assistant` messages.
   *
   * If the final message uses the `assistant` role, the response content will
   * continue immediately from the content in that message. This can be used to
   * constrain part of the model's response.
   *
   * Example with a single `user` message:
   *
   * ```json
   * [{ "role": "user", "content": "Hello, Claude" }]
   * ```
   *
   * Example with multiple conversational turns:
   *
   * ```json
   * [
   *   { "role": "user", "content": "Hello there." },
   *   { "role": "assistant", "content": "Hi, I'm Claude. How can I help you?" },
   *   { "role": "user", "content": "Can you explain LLMs in plain English?" }
   * ]
   * ```
   *
   * Example with a partially-filled response from Claude:
   *
   * ```json
   * [
   *   {
   *     "role": "user",
   *     "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
   *   },
   *   { "role": "assistant", "content": "The best answer is (" }
   * ]
   * ```
   *
   * Each input message `content` may be either a single `string` or an array of
   * content blocks, where each block has a specific `type`. Using a `string` for
   * `content` is shorthand for an array of one content block of type `"text"`. The
   * following input messages are equivalent:
   *
   * ```json
   * { "role": "user", "content": "Hello, Claude" }
   * ```
   *
   * ```json
   * { "role": "user", "content": [{ "type": "text", "text": "Hello, Claude" }] }
   * ```
   *
   * Starting with Claude 3 models, you can also send image content blocks:
   *
   * ```json
   * {
   *   "role": "user",
   *   "content": [
   *     {
   *       "type": "image",
   *       "source": {
   *         "type": "base64",
   *         "media_type": "image/jpeg",
   *         "data": "/9j/4AAQSkZJRg..."
   *       }
   *     },
   *     { "type": "text", "text": "What is in this image?" }
   *   ]
   * }
   * ```
   *
   * We currently support the `base64` source type for images, and the `image/jpeg`,
   * `image/png`, `image/gif`, and `image/webp` media types.
   *
   * See [examples](https://docs.anthropic.com/en/api/messages-examples#vision) for
   * more input examples.
   *
   * Note that if you want to include a
   * [system prompt](https://docs.anthropic.com/en/docs/system-prompts), you can use
   * the top-level `system` parameter — there is no `"system"` role for input
   * messages in the Messages API.
   *
   * There is a limit of 100,000 messages in a single request.
   */
  messages: Array<BetaMessageParam>;

  /**
   * Body param: The model that will complete your prompt.\n\nSee
   * [models](https://docs.anthropic.com/en/docs/models-overview) for additional
   * details and options.
   */
  model: MessagesAPI.Model;

  /**
   * Body param: MCP servers to be utilized in this request
   */
  mcp_servers?: Array<BetaRequestMCPServerURLDefinition>;

  /**
   * Body param: System prompt.
   *
   * A system prompt is a way of providing context and instructions to Claude, such
   * as specifying a particular goal or role. See our
   * [guide to system prompts](https://docs.anthropic.com/en/docs/system-prompts).
   */
  system?: string | Array<BetaTextBlockParam>;

  /**
   * Body param: Configuration for enabling Claude's extended thinking.
   *
   * When enabled, responses include `thinking` content blocks showing Claude's
   * thinking process before the final answer. Requires a minimum budget of 1,024
   * tokens and counts towards your `max_tokens` limit.
   *
   * See
   * [extended thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
   * for details.
   */
  thinking?: BetaThinkingConfigParam;

  /**
   * Body param: How the model should use the provided tools. The model can use a
   * specific tool, any available tool, decide by itself, or not use tools at all.
   */
  tool_choice?: BetaToolChoice;

  /**
   * Body param: Definitions of tools that the model may use.
   *
   * If you include `tools` in your API request, the model may return `tool_use`
   * content blocks that represent the model's use of those tools. You can then run
   * those tools using the tool input generated by the model and then optionally
   * return results back to the model using `tool_result` content blocks.
   *
   * There are two types of tools: **client tools** and **server tools**. The
   * behavior described below applies to client tools. For
   * [server tools](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview#server-tools),
   * see their individual documentation as each has its own behavior (e.g., the
   * [web search tool](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool)).
   *
   * Each tool definition includes:
   *
   * - `name`: Name of the tool.
   * - `description`: Optional, but strongly-recommended description of the tool.
   * - `input_schema`: [JSON schema](https://json-schema.org/draft/2020-12) for the
   *   tool `input` shape that the model will produce in `tool_use` output content
   *   blocks.
   *
   * For example, if you defined `tools` as:
   *
   * ```json
   * [
   *   {
   *     "name": "get_stock_price",
   *     "description": "Get the current stock price for a given ticker symbol.",
   *     "input_schema": {
   *       "type": "object",
   *       "properties": {
   *         "ticker": {
   *           "type": "string",
   *           "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
   *         }
   *       },
   *       "required": ["ticker"]
   *     }
   *   }
   * ]
   * ```
   *
   * And then asked the model "What's the S&P 500 at today?", the model might produce
   * `tool_use` content blocks in the response like this:
   *
   * ```json
   * [
   *   {
   *     "type": "tool_use",
   *     "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
   *     "name": "get_stock_price",
   *     "input": { "ticker": "^GSPC" }
   *   }
   * ]
   * ```
   *
   * You might then run your `get_stock_price` tool with `{"ticker": "^GSPC"}` as an
   * input, and return the following back to the model in a subsequent `user`
   * message:
   *
   * ```json
   * [
   *   {
   *     "type": "tool_result",
   *     "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
   *     "content": "259.75 USD"
   *   }
   * ]
   * ```
   *
   * Tools can be used for workflows that include running client-side tools and
   * functions, or more generally whenever you want the model to produce a particular
   * JSON structure of output.
   *
   * See our [guide](https://docs.anthropic.com/en/docs/tool-use) for more details.
   */
  tools?: Array<
    | BetaTool
    | BetaToolBash20241022
    | BetaToolBash20250124
    | BetaCodeExecutionTool20250522
    | BetaToolComputerUse20241022
    | BetaToolComputerUse20250124
    | BetaToolTextEditor20241022
    | BetaToolTextEditor20250124
    | BetaToolTextEditor20250429
    | BetaWebSearchTool20250305
  >;

  /**
   * Header param: Optional header to specify the beta version(s) you want to use.
   */
  betas?: Array<BetaAPI.AnthropicBeta>;
}

Messages.Batches = Batches;

export declare namespace Messages {
  export {
    type BetaBase64ImageSource as BetaBase64ImageSource,
    type BetaBase64PDFSource as BetaBase64PDFSource,
    type BetaCacheControlEphemeral as BetaCacheControlEphemeral,
    type BetaCacheCreation as BetaCacheCreation,
    type BetaCitationCharLocation as BetaCitationCharLocation,
    type BetaCitationCharLocationParam as BetaCitationCharLocationParam,
    type BetaCitationContentBlockLocation as BetaCitationContentBlockLocation,
    type BetaCitationContentBlockLocationParam as BetaCitationContentBlockLocationParam,
    type BetaCitationPageLocation as BetaCitationPageLocation,
    type BetaCitationPageLocationParam as BetaCitationPageLocationParam,
    type BetaCitationSearchResultLocation as BetaCitationSearchResultLocation,
    type BetaCitationSearchResultLocationParam as BetaCitationSearchResultLocationParam,
    type BetaCitationWebSearchResultLocationParam as BetaCitationWebSearchResultLocationParam,
    type BetaCitationsConfigParam as BetaCitationsConfigParam,
    type BetaCitationsDelta as BetaCitationsDelta,
    type BetaCitationsWebSearchResultLocation as BetaCitationsWebSearchResultLocation,
    type BetaCodeExecutionOutputBlock as BetaCodeExecutionOutputBlock,
    type BetaCodeExecutionOutputBlockParam as BetaCodeExecutionOutputBlockParam,
    type BetaCodeExecutionResultBlock as BetaCodeExecutionResultBlock,
    type BetaCodeExecutionResultBlockParam as BetaCodeExecutionResultBlockParam,
    type BetaCodeExecutionTool20250522 as BetaCodeExecutionTool20250522,
    type BetaCodeExecutionToolResultBlock as BetaCodeExecutionToolResultBlock,
    type BetaCodeExecutionToolResultBlockContent as BetaCodeExecutionToolResultBlockContent,
    type BetaCodeExecutionToolResultBlockParam as BetaCodeExecutionToolResultBlockParam,
    type BetaCodeExecutionToolResultBlockParamContent as BetaCodeExecutionToolResultBlockParamContent,
    type BetaCodeExecutionToolResultError as BetaCodeExecutionToolResultError,
    type BetaCodeExecutionToolResultErrorCode as BetaCodeExecutionToolResultErrorCode,
    type BetaCodeExecutionToolResultErrorParam as BetaCodeExecutionToolResultErrorParam,
    type BetaContainer as BetaContainer,
    type BetaContainerUploadBlock as BetaContainerUploadBlock,
    type BetaContainerUploadBlockParam as BetaContainerUploadBlockParam,
    type BetaContentBlock as BetaContentBlock,
    type BetaContentBlockParam as BetaContentBlockParam,
    type BetaContentBlockSource as BetaContentBlockSource,
    type BetaContentBlockSourceContent as BetaContentBlockSourceContent,
    type BetaFileDocumentSource as BetaFileDocumentSource,
    type BetaFileImageSource as BetaFileImageSource,
    type BetaImageBlockParam as BetaImageBlockParam,
    type BetaInputJSONDelta as BetaInputJSONDelta,
    type BetaMCPToolResultBlock as BetaMCPToolResultBlock,
    type BetaMCPToolUseBlock as BetaMCPToolUseBlock,
    type BetaMCPToolUseBlockParam as BetaMCPToolUseBlockParam,
    type BetaMessage as BetaMessage,
    type BetaMessageDeltaUsage as BetaMessageDeltaUsage,
    type BetaMessageParam as BetaMessageParam,
    type BetaMessageTokensCount as BetaMessageTokensCount,
    type BetaMetadata as BetaMetadata,
    type BetaPlainTextSource as BetaPlainTextSource,
    type BetaRawContentBlockDelta as BetaRawContentBlockDelta,
    type BetaRawContentBlockDeltaEvent as BetaRawContentBlockDeltaEvent,
    type BetaRawContentBlockStartEvent as BetaRawContentBlockStartEvent,
    type BetaRawContentBlockStopEvent as BetaRawContentBlockStopEvent,
    type BetaRawMessageDeltaEvent as BetaRawMessageDeltaEvent,
    type BetaRawMessageStartEvent as BetaRawMessageStartEvent,
    type BetaRawMessageStopEvent as BetaRawMessageStopEvent,
    type BetaRawMessageStreamEvent as BetaRawMessageStreamEvent,
    type BetaRedactedThinkingBlock as BetaRedactedThinkingBlock,
    type BetaRedactedThinkingBlockParam as BetaRedactedThinkingBlockParam,
    type BetaRequestDocumentBlock as BetaRequestDocumentBlock,
    type BetaRequestMCPServerToolConfiguration as BetaRequestMCPServerToolConfiguration,
    type BetaRequestMCPServerURLDefinition as BetaRequestMCPServerURLDefinition,
    type BetaRequestMCPToolResultBlockParam as BetaRequestMCPToolResultBlockParam,
    type BetaSearchResultBlockParam as BetaSearchResultBlockParam,
    type BetaServerToolUsage as BetaServerToolUsage,
    type BetaServerToolUseBlock as BetaServerToolUseBlock,
    type BetaServerToolUseBlockParam as BetaServerToolUseBlockParam,
    type BetaSignatureDelta as BetaSignatureDelta,
    type BetaStopReason as BetaStopReason,
    type BetaTextBlock as BetaTextBlock,
    type BetaTextBlockParam as BetaTextBlockParam,
    type BetaTextCitation as BetaTextCitation,
    type BetaTextCitationParam as BetaTextCitationParam,
    type BetaTextDelta as BetaTextDelta,
    type BetaThinkingBlock as BetaThinkingBlock,
    type BetaThinkingBlockParam as BetaThinkingBlockParam,
    type BetaThinkingConfigDisabled as BetaThinkingConfigDisabled,
    type BetaThinkingConfigEnabled as BetaThinkingConfigEnabled,
    type BetaThinkingConfigParam as BetaThinkingConfigParam,
    type BetaThinkingDelta as BetaThinkingDelta,
    type BetaTool as BetaTool,
    type BetaToolBash20241022 as BetaToolBash20241022,
    type BetaToolBash20250124 as BetaToolBash20250124,
    type BetaToolChoice as BetaToolChoice,
    type BetaToolChoiceAny as BetaToolChoiceAny,
    type BetaToolChoiceAuto as BetaToolChoiceAuto,
    type BetaToolChoiceNone as BetaToolChoiceNone,
    type BetaToolChoiceTool as BetaToolChoiceTool,
    type BetaToolComputerUse20241022 as BetaToolComputerUse20241022,
    type BetaToolComputerUse20250124 as BetaToolComputerUse20250124,
    type BetaToolResultBlockParam as BetaToolResultBlockParam,
    type BetaToolTextEditor20241022 as BetaToolTextEditor20241022,
    type BetaToolTextEditor20250124 as BetaToolTextEditor20250124,
    type BetaToolTextEditor20250429 as BetaToolTextEditor20250429,
    type BetaToolUnion as BetaToolUnion,
    type BetaToolUseBlock as BetaToolUseBlock,
    type BetaToolUseBlockParam as BetaToolUseBlockParam,
    type BetaURLImageSource as BetaURLImageSource,
    type BetaURLPDFSource as BetaURLPDFSource,
    type BetaUsage as BetaUsage,
    type BetaWebSearchResultBlock as BetaWebSearchResultBlock,
    type BetaWebSearchResultBlockParam as BetaWebSearchResultBlockParam,
    type BetaWebSearchTool20250305 as BetaWebSearchTool20250305,
    type BetaWebSearchToolRequestError as BetaWebSearchToolRequestError,
    type BetaWebSearchToolResultBlock as BetaWebSearchToolResultBlock,
    type BetaWebSearchToolResultBlockContent as BetaWebSearchToolResultBlockContent,
    type BetaWebSearchToolResultBlockParam as BetaWebSearchToolResultBlockParam,
    type BetaWebSearchToolResultBlockParamContent as BetaWebSearchToolResultBlockParamContent,
    type BetaWebSearchToolResultError as BetaWebSearchToolResultError,
    type BetaWebSearchToolResultErrorCode as BetaWebSearchToolResultErrorCode,
    type BetaBase64PDFBlock as BetaBase64PDFBlock,
    type MessageCreateParams as MessageCreateParams,
    type MessageCreateParamsNonStreaming as MessageCreateParamsNonStreaming,
    type MessageCreateParamsStreaming as MessageCreateParamsStreaming,
    type MessageCountTokensParams as MessageCountTokensParams,
  };

  export {
    Batches as Batches,
    type BetaDeletedMessageBatch as BetaDeletedMessageBatch,
    type BetaMessageBatch as BetaMessageBatch,
    type BetaMessageBatchCanceledResult as BetaMessageBatchCanceledResult,
    type BetaMessageBatchErroredResult as BetaMessageBatchErroredResult,
    type BetaMessageBatchExpiredResult as BetaMessageBatchExpiredResult,
    type BetaMessageBatchIndividualResponse as BetaMessageBatchIndividualResponse,
    type BetaMessageBatchRequestCounts as BetaMessageBatchRequestCounts,
    type BetaMessageBatchResult as BetaMessageBatchResult,
    type BetaMessageBatchSucceededResult as BetaMessageBatchSucceededResult,
    type BetaMessageBatchesPage as BetaMessageBatchesPage,
    type BatchCreateParams as BatchCreateParams,
    type BatchRetrieveParams as BatchRetrieveParams,
    type BatchListParams as BatchListParams,
    type BatchDeleteParams as BatchDeleteParams,
    type BatchCancelParams as BatchCancelParams,
    type BatchResultsParams as BatchResultsParams,
  };
}
