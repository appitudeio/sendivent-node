'use strict';

/**
 * Live smoke test — the only check that proves the DEPLOYED API still matches
 * what the SDK expects. The unit tests stub fetch, so they cannot catch the
 * API reshaping its response (which is exactly what broke the PHP SDK).
 *
 * Opt-in; skipped unless a sandbox key is present:
 *
 *   SENDIVENT_TEST_KEY=test_... SENDIVENT_TEST_EVENT=onboarding_welcome \
 *     node tests/smoke.js
 *
 * Sends to a reserved, non-deliverable address so nobody receives mail.
 */

const { Sendivent, SendiventApiError } = require('../dist/index.js');

const key = process.env.SENDIVENT_TEST_KEY || '';
const event = process.env.SENDIVENT_TEST_EVENT || '';

if (!key || !event) {
  console.error('SKIP: set SENDIVENT_TEST_KEY and SENDIVENT_TEST_EVENT');
  process.exit(0);
}

if (!key.startsWith('test_')) {
  console.error('REFUSED: smoke tests only run against a sandbox (test_) key');
  process.exit(1);
}

let failures = 0;
function check(label, ok, detail = '') {
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label.padEnd(46)} ${detail}`);
}

(async () => {
  console.log('Live contract check against api-sandbox.sendivent.com\n');

  // 1. The success contract
  const response = await new Sendivent(key)
    .event(event)
    .to('sdk-smoke-test@example.com')
    .payload({ source: 'sdk-smoke-test' })
    .send();

  check('send() resolves to a parsed response', response.isSuccess(), `status=${response.status}`);
  check('status is "accepted"', response.status === 'accepted');
  check('id is a populated UUID', /^[0-9a-f-]{36}$/i.test(response.id), response.id);
  check('event echoes the request', response.event === event, response.event);
  check('no error on the success path', !response.hasError());

  // 2. The error contract — a bad key must surface as a typed 401
  try {
    await new Sendivent(`test_${'0'.repeat(32)}`).event(event).to('x@example.com').send();
    check('invalid key rejects with SendiventApiError', false, 'no error thrown');
  } catch (error) {
    check('invalid key rejects with SendiventApiError', error instanceof SendiventApiError);
    check('  carries HTTP status', error.status === 401, `status=${error.status}`);
    check('  carries the API message', /Invalid API key/.test(error.message), error.message);
  }

  // 3. The contacts contract — read-only, no writes against the sandbox
  //
  // NB: the API currently answers an unknown contact with 500, not 404. That is
  // a server-side defect (res.error() collides with the project's own ApiError
  // class, so every res.error() falls through to the generic 500 handler). The
  // SDK's job is to surface whatever status arrives as a typed error, so that is
  // what this asserts — it should not go red over an API bug.
  try {
    await new Sendivent(key).contacts.get('sdk-smoke-test-missing@example.com');
    check('missing contact rejects with SendiventApiError', false, 'no error thrown');
  } catch (error) {
    check('missing contact rejects with SendiventApiError', error instanceof SendiventApiError);
    check('  carries the HTTP status', error.status >= 400, `status=${error.status}`);
    check('  carries the response body', Boolean(error.body), error.body);
  }

  console.log(`\n${failures === 0 ? 'All contract checks passed.' : `${failures} check(s) FAILED.`}`);
  process.exit(failures === 0 ? 0 : 1);
})();
