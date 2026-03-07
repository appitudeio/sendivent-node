/**
 * Contact object for identifying recipients
 *
 * Channel identifiers (email, phone, slack, etc.) are used to route messages.
 * You can include multiple identifiers - backend will use the appropriate one per channel.
 */
export interface Contact {
  id?: string;              // Your application's user ID
  name?: string;            // Display name
  avatar?: string;          // Avatar URL
  email?: string;           // Email address
  phone?: string;           // Phone number
  slack?: string;           // Slack user ID
  meta?: Record<string, unknown>;  // Custom metadata
  [key: string]: unknown;   // Extensibility for future channel identifiers
}

/**
 * Response from Sendivent API
 *
 * Passes through the raw API response without reshaping.
 */
export class SendResponse {
  readonly success: boolean;
  readonly deliveries?: Array<Record<string, string>>;
  readonly error?: string;

  constructor(private readonly raw: Record<string, unknown>) {
    this.success = raw.success as boolean;
    this.deliveries = raw.deliveries as Array<Record<string, string>> | undefined;
    this.error = raw.error as string | undefined;
  }

  static from(data: Record<string, unknown>): SendResponse {
    return new SendResponse(data);
  }

  isSuccess(): boolean {
    return this.success;
  }

  hasError(): boolean {
    return this.error !== undefined;
  }

  toJson(): string {
    return JSON.stringify(this.raw);
  }

  toObject(): Record<string, unknown> {
    return this.raw;
  }
}
