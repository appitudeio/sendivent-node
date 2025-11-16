# Sendivent Node.js/TypeScript SDK

[![npm version](https://img.shields.io/npm/v/@sendivent/sdk.svg)](https://www.npmjs.com/package/@sendivent/sdk)
[![License](https://img.shields.io/npm/l/@sendivent/sdk.svg)](https://www.npmjs.com/package/@sendivent/sdk)

Official TypeScript/JavaScript SDK for [Sendivent](https://sendivent.com) - Multi-channel notification platform supporting Email, SMS, Slack, and Push notifications.

## Installation

```bash
npm install @sendivent/sdk
```

Requires Node.js 18+ (for native `fetch` support)

## Quick Start

```typescript
import { Sendivent } from '@sendivent/sdk';

const sendivent = new Sendivent('test_your_api_key_here', 'welcome');

await sendivent
  .to('user@example.com')
  .payload({ name: 'John Doe' })
  .send();
```

The SDK automatically routes to sandbox (`test_*`) or production (`live_*`) based on your API key prefix.

## Response Object

The `send()` method returns a `SendResponse` object with helper methods:

```typescript
const response = await sendivent
  .to('user@example.com')
  .payload({ name: 'John' })
  .send();

if (response.isSuccess()) {
  console.log('Sent! Queue IDs:', response.data);
} else {
  console.error('Error:', response.error);
}

// Available properties: success, data, error, message
// Available methods: isSuccess(), hasError(), toObject(), toJson()
```

## Fire-and-Forget

For background sending without waiting for the response:

```typescript
// Fire and forget - returns immediately without waiting
sendivent
  .to('user@example.com')
  .payload({ name: 'John' })
  .send()
  .catch(err => console.error('Background send failed:', err));

// Continue with other work...
```

## Contact Objects & Smart Detection

The `to()` method accepts strings, Contact objects, or arrays of either. Sendivent automatically detects what type of identifier you're sending:

```typescript
import type { Contact } from '@sendivent/sdk';

// String inputs - automatically detected by pattern matching
await sendivent.event('welcome').to('user@example.com').send();  // Detected as email
await sendivent.event('sms-code').to('+1234567890').send();      // Detected as phone
await sendivent.event('alert').to('U12345').send();              // Detected as Slack user ID

// Contact objects - your user's ID maps to external_id in Sendivent
await sendivent
  .event('welcome')
  .to({
    id: 'user-12345',              // Your user's ID
    email: 'user@example.com',
    phone: '+1234567890',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    meta: { tier: 'premium' }
  } as Contact)
  .payload({ welcome_message: 'Hello!' })
  .send();

// Multiple recipients
await sendivent
  .event('newsletter')
  .to([
    'user1@example.com',
    { id: 'user-456', email: 'user2@example.com', name: 'Jane' }
  ])
  .payload({ subject: 'Newsletter' })
  .send();

// Broadcast to Slack channel (no contact created)
await sendivent
  .event('system-alert')
  .channel('slack')
  .to('#general')  // Broadcasts to channel, doesn't create contact
  .payload({ message: 'System update' })
  .send();
```

## Key Features

- **Multi-channel** - Email, SMS, Slack, and Push in one API
- **Fluent API** - Clean, chainable method calls
- **Type-safe** - Full TypeScript support with type definitions
- **Fire-and-forget** - Non-blocking sends with promise-based API
- **Idempotency** - Prevent duplicate sends with `idempotencyKey()`
- **Template overrides** - Customize subject, sender, etc. per request
- **Language support** - Send in different languages with `language()`
- **Channel control** - Force specific channels with `channel()`
- **Broadcast mode** - Send to event listeners without specifying recipients

## Additional Examples

### Channel-Specific Sending

```typescript
await sendivent
  .channel('sms')
  .to('+1234567890')
  .payload({ code: '123456' })
  .send();
```

### Template Overrides

```typescript
await sendivent
  .to('user@example.com')
  .payload({ amount: 100 })
  .overrides({
    subject: 'Custom Subject',
    from_email: 'billing@company.com'
  })
  .send();
```

### Idempotency

```typescript
await sendivent
  .to('user@example.com')
  .payload({ order_id: '12345' })
  .idempotencyKey('order-12345-confirmation')
  .send();
```

### Language Selection

```typescript
await sendivent
  .to('user@example.com')
  .payload({ name: 'Anders' })
  .language('sv')  // Swedish
  .send();
```

### Broadcast Events

Send to configured event listeners without specifying recipients:

```typescript
await sendivent
  .payload({ severity: 'high', message: 'System alert' })
  .send();
```

## Full Example

See [example.ts](./example.ts) for a comprehensive demonstration of all SDK features.

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { Sendivent, Contact, SendResponse } from '@sendivent/sdk';

const contact: Contact = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'John Doe'
};

const response: SendResponse = await sendivent
  .to(contact)
  .payload({ message: 'Hello' })
  .send();
```

## Support

- **Documentation:** [docs.sendivent.com](https://docs.sendivent.com)
- **Issues:** [github.com/sendivent/sdk-node/issues](https://github.com/sendivent/sdk-node/issues)

## License

MIT License - see [LICENSE](./LICENSE) file for details.
