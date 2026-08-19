import type { Contact, ContactData, ContactResponse } from './types';
import { DEFAULT_TIMEOUT_MS, request } from './http';
import { USER_AGENT } from './version';

export class Contacts {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(baseUrl: string, apiKey: string, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Get a contact by any identifier (email, phone, UUID, external_id, slack)
   */
  async get(identifier: string): Promise<ContactResponse> {
    return this.request('GET', `/v1/contacts/${encodeURIComponent(identifier)}`);
  }

  /**
   * Create or update a contact
   * Resolves by any identifier in the data (id, email, phone, etc.)
   * If contact exists, merges the data. If not, creates a new contact.
   */
  async upsert(data: ContactData): Promise<ContactResponse> {
    return this.request('POST', '/v1/contacts', data);
  }

  /**
   * Update an existing contact (404 if not found)
   */
  async update(identifier: string, data: Partial<ContactData>): Promise<ContactResponse> {
    return this.request('PATCH', `/v1/contacts/${encodeURIComponent(identifier)}`, data);
  }

  /**
   * Delete a contact (hard delete for GDPR compliance)
   */
  async delete(identifier: string): Promise<{ success: boolean }> {
    return this.request('DELETE', `/v1/contacts/${encodeURIComponent(identifier)}`);
  }

  /**
   * Register a push token on a contact (additive — doesn't remove other tokens)
   * Call this from your mobile app on startup to register the device.
   */
  async registerPushToken(identifier: string, token: string): Promise<ContactResponse> {
    return this.request('POST', `/v1/contacts/${encodeURIComponent(identifier)}/push-tokens`, { token });
  }

  /**
   * Remove a push token from a contact (e.g., on user logout)
   */
  async removePushToken(identifier: string, token: string): Promise<ContactResponse> {
    return this.request('DELETE', `/v1/contacts/${encodeURIComponent(identifier)}/push-tokens`, { token });
  }

  /**
   * @throws SendiventApiError       The API answered with a non-2xx status
   * @throws SendiventTransportError The request never reached the API
   */
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };

    const { data } = await request({
      method,
      url: `${this.baseUrl}/${path.replace(/^\//, '')}`,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      timeoutMs: this.timeoutMs,
    });

    return (data ?? {}) as T;
  }
}
