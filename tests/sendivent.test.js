'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  Sendivent,
  SendiventError,
  SendiventApiError,
  SendiventTransportError,
  VERSION,
} = require('../dist/index.js');
const { stubFetch, jsonResponse } = require('./helpers');

const ACCEPTED = '{"id":"dd736a93-0031-4969-94c1-66e455ff1bbd","event":"receipt","status":"accepted"}';

test('rejects an unprefixed API key', () => {
  assert.throws(() => new Sendivent('nope'), SendiventError);
});

test('requires an event', async () => {
  await assert.rejects(() => new Sendivent('test_key').payload({}).send(), SendiventError);
});

test('returns the accepted response and sends the expected request', async () => {
  const fetchStub = stubFetch(() => jsonResponse(200, ACCEPTED));

  try {
    const response = await new Sendivent('test_key')
      .event('receipt')
      .to('user@example.com')
      .idempotencyKey('order-123')
      .send();

    assert.strictEqual(response.isSuccess(), true);
    assert.strictEqual(response.event, 'receipt');

    const [call] = fetchStub.calls;
    assert.strictEqual(call.url, 'https://api-sandbox.sendivent.com/v1/send/receipt');
    assert.strictEqual(call.options.headers['User-Agent'], `Sendivent-Node/${VERSION}`);
    assert.strictEqual(call.options.headers['X-Idempotency-Key'], 'order-123');
    assert.deepStrictEqual(JSON.parse(call.options.body).to, 'user@example.com');
  } finally {
    fetchStub.restore();
  }
});

test('a live_ key targets production', async () => {
  const fetchStub = stubFetch(() => jsonResponse(200, ACCEPTED));

  try {
    await new Sendivent('live_key').event('receipt').send();
    assert.ok(fetchStub.calls[0].url.startsWith('https://api.sendivent.com/'));
  } finally {
    fetchStub.restore();
  }
});

// Regression: a 2xx means the notification was accepted. An unparseable body
// must degrade to a non-success response, never reject — otherwise a committed
// transaction dies on the receipt it already sent.
for (const [label, body] of [
  ['empty body', ''],
  ['html error page', '<html><body>502 Bad Gateway</body></html>'],
  ['truncated json', '{"id":"abc","even'],
  ['json scalar', '"accepted"'],
  ['json array', '[]'],
]) {
  test(`an unparseable 2xx body does not reject: ${label}`, async () => {
    const fetchStub = stubFetch(() => new Response(body, { status: 200 }));

    try {
      const response = await new Sendivent('test_key').event('receipt').send();

      assert.strictEqual(response.isSuccess(), false);
      assert.strictEqual(response.id, '');
    } finally {
      fetchStub.restore();
    }
  });
}

test('an HTTP error becomes a SendiventApiError with status and code', async () => {
  const fetchStub = stubFetch(() =>
    jsonResponse(402, '{"error":"Monthly quota exhausted","code":"quota_exceeded"}'),
  );

  try {
    await new Sendivent('test_key').event('receipt').send();
    assert.fail('Expected a SendiventApiError');
  } catch (error) {
    assert.ok(error instanceof SendiventApiError);
    assert.strictEqual(error.status, 402);
    assert.strictEqual(error.code, 'quota_exceeded');
    assert.match(error.message, /Monthly quota exhausted/);
    assert.match(error.body, /quota_exceeded/);
  } finally {
    fetchStub.restore();
  }
});

test('handles the nested error shape', async () => {
  const fetchStub = stubFetch(() =>
    jsonResponse(422, '{"error":{"message":"Unknown event","code":"event_not_found"}}'),
  );

  try {
    await new Sendivent('test_key').event('nope').send();
    assert.fail('Expected a SendiventApiError');
  } catch (error) {
    assert.strictEqual(error.status, 422);
    assert.strictEqual(error.code, 'event_not_found');
    assert.match(error.message, /Unknown event/);
  } finally {
    fetchStub.restore();
  }
});

// Regression: reading the body as JSON first turned a 502 HTML page into a
// misleading "Unexpected token '<'" instead of reporting the real status.
test('a non-JSON error body still reports the HTTP status', async () => {
  const fetchStub = stubFetch(() => new Response('<html>502</html>', { status: 502 }));

  try {
    await new Sendivent('test_key').event('receipt').send();
    assert.fail('Expected a SendiventApiError');
  } catch (error) {
    assert.ok(error instanceof SendiventApiError);
    assert.strictEqual(error.status, 502);
    assert.strictEqual(error.code, undefined);
    assert.match(error.message, /HTTP 502/);
  } finally {
    fetchStub.restore();
  }
});

// Regression: the old catch-all re-wrapped its own throw, producing
// "Sendivent API request failed: Sendivent API request failed: ..."
test('the error message is not double-prefixed', async () => {
  const fetchStub = stubFetch(() => jsonResponse(402, '{"error":"Quota"}'));

  try {
    await new Sendivent('test_key').event('receipt').send();
    assert.fail('Expected a SendiventApiError');
  } catch (error) {
    assert.strictEqual(error.message.match(/Sendivent API/g).length, 1);
  } finally {
    fetchStub.restore();
  }
});

test('a network failure becomes a SendiventTransportError', async () => {
  const fetchStub = stubFetch(() => {
    throw new TypeError('fetch failed');
  });

  try {
    await new Sendivent('test_key').event('receipt').send();
    assert.fail('Expected a SendiventTransportError');
  } catch (error) {
    assert.ok(error instanceof SendiventTransportError);
    assert.ok(error.cause instanceof TypeError);
  } finally {
    fetchStub.restore();
  }
});

test('a hung request aborts on the configured timeout', async () => {
  const fetchStub = stubFetch(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      }),
  );

  try {
    await new Sendivent('test_key', { timeoutMs: 25 }).event('receipt').send();
    assert.fail('Expected a SendiventTransportError');
  } catch (error) {
    assert.ok(error instanceof SendiventTransportError);
    assert.match(error.message, /timed out after 25ms/);
  } finally {
    fetchStub.restore();
  }
});

test('every SDK error stays catchable as Error', async () => {
  const fetchStub = stubFetch(() => jsonResponse(500, '{}'));

  try {
    await new Sendivent('test_key').event('receipt').send();
    assert.fail('Expected an error');
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok(error instanceof SendiventError);
  } finally {
    fetchStub.restore();
  }
});
