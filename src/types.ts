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
export interface SendResponse {
  success: boolean;
  data?: Array<Record<string, string | boolean>>;  // [{ "email": "uuid" }, { "listener": true }]
  error?: string;
  message?: string;
}
