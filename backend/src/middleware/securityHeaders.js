// src/middleware/securityHeaders.js
//
// Sets a small set of security-related response headers manually rather
// than adding the `helmet` package. This backend only ever returns JSON
// or SSE text — never HTML — so the handful of headers that actually
// apply can be set directly in a few lines. If this server ever starts
// serving HTML or the header set needs to grow significantly, switching
// to `helmet` would be a contained, one-file change.

function securityHeaders(req, res, next) {
  // Stops browsers from trying to "guess" a different content type than
  // what the server declared — mitigates certain MIME-sniffing attacks.
  res.setHeader("X-Content-Type-Options", "nosniff");

  // This API is never meant to be embedded in an <iframe>; disallow it
  // outright as a defense against clickjacking-style attacks.
  res.setHeader("X-Frame-Options", "DENY");

  // Don't leak the full referring URL (which could contain sensitive
  // paths or query params) to other sites.
  res.setHeader("Referrer-Policy", "no-referrer");

  // This server only ever returns JSON or SSE text, never HTML/scripts —
  // a strict CSP communicates that explicitly to any browser that, for
  // some unexpected reason, ends up rendering a response directly.
  res.setHeader("Content-Security-Policy", "default-src 'none'");

  next();
}

module.exports = securityHeaders;
