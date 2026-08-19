/**
 * Base class for every error thrown by the SDK.
 *
 * Extends Error, so existing `catch (e) { e.message }` handling keeps working.
 */
export class SendiventError extends Error {
  /** The underlying error, when this one wraps another */
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SendiventError';
    this.cause = cause;
  }
}

/**
 * The API answered with a non-2xx status.
 *
 * Carries the status code and the API's error code so callers can branch on
 * `status` (401 = bad key, 402 = quota exhausted, 422 = bad payload) instead of
 * pattern-matching an error message.
 */
export class SendiventApiError extends SendiventError {
  constructor(
    message: string,
    /** HTTP status code */
    public readonly status: number,
    /** Machine-readable error code from the API, when it supplied one */
    public readonly code?: string,
    /** Raw response body, for logging */
    public readonly body: string = '',
  ) {
    super(message);
    this.name = 'SendiventApiError';
  }
}

/**
 * The request never produced an HTTP response — DNS failure, refused
 * connection, TLS error or timeout.
 *
 * The notification may or may not have reached Sendivent; retry with an
 * idempotency key if you need certainty.
 */
export class SendiventTransportError extends SendiventError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'SendiventTransportError';
  }
}
