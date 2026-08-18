'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { SendResponse } = require('../dist/index.js');

test('parses the real API payload', () => {
  const response = SendResponse.from({
    id: 'dd736a93-0031-4969-94c1-66e455ff1bbd',
    event: 'receipt',
    status: 'accepted',
  });

  assert.strictEqual(response.id, 'dd736a93-0031-4969-94c1-66e455ff1bbd');
  assert.strictEqual(response.event, 'receipt');
  assert.strictEqual(response.status, 'accepted');
  assert.strictEqual(response.isSuccess(), true);
  assert.strictEqual(response.hasError(), false);
});

// Regression: the API has never sent a `success` key. Every field the SDK reads
// must tolerate its absence rather than handing back an undefined typed string.
for (const [label, body] of [
  ['undefined', undefined],
  ['null', null],
  ['empty object', {}],
  ['unrelated keys', { foo: 'bar' }],
]) {
  test(`never yields undefined fields for ${label}`, () => {
    const response = SendResponse.from(body);

    assert.strictEqual(response.id, '');
    assert.strictEqual(response.event, '');
    assert.strictEqual(response.status, '');
    assert.strictEqual(response.isSuccess(), false);
  });
}

test('surfaces an error field', () => {
  const response = SendResponse.from({ status: 'rejected', error: 'No sender configured' });

  assert.strictEqual(response.hasError(), true);
  assert.strictEqual(response.isSuccess(), false);
  assert.strictEqual(response.error, 'No sender configured');
});

test('toObject omits an absent error', () => {
  const obj = SendResponse.from({ id: 'x', event: 'e', status: 'accepted' }).toObject();

  assert.deepStrictEqual(obj, { id: 'x', event: 'e', status: 'accepted' });
});
