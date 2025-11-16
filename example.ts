/**
 * Sendivent Node.js/TypeScript SDK - Focused Examples
 *
 * Demonstrates real-world use cases for multi-channel notifications
 * Run with: npx tsx example.ts
 */

import { Sendivent, type Contact } from '@sendivent/sdk';

// Initialize with your API key (test_ for sandbox, live_ for production)
const sendivent = new Sendivent('test_your_api_key_here');

// =============================================================================
// EXAMPLE 1: Smart Pattern Detection
// =============================================================================
console.log('1. Smart Pattern Detection');

// Email - automatically detected
await sendivent
  .event('welcome')
  .to('user@example.com')
  .payload({ name: 'John Doe' })
  .send();

// Phone - automatically detected
await sendivent
  .event('verification-code')
  .to('+1234567890')
  .payload({ code: '123456' })
  .send();

// Slack User ID - automatically detected
await sendivent
  .event('dm-notification')
  .to('U12345ABCDE')
  .payload({ message: 'You have a new message' })
  .send();

// =============================================================================
// EXAMPLE 2: Rich Contact Objects (CRM Tracking)
// =============================================================================
console.log('\n2. Rich Contact Objects');

// Pass your user object directly - 'id' maps to external_id in Sendivent
await sendivent
  .event('order-confirmation')
  .to({
    id: 'user-12345',              // Your application's user ID
    email: 'customer@example.com',
    phone: '+1234567890',
    name: 'Jane Smith',
    avatar: 'https://example.com/avatar.jpg',
    meta: {
      tier: 'premium',
      timezone: 'America/New_York'
    }
  } as Contact)
  .payload({
    order_id: 'ORD-98765',
    total: 99.99,
    items: [
      { name: 'Product A', qty: 2 },
      { name: 'Product B', qty: 1 }
    ]
  })
  .send();

// =============================================================================
// EXAMPLE 3: Broadcast Mode (Event Listeners)
// =============================================================================
console.log('\n3. Broadcast Mode');

// Send to all configured event listeners (no recipients specified)
await sendivent
  .event('system-alert')
  .payload({
    severity: 'high',
    message: 'Database backup completed',
    timestamp: Date.now()
  })
  .send();

// =============================================================================
// EXAMPLE 4: Slack Channel Broadcasting (No Contact Created)
// =============================================================================
console.log('\n4. Slack Channel Broadcasting');

// Broadcast to Slack channel - doesn't create a contact in CRM
await sendivent
  .event('team-announcement')
  .channel('slack')
  .to('#general')  // Channel name
  .payload({
    title: 'Weekly Update',
    message: 'New features released this week!'
  })
  .send();

// Or use channel ID
await sendivent
  .event('team-announcement')
  .channel('slack')
  .to('C01234ABCDE')  // Channel ID
  .payload({
    title: 'Weekly Update',
    message: 'New features released!'
  })
  .send();

// =============================================================================
// EXAMPLE 5: Channel-Specific Sending
// =============================================================================
console.log('\n5. Channel-Specific Sending');

// Force SMS even if event supports multiple channels
await sendivent
  .event('urgent-alert')
  .channel('sms')
  .to('+1234567890')
  .payload({ alert: 'Your account requires attention' })
  .send();

// Force Email
await sendivent
  .event('monthly-report')
  .channel('email')
  .to('manager@example.com')
  .payload({
    month: 'January',
    revenue: 125000,
    growth: 15.5
  })
  .send();

// =============================================================================
// EXAMPLE 6: Multiple Recipients (Bulk Sending)
// =============================================================================
console.log('\n6. Multiple Recipients');

await sendivent
  .event('newsletter')
  .to([
    'subscriber1@example.com',
    'subscriber2@example.com',
    { email: 'vip@example.com', name: 'VIP Customer', meta: { tier: 'platinum' } }
  ])
  .payload({
    subject: 'Monthly Newsletter',
    featured_article: 'Top 10 Features You Might Have Missed'
  })
  .send();

// =============================================================================
// EXAMPLE 7: Language Selection
// =============================================================================
console.log('\n7. Language Selection');

// Send in Swedish
await sendivent
  .event('welcome')
  .to('anders@example.com')
  .payload({ name: 'Anders' })
  .language('sv')
  .send();

// Send in Spanish
await sendivent
  .event('password-reset')
  .to('maria@example.com')
  .payload({ reset_link: 'https://app.example.com/reset/xyz' })
  .language('es')
  .send();

// =============================================================================
// EXAMPLE 8: Template Overrides
// =============================================================================
console.log('\n8. Template Overrides');

// Override subject and sender for this specific send
await sendivent
  .event('invoice')
  .to('customer@example.com')
  .payload({
    invoice_number: 'INV-2024-001',
    amount: 499.99
  })
  .overrides({
    subject: 'URGENT: Invoice Due',
    from_email: 'billing@example.com',
    from_name: 'Billing Department'
  })
  .send();

// =============================================================================
// EXAMPLE 9: Idempotency (Prevent Duplicate Sends)
// =============================================================================
console.log('\n9. Idempotency');

// Use idempotency key to prevent duplicate sends
const orderId = 'ORD-12345';

await sendivent
  .event('order-confirmation')
  .to('customer@example.com')
  .payload({
    order_id: orderId,
    total: 299.99
  })
  .idempotencyKey(`order-${orderId}-confirmation`)
  .send();

// If called again with same key within TTL, won't send duplicate
await sendivent
  .event('order-confirmation')
  .to('customer@example.com')
  .payload({
    order_id: orderId,
    total: 299.99
  })
  .idempotencyKey(`order-${orderId}-confirmation`)  // Same key = no duplicate
  .send();

// =============================================================================
// EXAMPLE 10: Error Handling
// =============================================================================
console.log('\n10. Error Handling');

try {
  const response = await sendivent
    .event('test-event')
    .to('test@example.com')
    .payload({ test: true })
    .send();

  if (response.isSuccess()) {
    console.log('✓ Success! Queue IDs:', response.data);
  } else {
    console.log('✗ Failed:', response.error);
  }
} catch (error) {
  console.log('✗ Exception:', error);
}

// =============================================================================
// EXAMPLE 11: Smart Fallback (Priority-Based Channel Selection)
// =============================================================================
console.log('\n11. Smart Fallback');

// Contact has no email but has Slack ID
// Event configured for email+slack
// System automatically sends via Slack (priority fallback)
await sendivent
  .event('notification')
  .to({
    id: 'user-789',
    slack_id: 'U98765ZYXWV',  // Has Slack
    // No email - will automatically use Slack
    name: 'Bob'
  } as Contact)
  .payload({ message: 'Your report is ready' })
  .send();

console.log('\n✓ All examples completed!');
