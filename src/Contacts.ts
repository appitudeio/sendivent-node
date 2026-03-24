import type { Contact, ContactData, ContactResponse } from './types';

export class Contacts {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
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

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Sendivent-Node/1.0',
    };

    const options: RequestInit = { method, headers };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}/${path.replace(/^\//, '')}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Sendivent API request failed: ${response.status} - ${
          (data as Record<string, string>).error || (data as Record<string, string>).message || 'Unknown error'
        }`
      );
    }

    return data as T;
  }
}
