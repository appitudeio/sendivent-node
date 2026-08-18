'use strict';

/**
 * Replace global.fetch for the duration of one call.
 * Returns the recorded requests so tests can assert on headers/body.
 */
function stubFetch(responder) {
  const calls = [];
  const original = global.fetch;

  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return responder(url, options);
  };

  return {
    calls,
    restore() {
      global.fetch = original;
    },
  };
}

function jsonResponse(status, body) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

module.exports = { stubFetch, jsonResponse };
