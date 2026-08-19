'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { VERSION } = require('../dist/index.js');
const pkg = require('../package.json');

// src/version.ts is hand-maintained; this keeps it honest so the User-Agent
// never drifts from the published version again.
test('VERSION matches package.json', () => {
  assert.strictEqual(VERSION, pkg.version);
});
