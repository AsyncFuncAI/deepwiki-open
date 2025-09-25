// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import * as BetaAPI from '../beta';
import { APIPromise } from '../../../core/api-promise';
import * as BetaMessagesAPI from './messages';
import { Page, type PageParams, PagePromise } from '../../../core/pagination';
import { buildHeaders } from '../../../internal/headers';
import { RequestOptions } from '../../../internal/request-options';
import { JSONLDecoder } from '../../../internal/decoders/jsonl';
import { AnthropicError } from '../../../error';
import { path } from '../../../internal/utils/path';

export class Batches extends APIResource {
  /**
   * Send a batch of Message creation requests.
   *
   * The Message Batches API can be used to process multiple Messages API requests at
   * once. Once a Message Batch is created, it begins processing immediately. Batches
   * can take up to 24 hours to complete.
   *
   * Learn more about the Message Batches API in our
   * [user guide](/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaMessageBatch =
   *   await client.beta.messages.batches.create({
   *     requests: [
   *       {
   *         custom_id: 'my-custom-id-1',
   *         params: {
   *           max_tokens: 1024,
   *           messages: [
   *             { content: 'Hello, world', role: 'user' },
   *           ],
   *           model: 'claude-sonnet-4-20250514',
   *         },
   *       },
   *     ],
   *   });
   * ```
   */
  create(params: BatchCreateParams, options?: RequestOptions): APIPromise<BetaMessageBatch> {
    const { betas, ...body } = params;
    return this._client.post('/v1/messages/batches?beta=true', {
      body,
      ...options,
      headers: buildHeaders([
        { 'anthropic-beta': [...(betas ?? []), 'message-batches-2024-09-24'].toString() },
        options?.headers,
      ]),
    });
  }

  /**
   * This endpoint is idempotent and can be used to poll for Message Batch
   * completion. To access the results of a Message Batch, make a request to the
   * `results_url` field in the response.
   *
   * Learn more about the Message Batches API in our
   * [user guide](/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaMessageBatch =
   *   await client.beta.messages.batches.retrieve(
   *     'message_batch_id',
   *   );
   * ```
   */
  retrieve(
    messageBatchID: string,
    params: BatchRetrieveParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<BetaMessageBatch> {
    const { betas } = params ?? {};
    return this._client.get(path`/v1/messages/batches/${messageBatchID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { 'anthropic-beta': [...(betas ?? []), 'message-batches-2024-09-24'].toString() },
        options?.headers,
      ]),
    });
  }

  /**
   * List all Message Batches within a Workspace. Most recently created batches are
   * returned first.
   *
   * Learn more about the Message Batches API in our
   * [user guide](/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const betaMessageBatch of client.beta.messages.batches.list()) {
   *   // ...
   * }
   * ```
   */
  list(
    params: BatchListParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<BetaMessageBatchesPage, BetaMessageBatch> {
    const { betas, ...query } = params ?? {};
    return this._client.getAPIList('/v1/messages/batches?beta=true', Page<BetaMessageBatch>, {
      query,
      ...options,
      headers: buildHeaders([
        { 'anthropic-beta': [...(betas ?? []), 'message-batches-2024-09-24'].toString() },
        options?.headers,
      ]),
    });
  }

  /**
   * Delete a Message Batch.
   *
   * Message Batches can only be deleted once they've finished processing. If you'd
   * like to delete an in-progress batch, you must first cancel it.
   *
   * Learn more about the Message Batches API in our
   * [user guide](/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaDeletedMessageBatch =
   *   await client.beta.messages.batches.delete(
   *     'message_batch_id',
   *   );
   * ```
   */
  delete(
    messageBatchID: string,
    params: BatchDeleteParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<BetaDeletedMessageBatch> {
    const { betas } = params ?? {};
    return this._client.delete(path`/v1/messages/batches/${messageBatchID}?beta=true`, {
      ...options,
      headers: buildHeaders([
        { 'anthropic-beta': [...(betas ?? []), 'message-batches-2024-09-24'].toString() },
        options?.headers,
      ]),
    });
  }

  /**
   * Batches may be canceled any time before processing ends. Once cancellation is
   * initiated, the batch enters a `canceling` state, at which time the system may
   * complete any in-progress, non-interruptible requests before finalizing
   * cancellation.
   *
   * The number of canceled requests is specified in `request_counts`. To determine
   * which requests were canceled, check the individual results within the batch.
   * Note that cancellation may not result in any canceled requests if they were
   * non-interruptible.
   *
   * Learn more about the Message Batches API in our
   * [user guide](/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaMessageBatch =
   *   await client.beta.messages.batches.cancel(
   *     'message_batch_id',
   *   );
   * ```
   */
  cancel(
    messageBatchID: string,
    params: BatchCancelParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<BetaMessageBatch> {
    const { betas } = params ?? {};
    return this._client.post(path`/v1/messages/batches/${messageBatchID}/cancel?beta=true`, {
      ...options,
      headers: buildHeaders([
        { 'anthropic-beta': [...(betas ?? []), 'message-batches-2024-09-24'].toString() },
        options?.headers,
      ]),
    });
  }

  /**
   * Streams the results of a Message Batch as a `.jsonl` file.
   *
   * Each line in the file is a JSON object containing the result of a single request
   * in the Message Batch. Results are not guaranteed to be in the same order as
   * requests. Use the `custom_id` field to match results to requests.
   *
   * Learn more about the Message Batches API in our
   * [user guide](/en/docs/build-with-claude/batch-processing)
   *
   * @example
   * ```ts
   * const betaMessageBatchIndividualResponse =
   *   await client.beta.messages.batches.results(
   *     'message_batch_id',
   *   );
   * ```
   */
  async results(
    messageBatchID: string,
    params: BatchResultsParams | undefined = {},
    options?: RequestOptions,
  ): Promise<JSONLDecoder<BetaMessageBatchIndividualResponse>> {
    const batch = await this.retrieve(messageBatchID);
    if (!batch.results_url) {
      throw new AnthropicError(
        `No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`,
      );
    }

    const { betas } = params ?? {};
    return this._client
      .get(batch.results_url, {
        ...options,
        headers: buildHeaders([
          {
            'anthropic-beta': [...(betas ?? []), 'message-batches-2024-09-24'].toString(),
            Accept: 'application/binary',
          },
          options?.headers,
        ]),
        stream: true,
        __binaryResponse: true,
      })
      ._thenUnwrap((_, props) => JSONLDecoder.fromResponse(props.response, props.controller)) as APIPromise<
      JSONLDecoder<BetaMessageBatchIndividualResponse>
    >;
  }
}

export type BetaMessageBatchesPage = Page<BetaMessageBatch>;

export interface BetaDeletedMessageBatch {
  /**
   * ID of the Message Batch.
   */
  id: string;

  /**
   * Deleted object type.
   *
   * For Message Batches, this is always `"message_batch_deleted"`.
   */
  type: 'message_batch_deleted';
}

export interface BetaMessageBatch {
  /**
   * Unique object identifier.
   *
   * The format and length of IDs may change over time.
   */
  id: string;

  /**
   * RFC 3339 datetime string representing the time at which the Message Batch was
   * archived and its results became unavailable.
   */
  archived_at: string | null;

  /**
   * RFC 3339 datetime string representing the time at which cancellation was
   * initiated for the Message Batch. Specified only if cancellation was initiated.
   */
  cancel_initiated_at: string | null;

  /**
   * RFC 3339 datetime string representing the time at which the Message Batch was
   * created.
   */
  created_at: string;

  /**
   * RFC 3339 datetime string representing the time at which processing for the
   * Message Batch ended. Specified only once processing ends.
   *
   * Processing ends when every request in a Message Batch has either succeeded,
   * errored, canceled, or expired.
   */
  ended_at: string | null;

  /**
   * RFC 3339 datetime string representing the time at which the Message Batch will
   * expire and end processing, which is 24 hours after creation.
   */
  expires_at: string;

  /**
   * Processing status of the Message Batch.
   */
  processing_status: 'in_progress' | 'canceling' | 'ended';

  /**
   * Tallies requests within the Message Batch, categorized by their status.
   *
   * Requests start as `processing` and move to one of the other statuses only once
   * processing of the entire batch ends. The sum of all values always matches the
   * total number of requests in the batch.
   */
  request_counts: BetaMessageBatchRequestCounts;

  /**
   * URL to a `.jsonl` file containing the results of the Message Batch requests.
   * Specified only once processing ends.
   *
   * Results in the file are not guaranteed to be in the same order as requests. Use
   * the `custom_id` field to match results to requests.
   */
  results_url: string | null;

  /**
   * Object type.
   *
   * For Message Batches, this is always `"message_batch"`.
   */
  type: 'message_batch';
}

export interface BetaMessageBatchCanceledResult {
  type: 'canceled';
}

export interface BetaMessageBatchErroredResult {
  error: BetaAPI.BetaErrorResponse;

  type: 'errored';
}

export interface BetaMessageBatchExpiredResult {
  type: 'expired';
}

/**
 * This is a single line in the response `.jsonl` file and does not represent the
 * response as a whole.
 */
export interface BetaMessageBatchIndividualResponse {
  /**
   * Developer-provided ID created for each request in a Message Batch. Useful for
   * matching results to requests, as results may be given out of request order.
   *
   * Must be unique for each request within the Message Batch.
   */
  custom_id: string;

  /**
   * Processing result for this request.
   *
   * Contains a Message output if processing was successful, an error response if
   * processing failed, or the reason why processing was not attempted, such as
   * cancellation or expiration.
   */
  result: BetaMessageBatchResult;
}

export interface BetaMessageBatchRequestCounts {
  /**
   * Number of requests in the Message Batch that have been canceled.
   *
   * This is zero until processing of the entire Message Batch has ended.
   */
  canceled: number;

  /**
   * Number of requests in the Message Batch that encountered an error.
   *
   * This is zero until processing of the entire Message Batch has ended.
   */
  errored: number;

  /**
   * Number of requests in the Message Batch that have expired.
   *
   * This is zero until processing of the entire Message Batch has ended.
   */
  expired: number;

  /**
   * Number of requests in the Message Batch that are processing.
   */
  processing: number;

  /**
   * Number of requests in the Message Batch that have completed successfully.
   *
   * This is zero until processing of the entire Message Batch has ended.
   */
  succeeded: number;
}

/**
 * Processing result for this request.
 *
 * Contains a Message output if processing was successful, an error response if
 * processing failed, or the reason why processing was not attempted, such as
 * cancellation or expiration.
 */
export type BetaMessageBatchResult =
  | BetaMessageBatchSucceededResult
  | BetaMessageBatchErroredResult
  | BetaMessageBatchCanceledResult
  | BetaMessageBatchExpiredResult;

export interface BetaMessageBatchSucceededResult {
  message: BetaMessagesAPI.BetaMessage;

  type: 'succeeded';
}

export interface BatchCreateParams {
  /**
   * Body param: List of requests for prompt completion. Each is an individual
   * request to create a Message.
   */
  requests: Array<BatchCreateParams.Request>;

  /**
   * Header param: Optional header to specify the beta version(s) you want to use.
   */
  betas?: Array<BetaAPI.AnthropicBeta>;
}

export namespace BatchCreateParams {
  export interface Request {
    /**
     * Developer-provided ID created for each request in a Message Batch. Useful for
     * matching results to requests, as results may be given out of request order.
     *
     * Must be unique for each request within the Message Batch.
     */
    custom_id: string;

    /**
     * Messages API creation parameters for the individual request.
     *
     * See the [Messages API reference](/en/api/messages) for full documentation on
     * available parameters.
     */
    params: Omit<BetaMessagesAPI.MessageCreateParamsNonStreaming, 'betas'>;
  }
}

export interface BatchRetrieveParams {
  /**
   * Optional header to specify the beta version(s) you want to use.
   */
  betas?: Array<BetaAPI.AnthropicBeta>;
}

export interface BatchListParams extends PageParams {
  /**
   * Header param: Optional header to specify the beta version(s) you want to use.
   */
  betas?: Array<BetaAPI.AnthropicBeta>;
}

export interface BatchDeleteParams {
  /**
   * Optional header to specify the beta version(s) you want to use.
   */
  betas?: Array<BetaAPI.AnthropicBeta>;
}

export interface BatchCancelParams {
  /**
   * Optional header to specify the beta version(s) you want to use.
   */
  betas?: Array<BetaAPI.AnthropicBeta>;
}

export interface BatchResultsParams {
  /**
   * Optional header to specify the beta version(s) you want to use.
   */
  betas?: Array<BetaAPI.AnthropicBeta>;
}

export declare namespace Batches {
  export {
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
