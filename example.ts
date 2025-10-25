/**
 * Sendivent Node.js/TypeScript SDK - Comprehensive Example
 *
 * This file demonstrates all SDK features with inline comments.
 * Replace 'test_your_api_key_here' with your actual API key to run.
 */

import { Sendivent, Contact, SendResponse } from '@sendivent/sdk';

// ============================================================================
// BASIC USAGE
// ============================================================================

// Initialize with your API key and event name
// API key prefix determines environment: test_* = sandbox, live_* = production
const sendivent = new Sendivent('test_your_api_key_here', 'welcome');

// Simple send to an email address
await sendivent
  .to('user@example.com')
  .payload({ name: 'John Doe', company: 'Acme Corp' })
  .send();

// ============================================================================
// RESPONSE HANDLING
// ============================================================================

// The send() method returns a SendResponse object with helper methods
const response: SendResponse = await sendivent
  .to('user@example.com')
  .payload({ name: 'Jane' })
  .send();

// Check success/error using helper methods
if (response.isSuccess()) {
  console.log('✓ Notification sent successfully!');
  console.log('Queue IDs:', response.data);
} else {
  console.error('✗ Error:', response.error);
}

// Access response properties directly
console.log('Success:', response.success);
console.log('Message:', response.message);

// Convert to object or JSON
const responseObject = response.toObject();
const responseJson = response.toJson();

// ============================================================================
// FIRE-AND-FORGET
// ============================================================================

// For background sending without waiting for the response
sendivent
  .to('user@example.com')
  .payload({ name: 'Background User' })
  .send()
  .catch(err => console.error('Background send failed:', err));

// Continue with other work immediately...
console.log('Async send initiated, continuing with other work...');

// ============================================================================
// CONTACT OBJECTS
// ============================================================================

// The 'id' field represents your application's user ID - pass your user objects directly!
// Sendivent will map this to internal identifiers for template usage
const contact: Contact = {
  id: 'user-12345',              // Your application's user ID
  email: 'user@example.com',
  phone: '+1234567890',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  meta: {
    tier: 'premium',
    department: 'Engineering',
    timezone: 'America/New_York'
  }
};

await sendivent
  .to(contact)
  .payload({ welcome_message: 'Welcome to our platform!' })
  .send();

// ============================================================================
// MULTIPLE RECIPIENTS
// ============================================================================

// Send to multiple recipients in one call
await sendivent
  .to([
    'user1@example.com',
    'user2@example.com',
    { id: 'user-456', email: 'user3@example.com', name: 'User Three' }
  ])
  .payload({ subject: 'Monthly Newsletter', content: '...' })
  .send();

// ============================================================================
// CHANNEL-SPECIFIC SENDING
// ============================================================================

// Force a specific channel (email, sms, slack, push)
const emailNotification = new Sendivent('test_your_api_key_here', 'password-reset');
await emailNotification
  .channel('email')
  .to('user@example.com')
  .payload({ reset_link: 'https://example.com/reset/abc123' })
  .send();

// SMS example
const smsNotification = new Sendivent('test_your_api_key_here', 'verification-code');
await smsNotification
  .channel('sms')
  .to('+1234567890')
  .payload({ code: '123456' })
  .send();

// ============================================================================
// TEMPLATE OVERRIDES
// ============================================================================

// Override template defaults like subject, sender, etc.
const invoiceNotification = new Sendivent('test_your_api_key_here', 'invoice');
await invoiceNotification
  .to('user@example.com')
  .payload({ amount: 100, invoice_id: 'INV-001' })
  .overrides({
    subject: 'Your Custom Invoice Subject',
    from_email: 'billing@company.com',
    from_name: 'Billing Department',
    reply_to: 'support@company.com'
  })
  .send();

// ============================================================================
// IDEMPOTENCY
// ============================================================================

// Prevent duplicate sends using idempotency keys
// Sending multiple times with the same key returns cached response without re-sending
const orderConfirmation = new Sendivent('test_your_api_key_here', 'order-confirmation');
await orderConfirmation
  .to('user@example.com')
  .payload({ order_id: '12345', total: 99.99 })
  .idempotencyKey('order-12345-confirmation')
  .send();

// Sending again with same key won't send duplicate notification
await orderConfirmation
  .to('user@example.com')
  .payload({ order_id: '12345', total: 99.99 })
  .idempotencyKey('order-12345-confirmation')
  .send(); // Returns cached response

// ============================================================================
// LANGUAGE SELECTION
// ============================================================================

// Send notifications in different languages
const welcomeSwedish = new Sendivent('test_your_api_key_here', 'welcome');
await welcomeSwedish
  .to('user@example.com')
  .payload({ name: 'Anders' })
  .language('sv')  // Swedish
  .send();

// ============================================================================
// BROADCAST EVENTS
// ============================================================================

// Send to configured event listeners without specifying recipients
const systemAlert = new Sendivent('test_your_api_key_here', 'system-alert');
await systemAlert
  .payload({
    severity: 'high',
    message: 'Database backup completed successfully',
    timestamp: new Date().toISOString()
  })
  .send();

// ============================================================================
// ERROR HANDLING
// ============================================================================

try {
  // Invalid API key format will throw Error
  const invalidClient = new Sendivent('invalid_key', 'test-event');
} catch (error) {
  if (error instanceof Error) {
    console.error('Invalid API key format:', error.message);
  }
}

try {
  const testClient = new Sendivent('test_your_api_key_here', 'test-event');

  const testResponse = await testClient
    .to('user@example.com')
    .payload({ test: 'data' })
    .send();

  // Always check response success
  if (testResponse.hasError()) {
    console.error('Error occurred:', testResponse.error);
  }

} catch (error) {
  // API request failures throw Error
  if (error instanceof Error) {
    console.error('API error:', error.message);
  }
}
