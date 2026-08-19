# Sendivent Node.js/TypeScript SDK

[![npm version](https://img.shields.io/npm/v/@sendivent/sdk.svg)](https://www.npmjs.com/package/@sendivent/sdk)
[![License](https://img.shields.io/npm/l/@sendivent/sdk.svg)](https://www.npmjs.com/package/@sendivent/sdk)

Official TypeScript/JavaScript SDK for [Sendivent](https://sendivent.com) - Multi-channel notification platform supporting Email, SMS, Slack, Push, Telegram, WhatsApp, and Discord.

## Installation

```bash
npm install @sendivent/sdk
```

Requires Node.js 18+ (for native `fetch` support)

## Quick Start

```typescript
import { Sendivent } from '@sendivent/sdk';

const sendivent = new Sendivent('test_your_api_key_here');

await sendivent
  .event('welcome')
  .to('user@example.com')
  .payload({ name: 'John Doe' })
  .send();
```

The SDK automatically routes to sandbox (`test_*`) or production (`live_*`) based on your API key prefix.

## Response Object

The `send()` method returns a `SendResponse` object with helper methods:

```typescript
const response = await sendivent
  .event('welcome')
  .to('user@example.com')
  .payload({ name: 'John' })
  .send();

if (response.isSuccess()) {
  console.log(response.id);
  // "550e8400-e29b-41d4-a716-446655440000"
} else {
  console.error('Error:', response.error);
}

// Available properties: id, event, status, error
// Available methods: isSuccess(), hasError(), toObject(), toJson()
```

The `id` is the notification identifier. Notifications are processed asynchronously — use `GET /v1/notifications/{id}` to track message status.

## Fire-and-Forget

For background sending without waiting for the response:

```typescript
// Fire and forget - returns immediately without waiting
sendivent
  .event('welcome')
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

- **Multi-channel** - Email, SMS, Slack, Push, Telegram, WhatsApp, and Discord in one API
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
  .event('sms-code')
  .channel('sms')
  .to('+1234567890')
  .payload({ code: '123456' })
  .send();
```

### Template Overrides

```typescript
await sendivent
  .event('payment-received')
  .to('user@example.com')
  .payload({ amount: 100 })
  .overrides({
    email: {
      subject: 'Custom Subject',
      reply_to: 'billing@company.com'
    }
  })
  .send();
```

### Brand Overrides

```typescript
await sendivent
  .event('welcome')
  .to('user@example.com')
  .overrides({
    brand: { logotype: 'https://example.fi/logo.png' }
  })
  .send();
```

### Idempotency

```typescript
await sendivent
  .event('order-confirmation')
  .to('user@example.com')
  .payload({ order_id: '12345' })
  .idempotencyKey('order-12345-confirmation')
  .send();
```

### Language Selection

```typescript
await sendivent
  .event('welcome')
  .to('user@example.com')
  .payload({ name: 'Anders' })
  .language('sv')  // Swedish
  .send();
```

### Broadcast Events

Send to configured event listeners without specifying recipients:

```typescript
await sendivent
  .event('system-alert')
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
  .event('welcome')
  .to(contact)
  .payload({ message: 'Hello' })
  .send();
```

## Error Handling

`send()` rejects only when the request fails. A 2xx response is always resolved
into a `SendResponse`, even if the body is unexpected — the notification was
already accepted at that point, so parsing never rejects.

```typescript
import { SendiventApiError, SendiventTransportError } from '@sendivent/sdk';

try {
  const response = await sendivent.event('receipt').to(email).send();
} catch (error) {
  if (error instanceof SendiventApiError) {
    // The API answered with a non-2xx status
    if (error.status === 402) {
      // Quota exhausted
    }
    console.error(error.code, error.body);
  } else if (error instanceof SendiventTransportError) {
    // Never reached the API — DNS, refused connection, TLS or timeout.
    // The notification may or may not have been delivered; retry with
    // idempotencyKey() if you need certainty.
  }
}
```

Both extend `SendiventError`, which extends `Error`.

Requests time out after 30 seconds by default:

```typescript
const sendivent = new Sendivent(process.env.SENDIVENT_API_KEY!, { timeoutMs: 5000 });
```

**Sending from inside a transaction?** A notification is rarely worth failing the
work that triggered it — catch `SendiventError` around the send, or don't await it.

## Development

```bash
npm install
npm test
```

## Support

- **Documentation:** [docs.sendivent.com](https://docs.sendivent.com)
- **Issues:** [github.com/sendivent/sdk-node/issues](https://github.com/sendivent/sdk-node/issues)

## License

MIT License - see [LICENSE](./LICENSE) file for details.
