/**
 * Type definitions for Sendivent SDK
 */

/**
 * Supported notification channels
 */
export type Channel = 'email' | 'sms' | 'slack';

/**
 * Contact object with identifier fields
 */
export interface Contact {
  email?: string;
  phone?: string;
  name?: string;
  external_id?: string;
  avatar?: string;
  meta?: {
    timezone?: string;
    locale?: string;
    preferences?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Response from Sendivent API
 */
export interface SendResponse {
  success: boolean;
  data?: Array<Record<string, string>>;
  error?: string;
  message?: string;
}

/**
 * Options for event requests
 */
export interface SendEventOptions {
  to?: string | Contact | Array<string | Contact>;
  payload?: Record<string, unknown>;
  channel?: Channel;
  language?: string;
  overrides?: Record<string, unknown>;
  idempotencyKey?: string;
}
