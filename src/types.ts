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
 */
export class SendResponse {
  constructor(
    public readonly success: boolean,
    public readonly data?: Array<Record<string, string | boolean>>,
    public readonly error?: string,
    public readonly message?: string
  ) {}

  static from(data: any): SendResponse {
    return new SendResponse(
      data.success,
      data.deliveries,
      data.error,
      data.message
    );
  }

  isSuccess(): boolean {
    return this.success;
  }

  hasError(): boolean {
    return this.error !== undefined;
  }

  toJson(): string {
    return JSON.stringify(this);
  }

  toObject(): Record<string, any> {
    const obj: Record<string, any> = { success: this.success };
    if (this.data !== undefined) obj.data = this.data;
    if (this.error !== undefined) obj.error = this.error;
    if (this.message !== undefined) obj.message = this.message;
    return obj;
  }
}
