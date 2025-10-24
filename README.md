# Sendivent Node.js/TypeScript SDK

Official TypeScript/JavaScript SDK for [Sendivent](https://sendivent.com) - Multi-channel notification platform supporting Email, SMS, and Slack.

## Installation

```bash
npm install @sendivent/sdk
```

## Requirements

- Node.js 18.0.0 or higher (for native `fetch` support)
- TypeScript 5.0+ (optional, for TypeScript projects)

## Quick Start

### TypeScript

```typescript
import { Sendivent } from '@sendivent/sdk';

// Initialize with your API key
const sendivent = new Sendivent('test_your_api_key_here');

// Send a notification
await sendivent.event('welcome')
  .to('user@example.com')
  .payload({ name: 'John Doe', company: 'Acme Corp' })
  .send();
```

### JavaScript

```javascript
const { Sendivent } = require('@sendivent/sdk');

const sendivent = new Sendivent('test_your_api_key_here');

await sendivent.event('welcome')
  .to('user@example.com')
  .payload({ name: 'John Doe', company: 'Acme Corp' })
  .send();
```

## API Key Modes

The SDK automatically detects the environment based on your API key prefix:

- `test_*` → Sandbox mode (`https://api-sandbox.sendivent.com`)
- `live_*` → Production mode (`https://api.sendivent.com`)

## Usage Examples

### Basic Notification

```typescript
await sendivent.event('welcome')
  .to('user@example.com')
  .payload({ name: 'John' })
  .send();
```

### Get Response

```typescript
const response = await sendivent.event('invoice')
  .to('user@example.com')
  .payload({ amount: 100, invoice_id: '12345' })
  .get();

// Response structure:
// {
//   success: true,
//   data: [
//     { email: 'uuid-of-queued-notification' }
//   ]
// }
```

### Channel-Specific Sending

Force a specific channel (email, sms, or slack):

```typescript
await sendivent.event('password-reset')
  .channel('email')
  .to('user@example.com')
  .payload({ reset_link: 'https://example.com/reset/abc123' })
  .send();

// SMS example
await sendivent.event('alert')
  .channel('sms')
  .to('+1234567890')
  .payload({ message: 'Your code is 123456' })
  .send();
```

### Broadcast Events (No Specific Recipient)

Send to event listeners without specifying recipients:

```typescript
await sendivent.event('system-alert')
  .payload({
    severity: 'high',
    message: 'Database backup completed successfully'
  })
  .send();
```

### Multiple Recipients

```typescript
await sendivent.event('newsletter')
  .to([
    'user1@example.com',
    'user2@example.com',
    { email: 'user3@example.com', name: 'User Three' }
  ])
  .payload({ subject: 'Monthly Newsletter', content: '...' })
  .send();
```

### With Language

```typescript
await sendivent.event('welcome')
  .to('user@example.com')
  .payload({ name: 'Anders' })
  .language('sv')  // Swedish
  .send();
```

### Template Overrides

Override template defaults like subject, sender, etc.:

```typescript
await sendivent.event('invoice')
  .to('user@example.com')
  .payload({ amount: 100 })
  .overrides({
    subject: 'Your Custom Invoice Subject',
    from_email: 'billing@company.com',
    from_name: 'Billing Department',
    reply_to: 'support@company.com'
  })
  .send();
```

### Idempotency

Prevent duplicate sends using idempotency keys:

```typescript
await sendivent.event('order-confirmation')
  .to('user@example.com')
  .payload({ order_id: '12345' })
  .idempotencyKey('order-12345-confirmation')
  .send();

// Sending again with same key returns cached response without re-sending
```

### Complex Contact Objects

```typescript
import type { Contact } from '@sendivent/sdk';

const contact: Contact = {
  email: 'user@example.com',
  phone: '+1234567890',
  name: 'John Doe',
  external_id: 'user-12345',
  meta: {
    department: 'Engineering',
    timezone: 'America/New_York'
  }
};

await sendivent.event('welcome')
  .to(contact)
  .payload({ welcome_message: 'Welcome to our platform!' })
  .send();
```

## API Reference

### `Sendivent`

#### `constructor(apiKey: string)`

Initialize the Sendivent client.

```typescript
const sendivent = new Sendivent('test_abc123');
```

#### `event(eventName: string): EventRequest`

Create a new event request builder.

```typescript
const request = sendivent.event('welcome');
```

---

### `EventRequest`

Fluent builder for notification requests.

#### `to(recipient: string | Contact | Array<string | Contact>): this`

Set recipient(s). Can be:
- Email string: `'user@example.com'`
- Phone string: `'+1234567890'`
- Contact object: `{ email: '...', name: '...' }`
- Array of recipients: `['user1@example.com', 'user2@example.com']`

#### `payload(data: Record<string, unknown>): this`

Set template variables.

```typescript
.payload({ name: 'John', amount: 100 })
```

#### `channel(channel: Channel): this`

Force specific channel. Type: `'email' | 'sms' | 'slack'`

```typescript
.channel('email')
```

#### `language(language: string): this`

Set language code (e.g., 'en', 'sv', 'da').

```typescript
.language('sv')
```

#### `overrides(overrides: Record<string, unknown>): this`

Override template defaults.

```typescript
.overrides({ subject: 'Custom Subject' })
```

#### `idempotencyKey(key: string): this`

Set idempotency key for deduplication.

```typescript
.idempotencyKey('unique-key-123')
```

#### `send(): Promise<SendResponse>`

Execute the request and return response.

```typescript
const response = await request.send();
```

#### `get(): Promise<SendResponse>`

Alias for `send()`.

```typescript
const response = await request.get();
```

---

### Types

```typescript
type Channel = 'email' | 'sms' | 'slack';

interface Contact {
  email?: string;
  phone?: string;
  name?: string;
  external_id?: string;
  avatar?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SendResponse {
  success: boolean;
  data?: Array<Record<string, string>>;
  error?: string;
  message?: string;
}
```

## Error Handling

```typescript
import { Sendivent } from '@sendivent/sdk';

try {
  const sendivent = new Sendivent('test_abc123');

  const response = await sendivent.event('welcome')
    .to('user@example.com')
    .payload({ name: 'John' })
    .send();

  console.log('Notification sent successfully!');
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
}
```

## Building from Source

```bash
npm install
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

## Support

- **Documentation:** [https://docs.sendivent.com](https://docs.sendivent.com)
- **Support:** support@sendivent.com
- **Issues:** [GitHub Issues](https://github.com/sendivent/sdk-node/issues)

## License

MIT License - see LICENSE file for details.
