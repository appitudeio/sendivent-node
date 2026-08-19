/**
 * Contact object for identifying recipients
 *
 * Channel identifiers (email, phone, slack_id, etc.) are used to route messages.
 * You can include multiple identifiers - backend will use the appropriate one per channel.
 */
export interface Contact {
  id?: string;              // Your application's user ID
  name?: string;            // Display name
  avatar?: string;          // Avatar URL
  email?: string;           // Email address
  phone?: string;           // Phone number
  slack_id?: string;        // Slack user ID
  meta?: Record<string, unknown>;  // Custom metadata
  [key: string]: unknown;   // Extensibility for future channel identifiers
}

/**
 * Data for creating or updating a contact
 */
export interface ContactData {
  id?: string;              // Your application's user ID (maps to external_id)
  name?: string;            // Display name
  avatar?: string;          // Avatar URL
  email?: string;           // Email address
  phone?: string;           // Phone number
  slack_id?: string;        // Slack user ID
  push_token?: string;      // Single push token (convenience alias)
  push_tokens?: string[];   // Multiple push tokens
  meta?: Record<string, unknown>;  // Custom metadata
  [key: string]: unknown;   // Extensibility
}

/**
 * Response from Contacts API
 */
export interface ContactResponse {
  success: boolean;
  contact: Contact;
}

/**
 * Response from Sendivent API
 *
 * Unified response format: { id, event, status }
 * The id is a notification tracking UUID.
 * Query status via GET /v1/notifications/{id}
 */
export class SendResponse {
  /** Notification ID (sequence run UUID) */
  readonly id: string;
  /** Event identifier that was triggered */
  readonly event: string;
  /** Status: "accepted" means the notification is being processed */
  readonly status: string;
  readonly error?: string;

  constructor(private readonly raw: Record<string, unknown> = {}) {
    this.id = typeof raw.id === 'string' ? raw.id : '';
    this.event = typeof raw.event === 'string' ? raw.event : '';
    this.status = typeof raw.status === 'string' ? raw.status : '';
    this.error = typeof raw.error === 'string' ? raw.error : undefined;
  }

  /**
   * Build a response object from a decoded body.
   *
   * Tolerates undefined and partial bodies on purpose: by the time we get here
   * the server has already accepted the notification, so parsing must never
   * turn a successful send into a thrown error for the caller.
   */
  static from(data?: Record<string, unknown> | null): SendResponse {
    return new SendResponse(data ?? {});
  }

  isSuccess(): boolean {
    return this.status === 'accepted';
  }

  hasError(): boolean {
    return this.error !== undefined;
  }

  toJson(): string {
    return JSON.stringify(this.toObject());
  }

  toObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = { id: this.id, event: this.event, status: this.status };
    if (this.error !== undefined) obj.error = this.error;
    return obj;
  }
}
