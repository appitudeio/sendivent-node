/**
 * Response from Sendivent API
 */
export interface SendResponse {
  success: boolean;
  data?: Array<Record<string, string>>;
  error?: string;
  message?: string;
}
