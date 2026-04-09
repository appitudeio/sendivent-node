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

  constructor(private readonly raw: Record<string, unknown>) {
    this.id = raw.id as string;
    this.event = raw.event as string;
    this.status = raw.status as string;
    this.error = raw.error as string | undefined;
  }

  static from(data: Record<string, unknown>): SendResponse {
    return new SendResponse(data);
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
