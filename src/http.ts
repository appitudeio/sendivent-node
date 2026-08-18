import { SendiventApiError, SendiventTransportError } from './errors';

export const DEFAULT_TIMEOUT_MS = 30_000;

export interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeoutMs: number;
}

export interface HttpResult {
  status: number;
  /** Raw response body */
  body: string;
  /** Decoded body, or undefined when it wasn't a JSON object */
  data?: Record<string, unknown>;
}

/** Narrow an unknown value to a plain object, or undefined */
export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Parse JSON without throwing — an unparseable body is simply `undefined` */
function parseJson(text: string): unknown {
  if (text === '') {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function apiError(status: number, body: string, data?: Record<string, unknown>): SendiventApiError {
  let code = typeof data?.code === 'string' ? data.code : undefined;
  let detail: unknown = data?.error ?? data?.message;

  // The API also uses the nested shape { error: { code, message } }
  const nested = asRecord(detail);
  if (nested) {
    code = code ?? (typeof nested.code === 'string' ? nested.code : undefined);
    detail = nested.message;
  }

  const message = typeof detail === 'string' && detail !== '' ? detail : 'Unknown error';

  return new SendiventApiError(`Sendivent API error (HTTP ${status}): ${message}`, status, code, body);
}

/**
 * Perform a request and decode the response.
 *
 * The body is read as text before any parsing is attempted, so a proxy's HTML
 * error page or an empty body surfaces as the real HTTP status rather than as a
 * confusing JSON syntax error. A 2xx with an unparseable body resolves with
 * `data: undefined` — never throws — because the server already accepted the
 * request and parsing must not undo that for the caller.
 */
export async function request(options: HttpRequest): Promise<HttpResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: Response;
  try {
    response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });
  } catch (error) {
    throw controller.signal.aborted
      ? new SendiventTransportError(
          `Sendivent API request timed out after ${options.timeoutMs}ms`,
          error,
        )
      : new SendiventTransportError(
          `Sendivent API request failed: ${error instanceof Error ? error.message : String(error)}`,
          error,
        );
  } finally {
    clearTimeout(timer);
  }

  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }

  const data = asRecord(parseJson(body));

  if (!response.ok) {
    throw apiError(response.status, body, data);
  }

  return { status: response.status, body, data };
}
