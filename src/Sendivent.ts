import type { Contact } from './types';
import { SendResponse } from './types';
import { Contacts } from './Contacts';
import { SendiventError } from './errors';
import { DEFAULT_TIMEOUT_MS, request } from './http';
import { USER_AGENT } from './version';

export interface SendiventOptions {
  /** Abort the request after this many milliseconds (default: 30000) */
  timeoutMs?: number;
}

export class Sendivent {
  private static readonly API_URLS = {
    sandbox: 'https://api-sandbox.sendivent.com',
    production: 'https://api.sendivent.com'
  } as const;

  private baseUrl: string;
  private apiKey: string;
  private _event?: string;
  private _to?: string | Contact | Array<string | Contact>;
  private _from?: string | Contact;
  private _payload: Record<string, unknown> = {};
  private _channel?: string;
  private _language?: string;
  private _overrides: Record<string, unknown> = {};
  private _idempotencyKey?: string;
  private _contacts?: Contacts;
  private timeoutMs: number;

  constructor(apiKey: string, options: SendiventOptions = {}) {
    if (!apiKey.match(/^(test_|live_)/)) {
      throw new SendiventError("API key must start with 'test_' or 'live_'");
    }

    this.apiKey = apiKey;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.baseUrl = apiKey.startsWith('live_')
      ? Sendivent.API_URLS.production
      : Sendivent.API_URLS.sandbox;
  }

  /**
   * Access the Contacts API for managing contacts and push tokens
   */
  get contacts(): Contacts {
    if (!this._contacts) {
      this._contacts = new Contacts(this.baseUrl, this.apiKey, this.timeoutMs);
    }
    return this._contacts;
  }

  event(event: string): this {
    this._event = event;
    return this;
  }

  to(recipient: string | Contact | Array<string | Contact>): this {
    this._to = recipient;
    return this;
  }

  from(sender: string | Contact): this {
    this._from = sender;
    return this;
  }

  payload(data: Record<string, unknown>): this {
    this._payload = data;
    return this;
  }

  channel(channel: string): this {
    this._channel = channel;
    return this;
  }

  language(language: string): this {
    this._language = language;
    return this;
  }

  overrides(overrides: Record<string, unknown>): this {
    this._overrides = { ...this._overrides, ...overrides };
    return this;
  }

  idempotencyKey(key: string): this {
    this._idempotencyKey = key;
    return this;
  }

  /**
   * Send the notification.
   *
   * @throws SendiventApiError       The API answered with a non-2xx status
   * @throws SendiventTransportError The request never reached the API
   */
  async send(): Promise<SendResponse> {
    if (!this._event) {
      throw new SendiventError('Event name must be set using event() method');
    }

    let endpoint = `v1/send/${this._event}`;
    if (this._channel) {
      endpoint += `/${this._channel}`;
    }

    const body: Record<string, unknown> = {
      payload: this._payload,
    };

    if (this._to !== undefined) {
      body.to = this._to;
    }

    if (this._from !== undefined) {
      body.from = this._from;
    }

    if (this._language) {
      body.language = this._language;
    }

    if (Object.keys(this._overrides).length > 0) {
      body.overrides = this._overrides;
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };

    if (this._idempotencyKey) {
      headers['X-Idempotency-Key'] = this._idempotencyKey;
    }

    const { data } = await request({
      method: 'POST',
      url: `${this.baseUrl}/${endpoint}`,
      headers,
      body: JSON.stringify(body),
      timeoutMs: this.timeoutMs,
    });

    return SendResponse.from(data);
  }
}
