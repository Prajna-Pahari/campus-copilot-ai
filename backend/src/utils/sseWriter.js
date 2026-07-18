// src/utils/sseWriter.js
//
// Owns the Server-Sent Events wire format in exactly one place.
// An SSE message must be written as "data: <text>\n\n" — if that format
// ever needs to change (e.g. switching transport mechanisms entirely),
// this is the only file that changes. Route handlers never need to know
// the formatting details; they just call sendEvent(res, payload).

/**
 * Writes one SSE event to the response stream.
 * @param {import('express').Response} res - The open Express response.
 * @param {object} payload - Will be JSON-encoded as the event's data.
 */
function sendEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

module.exports = { sendEvent };
