/**
 * Sendivent Node.js/TypeScript SDK - Comprehensive Example
 *
 * This file demonstrates all SDK features with practical, working examples.
 * Replace 'test_your_api_key_here' with your actual API key to run.
 */

import { Sendivent, Contact, SendResponse } from '@sendivent/sdk';

// ============================================================================
// BASIC USAGE
// ============================================================================

// The SDK is per-event: create one instance per event type
// Constructor: new Sendivent(apiKey, eventName)
// API key prefix determines environment: test_* = sandbox, live_* = production

const welcome = new Sendivent('test_your_api_key_here', 'welcome');

// Simple send to an email address
await welcome
  .to('user@example.com')
  .payload({ name: 'John Doe', company: 'Acme Corp' })
  .send();

// ============================================================================
// RESPONSE HANDLING
// ============================================================================

// The send() method returns a Promise<SendResponse> with helper methods
const response: SendResponse = await welcome
  .to('jane@example.com')
  .payload({ name: 'Jane Smith' })
  .send();

// Check success/error using helper methods
if (response.isSuccess()) {
  console.log('✓ Notification sent successfully!');
  console.log('Queue IDs:', response.data);
} else {
  console.error('✗ Error:', response.error);
}

// Access response properties directly (all readonly)
console.log('Success:', response.success);
console.log('Message:', response.message);

// Convert to object or JSON
const responseObject = response.toObject();
const responseJson = response.toJson();

// ============================================================================
// FIRE-AND-FORGET
// ============================================================================

// For background sending without waiting for the response
// Just don't await the promise - it will resolve in background
welcome
  .to('background@example.com')
  .payload({ name: 'Background User' })
  .send()
  .catch(err => console.error('Background send failed:', err));

// Continue with other work immediately...
console.log('Async send initiated, continuing with other work...');

// ============================================================================
// CONTACT OBJECTS
// ============================================================================

// The 'id' field represents your application's user ID
// You can pass your existing user objects directly - Sendivent maps them internally
const contact: Contact = {
  id: 'user-12345',              // Your application's user ID
  email: 'user@example.com',
  phone: '+1234567890',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  meta: {
    tier: 'premium',
    department: 'Engineering'
  }
};

await welcome
  .to(contact)
  .payload({ message: 'Welcome to our platform!' })
  .send();

// ============================================================================
// MULTIPLE RECIPIENTS
// ============================================================================

// Send to multiple recipients in one call
// Mix strings and contact objects in an array
const newsletter = new Sendivent('test_your_api_key_here', 'newsletter');

await newsletter
  .to([
    'user1@example.com',
    'user2@example.com',
    { id: 'user-456', email: 'user3@example.com', name: 'User Three' }
  ])
  .payload({ subject: 'Monthly Newsletter', edition: 'May 2024' })
  .send();

// ============================================================================
// CHANNEL-SPECIFIC SENDING
// ============================================================================

// Force a specific channel (email, sms, slack, push)
// Useful when you want to override the default channel selection

const passwordReset = new Sendivent('test_your_api_key_here', 'password-reset');
await passwordReset
  .channel('email')
  .to('user@example.com')
  .payload({ reset_link: 'https://example.com/reset/abc123' })
  .send();

// SMS example
const verification = new Sendivent('test_your_api_key_here', 'verification-code');
await verification
  .channel('sms')
  .to('+1234567890')
  .payload({ code: '123456' })
  .send();

// ============================================================================
// TEMPLATE OVERRIDES
// ============================================================================

// Override template defaults like subject, sender, etc. on a per-request basis
const invoice = new Sendivent('test_your_api_key_here', 'invoice');

await invoice
  .to('customer@example.com')
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
// The API caches responses for 24 hours based on the key
const orderConfirmation = new Sendivent('test_your_api_key_here', 'order-confirmation');

await orderConfirmation
  .to('customer@example.com')
  .payload({ order_id: '12345', total: 99.99 })
  .idempotencyKey('order-12345-confirmation')
  .send();

// Sending again with same key returns cached response without re-sending
await orderConfirmation
  .to('customer@example.com')
  .payload({ order_id: '12345', total: 99.99 })
  .idempotencyKey('order-12345-confirmation')
  .send(); // Returns cached response, no duplicate sent

// ============================================================================
// LANGUAGE SELECTION
// ============================================================================

// Send notifications in different languages (if your templates support it)
await welcome
  .to('user@example.com')
  .payload({ name: 'Anders Andersson' })
  .language('sv')  // Swedish
  .send();

// ============================================================================
// BROADCAST EVENTS
// ============================================================================

// Send to configured event listeners without specifying recipients
// The 'to' parameter is optional - omit it to broadcast to event subscribers
const systemAlert = new Sendivent('test_your_api_key_here', 'system-alert');

await systemAlert
  .payload({
    severity: 'high',
    message: 'Database backup completed successfully',
    timestamp: new Date().toISOString()
  })
  .send(); // Note: no .to() call

// ============================================================================
// MULTIPLE EVENTS WITH REUSABLE INSTANCES
// ============================================================================

// Create instances for different event types and reuse them
const orderEvents = new Sendivent('test_your_api_key_here', 'order-placed');
const paymentEvents = new Sendivent('test_your_api_key_here', 'payment-received');

// Send order notification
await orderEvents
  .to('customer@example.com')
  .payload({ order_id: 'ORD-001', items: 3 })
  .send();

// Send payment notification (different event, different instance)
await paymentEvents
  .to('customer@example.com')
  .payload({ amount: 150.00, order_id: 'ORD-001' })
  .send();

// Reuse the same instance for another order
await orderEvents
  .to('another@example.com')
  .payload({ order_id: 'ORD-002', items: 5 })
  .send();

// ============================================================================
// ERROR HANDLING
// ============================================================================

try {
  // Invalid API key format throws Error
  const invalid = new Sendivent('invalid_key', 'test-event');
} catch (error) {
  if (error instanceof Error) {
    console.error('Invalid API key format:', error.message);
  }
}

try {
  const test = new Sendivent('test_your_api_key_here', 'test-event');

  const testResponse = await test
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
