'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  Sendivent,
  SendiventApiError,
  SendiventTransportError,
} = require('../dist/index.js');
const { stubFetch, jsonResponse } = require('./helpers');

const CONTACT = '{"success":true,"contact":{"uuid":"abc"}}';

function contactsWith(responder) {
  const fetchStub = stubFetch(responder);
  const contacts = new Sendivent('test_key').contacts;
  return { contacts, fetchStub, last: () => fetchStub.calls[fetchStub.calls.length - 1] };
}

test('get issues the right request', async () => {
  const { contacts, fetchStub, last } = contactsWith(() => jsonResponse(200, CONTACT));
  try {
    const result = await contacts.get('user@example.com');

    assert.strictEqual(last().options.method, 'GET');
    assert.strictEqual(last().url, 'https://api-sandbox.sendivent.com/v1/contacts/user%40example.com');
    assert.deepStrictEqual(result, { success: true, contact: { uuid: 'abc' } });
  } finally {
    fetchStub.restore();
  }
});

// Plus-addressing is common and must survive path encoding.
test('identifiers are encoded into the path', async () => {
  const { contacts, fetchStub, last } = contactsWith(() => jsonResponse(200, CONTACT));
  try {
    await contacts.get('user+tag@example.com');
    assert.match(last().url, /user%2Btag%40example\.com$/);
  } finally {
    fetchStub.restore();
  }
});

test('upsert posts the body', async () => {
  const { contacts, fetchStub, last } = contactsWith(() => jsonResponse(200, CONTACT));
  try {
    await contacts.upsert({ email: 'user@example.com', name: 'Ada' });

    assert.strictEqual(last().options.method, 'POST');
    assert.strictEqual(last().url, 'https://api-sandbox.sendivent.com/v1/contacts');
    assert.deepStrictEqual(JSON.parse(last().options.body), { email: 'user@example.com', name: 'Ada' });
  } finally {
    fetchStub.restore();
  }
});

test('update uses PATCH', async () => {
  const { contacts, fetchStub, last } = contactsWith(() => jsonResponse(200, CONTACT));
  try {
    await contacts.update('user@example.com', { name: 'Grace' });

    assert.strictEqual(last().options.method, 'PATCH');
    assert.match(last().url, /\/v1\/contacts\/user%40example\.com$/);
    assert.deepStrictEqual(JSON.parse(last().options.body), { name: 'Grace' });
  } finally {
    fetchStub.restore();
  }
});

test('delete sends no body', async () => {
  const { contacts, fetchStub, last } = contactsWith(() =>
    jsonResponse(200, '{"success":true,"deleted":true}'),
  );
  try {
    const result = await contacts.delete('user@example.com');

    assert.strictEqual(last().options.method, 'DELETE');
    assert.strictEqual(last().options.body, undefined);
    assert.deepStrictEqual(result, { success: true, deleted: true });
  } finally {
    fetchStub.restore();
  }
});

test('push token routes', async () => {
  const { contacts, fetchStub, last } = contactsWith(() => jsonResponse(200, CONTACT));
  try {
    await contacts.registerPushToken('user@example.com', 'tok-1');
    assert.strictEqual(last().options.method, 'POST');
    assert.match(last().url, /\/v1\/contacts\/user%40example\.com\/push-tokens$/);
    assert.deepStrictEqual(JSON.parse(last().options.body), { token: 'tok-1' });

    await contacts.removePushToken('user@example.com', 'tok-1');
    assert.strictEqual(last().options.method, 'DELETE');
    assert.deepStrictEqual(JSON.parse(last().options.body), { token: 'tok-1' });
  } finally {
    fetchStub.restore();
  }
});

// Regression: response.json() was called before the ok check, so an
// unparseable body threw a JSON syntax error over the real result.
for (const [label, body] of [
  ['empty body', ''],
  ['html error page', '<html>ok</html>'],
  ['truncated json', '{"success":tr'],
  ['json scalar', '"ok"'],
]) {
  test(`an unparseable 2xx body resolves to {}: ${label}`, async () => {
    const { contacts, fetchStub } = contactsWith(() => new Response(body, { status: 200 }));
    try {
      assert.deepStrictEqual(await contacts.get('user@example.com'), {});
    } finally {
      fetchStub.restore();
    }
  });
}

test('a missing contact rejects with SendiventApiError carrying the status', async () => {
  const { contacts, fetchStub } = contactsWith(() =>
    jsonResponse(404, '{"error":"Contact not found"}'),
  );
  try {
    await contacts.get('nobody@example.com');
    assert.fail('Expected a SendiventApiError');
  } catch (error) {
    assert.ok(error instanceof SendiventApiError);
    assert.strictEqual(error.status, 404);
    assert.match(error.message, /Contact not found/);
  } finally {
    fetchStub.restore();
  }
});

// Regression: a non-JSON error body used to surface as "Unexpected token '<'".
test('a non-JSON error body still reports the HTTP status', async () => {
  const { contacts, fetchStub } = contactsWith(() => new Response('<html>502</html>', { status: 502 }));
  try {
    await contacts.get('user@example.com');
    assert.fail('Expected a SendiventApiError');
  } catch (error) {
    assert.strictEqual(error.status, 502);
    assert.match(error.message, /HTTP 502/);
  } finally {
    fetchStub.restore();
  }
});

test('a network failure rejects with SendiventTransportError', async () => {
  const { contacts, fetchStub } = contactsWith(() => {
    throw new TypeError('fetch failed');
  });
  try {
    await contacts.get('user@example.com');
    assert.fail('Expected a SendiventTransportError');
  } catch (error) {
    assert.ok(error instanceof SendiventTransportError);
  } finally {
    fetchStub.restore();
  }
});

test('the contacts instance is reused', () => {
  const sendivent = new Sendivent('test_key');
  assert.strictEqual(sendivent.contacts, sendivent.contacts);
});
