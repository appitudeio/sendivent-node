import type { Contact } from './types';
import { SendResponse } from './types';

export class Sendivent {
  private baseUrl: string;
  private apiKey: string;
  private _event?: string;
  private _to?: string | Contact | Array<string | Contact>;
  private _payload: Record<string, unknown> = {};
  private _channel?: string;
  private _language?: string;
  private _overrides: Record<string, unknown> = {};
  private _idempotencyKey?: string;

  constructor(apiKey: string) {
    if (!apiKey.match(/^(test_|live_)/)) {
      throw new Error("API key must start with 'test_' or 'live_'");
    }

    this.apiKey = apiKey;
    this.baseUrl = apiKey.startsWith('live_')
      ? 'https://api.sendivent.com'
      : 'https://api-sandbox.sendivent.com';
  }

  event(event: string): this {
    this._event = event;
    return this;
  }

  to(recipient: string | Contact | Array<string | Contact>): this {
    this._to = recipient;
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

  async send(): Promise<SendResponse> {
    if (!this._event) {
      throw new Error('Event name must be set using event() method');
    }

    let endpoint = `send/${this._event}`;
    if (this._channel) {
      endpoint += `/${this._channel}`;
    }

    const body: Record<string, unknown> = {
      payload: this._payload,
    };

    if (this._to !== undefined) {
      body.to = this._to;
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
      'User-Agent': 'Sendivent-Node/1.0',
    };

    if (this._idempotencyKey) {
      headers['X-Idempotency-Key'] = this._idempotencyKey;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Sendivent API request failed: ${response.status} - ${
            data.error || data.message || 'Unknown error'
          }`
        );
      }

      return SendResponse.from(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Sendivent API request failed: ${error.message}`);
      }
      throw error;
    }
  }
}
