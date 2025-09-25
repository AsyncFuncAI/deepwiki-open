# Cockatiel

[![Actions Status](https://github.com/connor4312/cockatiel/workflows/Run%20Tests/badge.svg)](https://github.com/connor4312/cockatiel/actions)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/cockatiel)](https://bundlephobia.com/result?p=cockatiel@0.1.0)
![No dependencies](https://img.shields.io/badge/dependencies-none-success)

Cockatiel is resilience and transient-fault-handling library that allows developers to express policies such as Retry, Circuit Breaker, Timeout, Bulkhead Isolation, and Fallback. .NET has [Polly](https://github.com/App-vNext/Polly), a wonderful one-stop shop for all your fault handling needs--I missed having such a library for my JavaScript projects, and grew tired of copy-pasting retry logic between my projects. Hence, this module!

    npm install --save cockatiel

Then go forth with confidence:

```js
import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  retry,
  handleAll,
  circuitBreaker,
  wrap,
} from 'cockatiel';
import { database } from './my-db';

// Create a retry policy that'll try whatever function we execute 3
// times with a randomized exponential backoff.
const retryPolicy = retry(handleAll, { maxAttempts: 3, backoff: new ExponentialBackoff() });

// Create a circuit breaker that'll stop calling the executed function for 10
// seconds if it fails 5 times in a row. This can give time for e.g. a database
// to recover without getting tons of traffic.
const circuitBreakerPolicy = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new ConsecutiveBreaker(5),
});

// Combine these! Create a policy that retries 3 times, calling through the circuit breaker
const retryWithBreaker = wrap(retryPolicy, circuitBreakerPolicy);

exports.handleRequest = async (req, res) => {
  // Call your database safely!
  const data = await retryWithBreaker.execute(() => database.getInfo(req.params.id));
  return res.json(data);
};
```

I recommend reading the [Polly wiki](https://github.com/App-vNext/Polly/wiki) for more information for details and mechanics around the patterns we provide.

## Table of Contents

- [`IPolicy` (the shape of a policy)](#ipolicy-the-shape-of-a-policy)
- [`Policy`](#policy)
  - [`handleAll`](#handleall)
  - [`handleType(ctor[, filter])` / `policy.orType(ctor[, filter])`](#handletypector-filter--policyortypector-filter)
  - [`handleWhen(filter)` / `policy.orWhen(filter)`](#handlewhenfilter--policyorwhenfilter)
  - [`handleResultType(ctor[, filter])` / `policy.orResultType(ctor[, filter])`](#handleresulttypector-filter--policyorresulttypector-filter)
  - [`handleWhenResult(filter)` / `policy.orWhenResult(filter)`](#handlewhenresultfilter--policyorwhenresultfilter)
  - [`wrap(...policies)`](#wrappolicies)
  - [`@usePolicy(policy)`](#usepolicypolicy)
  - [`noop`](#noop)
- [Events](#events)
  - [`Event.toPromise(event[, signal])`](#eventtopromiseevent-signal)
  - [`Event.once(event, callback)`](#eventonceevent-callback)
- [`retry(policy, options)`](#retrypolicy-options)
  - [Backoffs](#backoffs)
    - [`ConstantBackoff`](#constantbackoff)
    - [`ExponentialBackoff`](#exponentialbackoff)
    - [`IterableBackoff`](#iterablebackoff)
    - [`DelegateBackoff`](#delegatebackoff)
  - [`retry.execute(fn[, signal])`](#retryexecutefn-signal)
  - [`retry.dangerouslyUnref()`](#retrydangerouslyunref)
  - [`retry.onRetry(callback)`](#retryonretrycallback)
  - [`retry.onSuccess(callback)`](#retryonsuccesscallback)
  - [`retry.onFailure(callback)`](#retryonfailurecallback)
  - [`retry.onGiveUp(callback)`](#retryongiveupcallback)
- [`circuitBreaker(policy, { halfOpenAfter, breaker[, initialState] })`](#circuitbreakerpolicy--halfopenafter-breaker-initialstate-)
  - [Breakers](#breakers)
    - [`ConsecutiveBreaker`](#consecutivebreaker)
    - [`CountBreaker`](#countbreaker)
    - [`SamplingBreaker`](#samplingbreaker)
  - [`breaker.execute(fn[, signal])`](#breakerexecutefn-signal)
  - [`breaker.state`](#breakerstate)
  - [`breaker.onBreak(callback)`](#breakeronbreakcallback)
  - [`breaker.onReset(callback)`](#breakeronresetcallback)
  - [`breaker.onHalfOpen(callback)`](#breakeronhalfopencallback)
  - [`breaker.onStateChange(callback)`](#breakeronstatechangecallback)
  - [`breaker.onSuccess(callback)`](#breakeronsuccesscallback)
  - [`breaker.onFailure(callback)`](#breakeronfailurecallback)
  - [`breaker.isolate()`](#breakerisolate)
  - [`breaker.toJSON()`](#breakertojson)
- [`timeout(duration, strategy)`](#timeoutduration-strategy)
  - [`timeout.dangerouslyUnref()`](#timeoutdangerouslyunref)
  - [`timeout.execute(fn[, signal])`](#timeoutexecutefn-signal)
  - [`timeout.onTimeout(callback)`](#timeoutontimeoutcallback)
  - [`timeout.onSuccess(callback)`](#timeoutonsuccesscallback)
  - [`timeout.onFailure(callback)`](#timeoutonfailurecallback)
- [`bulkhead(limit[, queue])`](#bulkheadlimit-queue)
  - [`bulkhead.execute(fn[, signal])`](#bulkheadexecutefn-signal)
  - [`bulkhead.onReject(callback)`](#bulkheadonrejectcallback)
  - [`bulkhead.onSuccess(callback)`](#bulkheadonsuccesscallback)
  - [`bulkhead.onFailure(callback)`](#bulkheadonfailurecallback)
  - [`bulkhead.executionSlots`](#bulkheadexecutionslots)
  - [`bulkhead.queueSlots`](#bulkheadqueueslots)
- [`fallback(policy, valueOrFactory)`](#fallbackpolicy-valueorfactory)
  - [`fallback.execute(fn[, signal])`](#fallbackexecutefn-signal)
  - [`fallback.onSuccess(callback)`](#fallbackonsuccesscallback)
  - [`fallback.onFailure(callback)`](#fallbackonfailurecallback)
- [See Also](#see-also)

## `IPolicy` (the shape of a policy)

All Cockatiel fault handling policies (fallbacks, circuit breakers, bulkheads, timeouts, retries) adhere to the same interface. In TypeScript, this is given as:

```ts
export interface IPolicy<ContextType extends { signal: AbortSignal }> {
  /**
   * Fires on the policy when a request successfully completes and some
   * successful value will be returned. In a retry policy, this is fired once
   * even if the request took multiple retries to succeed.
   */
  readonly onSuccess: Event<ISuccessEvent>;

  /**
   * Fires on the policy when a request fails *due to a handled reason* fails
   * and will give rejection to the called.
   */
  readonly onFailure: Event<IFailureEvent>;

  /**
   * Runs the function through behavior specified by the policy.
   */
  execute<T>(fn: (context: ContextType) => PromiseLike<T> | T, signal?: AbortSignal): Promise<T>;
}
```

If you don't read TypeScript often, here's what it means:

- There are two [events](#events), `onSuccess`/`onFailure`, that are called when a call succeeds or fails. Note that `onFailure` _only_ is called if a handled error is thrown.

  As a design decision, Cockatiel won't assume all thrown errors are actually failures unless you tell us. For example, in your application you might have errors thrown if the user submits invalid input, and triggering fault handling behavior for this reason would not be desirable!

- There's an `execute` function that you can use to "wrap" your own function. Anything you return from that function is returned, in a promise, from `execute`. You can optionally pass an abort signal to the `execute()` function, and the function will always be called with an object _at least_ containing an abort signal (some policies might add extra metadata for you).

## `Policy`

The Policy defines how errors and results are handled. Everything in Cockatiel ultimately deals with handling errors or bad results. The Policy sets up how

### `handleAll`

A generic policy to handle _all_ errors.

```ts
import { handleAll } from 'cockatiel';

retry(handleAll /* ... */);
```

### `handleType(ctor[, filter])` / `policy.orType(ctor[, filter])`

Tells the policy to handle errors of the given type, passing in the contructor. If a `filter` function is also passed, we'll only handle errors if that also returns true.

```ts
import { handleType } from 'cockatiel';

handleType(NetworkError).orType(HttpError, err => err.statusCode === 503);
// ...
```

### `handleWhen(filter)` / `policy.orWhen(filter)`

Tells the policy to handle any error for which the filter returns truthy

```ts
import { handleWhen } from 'cockatiel';

handleWhen(err => err instanceof NetworkError).orWhen(err => err.shouldRetry === true);
// ...
```

### `handleResultType(ctor[, filter])` / `policy.orResultType(ctor[, filter])`

Tells the policy to treat certain return values of the function as errors--retrying if they appear, for instance. Results will be retried if they're an instance of the given class. If a `filter` function is also passed, we'll only treat return values as errors if that also returns true.

```ts
import { handleResultType } from 'cockatiel';

handleResultType(ReturnedNetworkError).orResultType(HttpResult, res => res.statusCode === 503);
// ...
```

### `handleWhenResult(filter)` / `policy.orWhenResult(filter)`

Tells the policy to treat certain return values of the function as errors--retrying if they appear, for instance. Results will be retried the filter function returns true.

```ts
import { handleWhenResult } from 'cockatiel';

handleWhenResult(res => res.statusCode === 503).orWhenResult(res => res.statusCode === 429);
// ...
```

### `wrap(...policies)`

Wraps the given set of policies into a single policy. For instance, this:

```js
const result = await retry.execute(() =>
  breaker.execute(() => timeout.execute(({ signal }) => getData(signal))),
);
```

Is the equivalent to:

```js
import { wrap } from 'cockatiel';

const result = await wrap(retry, breaker, timeout).execute(({ signal }) => getData(signal));
```

The `context` argument passed to the executed function is the merged object of all previous policies. So for instance, in the above example you'll get the abort signal from the [TimeoutPolicy](#timeoutduration-strategy) as well as the attempt number from the [RetryPolicy](#retrypolicy-options):

```ts
import { wrap } from 'cockatiel';

wrap(retry, breaker, timeout).execute(context => {
  console.log(context);
  // => { attempts: 1, cancellation: }
});
```

The individual wrapped policies are accessible on the `policies` property of the policy returned from `wrap()`.

### `@usePolicy(policy)`

A decorator that can be used to wrap class methods and apply the given policy to them. It also adds the last argument normally given in `Policy.execute` as the last argument in the function call. For example:

```ts
import { usePolicy, handleAll, retry } from 'cockatiel';

const retry = retry(handleAll, { attempts: 3 });

class Database {
  @usePolicy(retry)
  public getUserInfo(userId, context) {
    console.log('Retry attempt number', context.attempt);
    // implementation here
  }
}

const db = new Database();
db.getUserInfo(3).then(info => console.log('User 3 info:', info));
```

Note that it will force the return type to be a Promise, since that's what policies return.

### `noop`

A no-op policy, which may be useful for tests and stubs.

```ts
import { noop, handleAll, retry } from 'cockatiel';

const policy = isProduction ? retry(handleAll, { attempts: 3 }) : noop;

export async function handleRequest() {
  return policy.execute(() => getInfoFromDatabase());
}
```

## Events

Cockatiel uses a simple bespoke style for events, similar to those that we use in VS Code. These events provide better type-safety (you can never subscribe to the wrong event name) and better functionality around triggering listeners.

An event can be subscribed to simply by passing a callback. Take [`onFailure`](#fallbackonfailurecallback) for instance:

```js
const listener = policy.onFailure(error => {
  console.log(error);
});
```

The event returns an `IDisposable` instance. To unsubscribe the listener, call `.dispose()` on the returned instance. It's always safe to call an IDisposable's `.dispose()` multiple times.

```js
listener.dispose();
```

We provide a couple extra utilities around events as well.

### `Event.toPromise(event[, signal])`

Returns a promise that resolves once the event fires. Optionally, you can pass in an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to control when you stop listening, which will reject the promise with a `TaskCancelledError` if it's not already resolved.

```js
import { Event } from 'cockatiel';

async function waitForFallback(policy) {
  await Event.toPromise(policy.onFallback);
  console.log('a fallback happened!');
}
```

### `Event.once(event, callback)`

Waits for the event to fire once, and then automatically unregisters the listener. This method itself returns an `IDisposable`, which you could use to unregister the listener if needed.

```js
import { Event } from 'cockatiel';

async function waitForFallback(policy) {
  Event.once(policy.onFallback, () => {
    console.log('a fallback happened!');
  });
}
```

## `retry(policy, options)`

`retry()` uses a [Policy](#Policy) to retry running something multiple times. Like other builders, you can use a retry builder between multiple calls.

To use `retry()`, first pass in the [Policy](#Policy) to use, and then the options. The options are an object containing:

- `maxAttempts`: the number of attempts to make before giving up
- `backoff`: a generator that tells Cockatiel how long to wait between attempts. A number of backoff implementations are provided out of the box:

  - [ConstantBackoff](#constantbackoff)
  - [IterableBackoff](#iterablebackoff)
  - [ExponentialBackoff](#exponentialbackoff)
  - [DelegateBackoff](#DelegateBackoff) (advanced)

Here are some examples:

```ts
import { retry, handleAll, handleType, ExponentialBackoff } from 'cockatiel';

const response1 = await retry(
  handleAll, // handle all errors
  { maxAttempts: 3 }, // retry three times, with no backoff
).execute(() => getJson('https://example.com'));

const response2 = await retry(
  handleType(NetworkError), // handle only network errors,
  { maxAttempts: 3, backoff: new ExponentialBackoff() }, // backoff exponentially 3 times
).execute(() => getJson('https://example.com'));
```

### Backoffs

Backoff algorithms are immutable. The backoff class adheres to the interface:

```ts
export interface IBackoffFactory<T> {
  /**
   * Returns the next backoff duration.
   */
  next(context: T): IBackoff<T>;
}
```

The backoff, returned from the `next()` call, has the appropriate delay and `next()` method again.

```ts
export interface IBackoff<T> {
  next(context: T): IBackoff<T>; // same as above

  /**
   * Returns the number of milliseconds to wait for this backoff attempt.
   */
  readonly duration: number;
}
```

#### `ConstantBackoff`

A backoff that backs off for a constant amount of time.

```ts
import { ConstantBackoff } from 'cockatiel';

// Waits 50ms between back offs, forever
const foreverBackoff = new ConstantBackoff(50);
```

#### `ExponentialBackoff`

> Tip: exponential backoffs and [circuit breakers](#circuitbreakerpolicy--halfopenafter-breaker-initialstate-) are great friends!

The crowd favorite. By default, it uses a decorrelated jitter algorithm, which is a good default for most applications. Takes in an options object, which can have any of these properties:

```ts
export interface IExponentialBackoffOptions<S> {
  /**
   * Delay generator function to use. This package provides several of these/
   * Defaults to "decorrelatedJitterGenerator", a good default for most
   * scenarios (see the linked Polly issue).
   *
   * @see https://github.com/App-vNext/Polly/issues/530
   * @see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
   */
  generator: GeneratorFn<S>;

  /**
   * Maximum delay, in milliseconds. Defaults to 30s.
   */
  maxDelay: number;

  /**
   * Backoff exponent. Defaults to 2.
   */
  exponent: number;

  /**
   * The initial, first delay of the backoff, in milliseconds.
   * Defaults to 128ms.
   */
  initialDelay: number;
}
```

Example:

```ts
import { ExponentialBackoff, noJitterGenerator } from 'cockatiel';

// Use all the defaults. Decorrelated jitter, 30 seconds max delay, infinite attempts:
const defaultBackoff = new ExponentialBackoff();

// Have some lower limits:
const limitedBackoff = new ExponentialBackoff({ maxDelay: 1000, initialDelay: 4 });

// Use a backoff without jitter
const limitedBackoff = new ExponentialBackoff({ generator: noJitterGenerator });
```

Several jitter strategies are provided. This [AWS blog post](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) has more information around the strategies and why you might want to use them. The available jitter generators exported from `cockatiel` are:

- `decorrelatedJitterGenerator` -- The default implementation, the one that [Polly.Contrib.WaitAndRetry uses](https://github.com/Polly-Contrib/Polly.Contrib.WaitAndRetry/tree/79224cff9670b159418f955af4d0a9ebc2a09778#new-jitter-recommendation)
- `noJitterGenerator` -- Does not add any jitter
- `fullJitterGenerator` -- Jitters between `[0, interval)`
- `halfJitterGenerator` -- Jitters between `[interval / 2, interval)`

#### `IterableBackoff`

Takes in a list of delays, and goes through them one by one. When it reaches the end of the list, the backoff will continue to use the last value.

```ts
import { IterableBackoff } from 'cockatiel';

// Wait 100ms, 200ms, and then 500ms between attempts:
const backoff = new IterableBackoff([100, 200, 500]);
```

#### `DelegateBackoff`

Delegates determining the backoff to the given function. The function should return a number of milliseconds to wait.

```ts
import { DelegateBackoff } from 'cockatiel';

// Try with any random delay up to 500ms
const backoff = new DelegateBackoff(context => Math.random() * 500));
```

The first parameter is the generic `context` in which the backoff is being used. For retries, the context is an interface like this:

```ts
export interface IRetryBackoffContext<ReturnType> {
  /**
   * The retry attempt, starting at 1 for calls into backoffs.
   */
  attempt: number;

  /**
   * The result of the last method call. Either a thrown error, or a value
   * that we determined should be retried upon.
   */
  result: { error: Error } | { value: ReturnType };
}
```

You can also take in a `state` as the second parameter, and return an object containing the `{ state: S, delay: number }`. Here's both of those in action that we use to create a backoff policy that will stop backing off if we get the same error twice in a row, otherwise do an exponential backoff:

```ts
import { DelegateBackoff } from 'cockatiel';

const myDelegateBackoff = new DelegateBackoff((context, lastError) => {
  if (context.result.error && context.result.error === lastError) {
    throw context.result.error;
  }

  return { delay: 100 * Math.pow(2, context.count), state: context.result.error };
});
```

### `retry.execute(fn[, signal])`

Executes the function. The current retry context, containing the attempts and abort token, `{ attempt: number, signal: AbortSignal }`, is passed as the function's first argument. The function should throw, return a promise, or return a value, which get handled as configured in the Policy.

If the function doesn't succeed before the backoff ceases or cancellation is requested, the last error thrown will be bubbled up, or the last result will be returned (if you used any of the `handleResult*` methods).

```ts
await retry(handleAll, { maxAttempts: 3 }).execute(() => getJson('https://example.com'));
```

### `retry.dangerouslyUnref()`

When retrying, a referenced timer is created. This means the Node.js event loop is kept active while we're delaying a retried call. Calling this method on the retry builder will unreference the timer, allowing the process to exit even if a retry might still be pending:

```ts
const response1 = await retry(handleAll, { maxAttempts: 3 })
  .dangerouslyUnref()
  .execute(() => getJson('https://example.com'));
```

### `retry.onRetry(callback)`

An [event emitter](#events) that fires when we retry a call, before any backoff. It's invoked with an object that includes:

- the `delay` we're going to wait before retrying,
- the `attempt` number of the upcoming retry, starting at `1`, and;
- either a thrown error like `{ error: someError, delay: number }`, or an errorful result in an object like `{ value: someValue, delay: number }` when using [result filtering](#handleresulttypector-filter--policyorresulttypector-filter).

Useful for telemetry. Returns a disposable instance.

```js
const listener = retry.onRetry(reason => console.log('retrying a function call:', reason));

// ...

listener.dispose();
```

### `retry.onSuccess(callback)`

An [event emitter](#events) that fires whenever a function is successfully called. It's invoked with an object containing the duration in milliseconds to nanosecond precision.

```js
const listener = retry.onSuccess(({ duration }) => {
  console.log(`retry call ran in ${duration}ms`);
});

// ...

listener.dispose();
```

### `retry.onFailure(callback)`

An [event emitter](#events) that fires whenever a function throw an error or returns an errorful result. It's invoked with the duration of the call, the reason for the failure, and an boolean indicating whether the error is handled by the policy.

```js
const listener = retry.onFailure(({ duration, handled, reason }) => {
  console.log(`retry call ran in ${duration}ms and failed with`, reason);
  console.log(handled ? 'error was handled' : 'error was not handled');
});

// later:
listener.dispose();
```

### `retry.onGiveUp(callback)`

An [event emitter](#events) that fires when we're no longer retrying a call and are giving up. It's invoked with either a thrown error in an object like `{ error: someError }`, or an errorful result in an object like `{ value: someValue }` when using [result filtering](#handleresulttypector-filter--policyorresulttypector-filter). Useful for telemetry. Returns a disposable instance.

```js
const listener = retry.onGiveUp(reason => console.log('retrying a function call:', reason));

listener.dispose();
```

## `circuitBreaker(policy, { halfOpenAfter, breaker[, initialState] })`

Circuit breakers stop execution for a period of time after a failure threshold has been reached. This is very useful to allow faulting systems to recover without overloading them. See the [Polly docs](https://github.com/App-vNext/Polly/wiki/Circuit-Breaker#how-the-polly-circuitbreaker-works) for more detailed information around circuit breakers.

> It's **important** that you reuse the same circuit breaker across multiple requests, otherwise it won't do anything!

To create a breaker, you use a [Policy](#Policy) like you normally would, and call `circuitBreaker()`.

- The `halfOpenAfter` option is the number of milliseconds after which we should try to close the circuit after failure ('closing the circuit' means restarting requests).

  You may also pass a backoff strategy instead of a constant number of milliseconds if you wish to increase the interval between consecutive failing half-open checks.

- The `breaker` is the [breaker policy](#breakers) which controls when the circuit opens.

- The `initialState` option can be passed if you're hydrating the breaker from state collectiond from previous execution using [breaker.toJSON()](#breakertojson).

Calls to `execute()` while the circuit is open (not taking requests) will throw a `BrokenCircuitError`.

```js
import {
  circuitBreaker,
  handleAll,
  BrokenCircuitError,
  ConsecutiveBreaker,
  SamplingBreaker,
  ExponentialBackoff,
} from 'cockatiel';

// Break if more than 20% of requests fail in a 30 second time window:
const breaker = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new SamplingBreaker({ threshold: 0.2, duration: 30 * 1000 }),
});

// Break if more than 5 requests in a row fail, and use a backoff for retry attempts:
const breaker = circuitBreaker(handleAll, {
  halfOpenAfter: new ExponentialBackoff(),
  breaker: new ConsecutiveBreaker(5),
});

// Get info from the database, or return 'service unavailable' if it's down/recovering
export async function handleRequest() {
  try {
    return await breaker.execute(() => getInfoFromDatabase());
  } catch (e) {
    if (e instanceof BrokenCircuitError) {
      return 'service unavailable';
    } else {
      throw e;
    }
  }
}
```

### Breakers

#### `ConsecutiveBreaker`

The `ConsecutiveBreaker` breaks after `n` requests in a row fail. Simple, easy.

```js
// Break if more than 5 requests in a row fail:
const breaker = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new ConsecutiveBreaker(5),
});
```

#### `CountBreaker`

The `CountBreaker` breaks after a proportion of requests in a count based sliding window fail. It is inspired by the [Count-based sliding window in Resilience4j](https://resilience4j.readme.io/docs/circuitbreaker#count-based-sliding-window).

```js
// Break if more than 20% of requests fail in a sliding window of size 100:
const breaker = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new CountBreaker({ threshold: 0.2, size: 100 }),
});
```

You can specify a minimum minimum-number-of-calls value to use, to avoid opening the circuit when there are only few samples in the sliding window. By default this value is set to the sliding window size, but you can override it if necessary:

```js
const breaker = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new CountBreaker({
    threshold: 0.2,
    size: 100,
    minimumNumberOfCalls: 50, // require 50 requests before we can break
  }),
});
```

#### `SamplingBreaker`

The `SamplingBreaker` breaks after a proportion of requests over a time period fail.

```js
// Break if more than 20% of requests fail in a 30 second time window:
const breaker = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new SamplingBreaker({ threshold: 0.2, duration: 30 * 1000 }),
});
```

You can specify a minimum requests-per-second value to use to avoid opening the circuit under periods of low load. By default we'll choose a value such that you need 5 failures per second for the breaker to kick in, and you can configure this if it doesn't work for you:

```js
const breaker = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new SamplingBreaker({
    threshold: 0.2,
    duration: 30 * 1000,
    minimumRps: 10, // require 10 requests per second before we can break
  }),
});
```

### `breaker.execute(fn[, signal])`

Executes the function. May throw a `BrokenCircuitError` if the circuit is open. If a half-open test is currently running and it succeeds, the circuit breaker will check the abort signal (possibly throwing a `TaskCancelledError`) before continuing to run the inner function.

Otherwise, it calls the inner function and returns what it returns, or throws what it throws.

Like all `Policy.execute` methods, any propagated `{ signal: AbortSignal }` will be given as the first argument to `fn`.

```ts
const response = await breaker.execute(() => getJson('https://example.com'));
```

### `breaker.state`

The current state of the circuit breaker, allowing for introspection.

```js
import { CircuitState } from 'cockatiel';

if (breaker.state === CircuitState.Open) {
  console.log('the circuit is open right now');
}
```

### `breaker.onBreak(callback)`

An [event emitter](#events) that fires when the circuit opens as a result of failures. Returns a disposable instance.

```js
const listener = breaker.onBreak(() => console.log('circuit is open'));

listener.dispose();
```

### `breaker.onReset(callback)`

An [event emitter](#events) that fires when the circuit closes after being broken. Returns a disposable instance.

```js
const listener = breaker.onReset(() => console.log('circuit is closed'));

listener.dispose();
```

### `breaker.onHalfOpen(callback)`

An [event emitter](#events) when the circuit breaker is half open (running a test call). Either `onBreak` on `onReset` will subsequently fire.

```js
const listener = breaker.onHalfOpen(() => console.log('circuit is testing a request'));

listener.dispose();
```

### `breaker.onStateChange(callback)`

An [event emitter](#events) that fires whenever the circuit state changes in general, after the more specific `onReset`, `onHalfOpen`, `onBreak` emitters fires.

```js
import { CircuitState } from 'cockatiel';

const listener = breaker.onStateChange(state => {
  if (state === CircuitState.Closed) {
    console.log('circuit breaker is once again closed');
  }
});

listener.dispose();
```

### `breaker.onSuccess(callback)`

An [event emitter](#events) that fires whenever a function is successfully called. It's invoked with an object containing the duration in milliseconds to nanosecond precision.

```js
const listener = breaker.onSuccess(({ duration }) => {
  console.log(`circuit breaker call ran in ${duration}ms`);
});

// later:
listener.dispose();
```

### `breaker.onFailure(callback)`

An [event emitter](#events) that fires whenever a function throw an error or returns an errorful result. It's invoked with the duration of the call, the reason for the failure, and an boolean indicating whether the error is handled by the policy.

```js
const listener = breaker.onFailure(({ duration, handled, reason }) => {
  console.log(`circuit breaker call ran in ${duration}ms and failed with`, reason);
  console.log(handled ? 'error was handled' : 'error was not handled');
});

// later:
listener.dispose();
```

### `breaker.isolate()`

Manually holds the circuit open, until the returned disposable is disposed of. While held open, the circuit will throw `IsolatedCircuitError`, a type of `BrokenCircuitError`, on attempted executions. It's safe to have multiple `isolate()` calls; we'll refcount them behind the scenes.

```js
const handle = breaker.isolate();

// later, allow calls again:
handle.dispose();
```

### `breaker.toJSON()`

Returns the circuit breaker state so that it can be re-created later. This is useful in cases like serverless functions where you may want to keep the breaker state across multiple executions.

```js
const breakerState = breaker.toJSON();

// ...in a later execution

const breaker = circuitBreaker(policy, {
  halfOpenAfter: 1000,
  breaker: new ConsecutiveBreaker(3),
  initialState: breakerState,
});
```

Note that if the breaker is currently half open, the serialized state will record it in such a way that it's open when restored and will use the first call as the half-open test.

## `timeout(duration, strategy)`

Creates a timeout policy. The duration specifies how long to wait before timing out `execute()`'d functions. The strategy for timeouts, "Cooperative" or "Aggressive". An [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) will be pass to any executed function, and in cooperative timeouts we'll simply wait for that function to return or throw. In aggressive timeouts, we'll immediately throw a TaskCancelledError when the timeout is reached, in addition to marking the passed token as failed.

```js
import { TimeoutStrategy, timeout, TaskCancelledError } from 'cockatiel';

const timeout = timeout(2000, TimeoutStrategy.Cooperative);

export async function handleRequest() {
  try {
    return await timeout.execute(signal => getInfoFromDatabase(signal));
  } catch (e) {
    if (e instanceof TaskCancelledError) {
      return 'database timed out';
    } else {
      throw e;
    }
  }
}
```

### `timeout.dangerouslyUnref()`

When timing out, a referenced timer is created. This means the Node.js event loop is kept active while we're waiting for the timeout, as long as the function hasn't returned. Calling this method on the timeout builder will unreference the timer, allowing the process to exit even if a timeout might still be happening.

### `timeout.execute(fn[, signal])`

Executes the given function as configured in the policy. An [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) will be pass to the function, which it should use for aborting operations as needed. If cancellation is requested on the parent abort signal provided as the second argument to `execute()`, the cancellation will be propagated.

```ts
await timeout.execute(({ signal }) => getInfoFromDatabase(signal));
```

### `timeout.onTimeout(callback)`

An [event emitter](#events) that fires when a timeout is reached. Useful for telemetry. Returns a disposable instance.

In the "aggressive" timeout strategy, a timeout event will immediately preceed a failure event and promise rejection. In the cooperative timeout strategy, the timeout event is still emitted, _but_ the success or failure is determined by what the executed function throws or returns.

```ts
const listener = timeout.onTimeout(() => console.log('timeout was reached'));

listener.dispose();
```

### `timeout.onSuccess(callback)`

An [event emitter](#events) that fires whenever a function is successfully called. It's invoked with an object containing the duration in milliseconds to nanosecond precision.

```js
const listener = timeout.onSuccess(({ duration }) => {
  console.log(`timeout call ran in ${duration}ms`);
});

// later:
listener.dispose();
```

### `timeout.onFailure(callback)`

An [event emitter](#events) that fires whenever a function throw an error or returns an errorful result. It's invoked with the duration of the call, the reason for the failure, and an boolean indicating whether the error is handled by the policy.

This is _only_ called when the function itself fails, and not when a timeout happens.

```js
const listener = timeout.onFailure(({ duration, handled, reason }) => {
  console.log(`timeout call ran in ${duration}ms and failed with`, reason);
  console.log(handled ? 'error was handled' : 'error was not handled');
});

// later:
listener.dispose();
```

## `bulkhead(limit[, queue])`

A Bulkhead is a simple structure that limits the number of concurrent calls. Attempting to exceed the capacity will cause `execute()` to throw a `BulkheadRejectedError`.

```js
import { bulkhead } from 'cockatiel';

const bulkhead = bulkhead(12); // limit to 12 concurrent calls

export async function handleRequest() {
  try {
    return await bulkhead.execute(() => getInfoFromDatabase());
  } catch (e) {
    if (e instanceof BulkheadRejectedError) {
      return 'too much load, try again later';
    } else {
      throw e;
    }
  }
}
```

You can optionally pass a second parameter to `bulkhead()`, which will allow for events to be queued instead of rejected after capacity is exceeded. Once again, if this queue fills up, a `BulkheadRejectedError` will be thrown.

```js
const bulkhead = bulkhead(12, 4); // limit to 12 concurrent calls, with 4 queued up
```

### `bulkhead.execute(fn[, signal])`

Depending on the bulkhead state, either:

- Executes the function immediately and returns its results;
- Queues the function for execution and returns its results when it runs, or;
- Throws a `BulkheadRejectedError` if the configured concurrency and queue limits have been execeeded.

The abort signal is checked (possibly resulting in a TaskCancelledError) when the function is first submitted to the bulkhead, and when it dequeues.

Like all `Policy.execute` methods, any propagated `{ signal: AbortSignal }` will be given as the first argument to `fn`.

```js
const data = await bulkhead.execute(({ signal }) => getInfoFromDatabase(signal));
```

### `bulkhead.onReject(callback)`

An [event emitter](#events) that fires when a call is rejected. Useful for telemetry. Returns a disposable instance.

```js
const listener = bulkhead.onReject(() => console.log('bulkhead call was rejected'));

listener.dispose();
```

### `bulkhead.onSuccess(callback)`

An [event emitter](#events) that fires whenever a function is successfully called. It's invoked with an object containing the duration in milliseconds to nanosecond precision.

```js
const listener = bulkhead.onSuccess(({ duration }) => {
  console.log(`bulkhead call ran in ${duration}ms`);
});

// later:
listener.dispose();
```

### `bulkhead.onFailure(callback)`

An [event emitter](#events) that fires whenever a function throw an error or returns an errorful result. It's invoked with the duration of the call, the reason for the failure, and an boolean indicating whether the error is handled by the policy.

This is _only_ called when the function itself fails, and not when a bulkhead rejection occurs.

```js
const listener = bulkhead.onFailure(({ duration, handled, reason }) => {
  console.log(`bulkhead call ran in ${duration}ms and failed with`, reason);
  console.log(handled ? 'error was handled' : 'error was not handled');
});

// later:
listener.dispose();
```

### `bulkhead.executionSlots`

Returns the number of execution slots left in the bulkhead. If either this or `bulkhead.queueSlots` is greater than zero, the `execute()` will not throw a `BulkheadRejectedError`.

### `bulkhead.queueSlots`

Returns the number of queue slots left in the bulkhead. If either this or `bulkhead.executionSlots` is greater than zero, the `execute()` will not throw a `BulkheadRejectedError`.

## `fallback(policy, valueOrFactory)`

Creates a policy that returns the `valueOrFactory` if an executed function fails. As the name suggests, `valueOrFactory` either be a value, or a function we'll call when a failure happens to create a value.

```js
import { handleType, fallback } from 'cockatiel';

const fallback = fallback(handleType(DatabaseError), () => getStaleData());

export function handleRequest() {
  return fallback.execute(() => getInfoFromDatabase());
}
```

### `fallback.execute(fn[, signal])`

Executes the given function. Any _handled_ error or errorful value will be eaten, and instead the fallback value will be returned.

Like all `Policy.execute` methods, any propagated `{ signal: AbortSignal }` will be given as the first argument to `fn`.

```js
const result = await fallback.execute(() => getInfoFromDatabase());
```

### `fallback.onSuccess(callback)`

An [event emitter](#events) that fires whenever a function is successfully called. It's invoked with an object containing the duration in milliseconds to nanosecond precision.

```js
const listener = fallback.onSuccess(({ duration }) => {
  console.log(`fallback call ran in ${duration}ms`);
});

// later:
listener.dispose();
```

### `fallback.onFailure(callback)`

An [event emitter](#events) that fires whenever a function throw an error or returns an errorful result. It's invoked with the duration of the call, the reason for the failure, and an boolean indicating whether the error is handled by the policy.

If the error was handled, the fallback will kick in.

```js
const listener = fallback.onFailure(({ duration, handled, reason }) => {
  console.log(`fallback call ran in ${duration}ms and failed with`, reason);
  console.log(handled ? 'error was handled' : 'error was not handled');
});

// later:
listener.dispose();
```

## See Also

- [App-vNext/Polly](https://github.com/App-vNext/Polly): the original, .NET implementation of Polly
- [polly-js](https://github.com/mauricedb/polly-js): a similar package with a subset of .NET Polly/Cockatiel functionality
