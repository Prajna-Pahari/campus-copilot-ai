// src/server.js
//
// Entrypoint for the Campus Copilot AI backend. Assembles the Express
// app, wires global middleware and routes, and manages the server's
// full lifecycle: startup, error handling, and graceful shutdown.

const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const healthRoute = require("./routes/healthRoute");
const generateRoute = require("./routes/generateRoute");
const securityHeaders = require("./middleware/securityHeaders");
const logger = require("./utils/logger");

const app = express();

// AWS App Runner terminates HTTPS and forwards requests to this
// container over plain HTTP through a proxy. Without this setting,
// Express would treat every request as if it came directly from that
// proxy (wrong client IP, wrong protocol) instead of the real client.
// Harmless locally; required for correct behavior once deployed.
app.set("trust proxy", 1);

// Parse incoming JSON request bodies.
app.use(express.json({ limit: "1mb" }));

// Only allow requests from our known frontend origin — never default to
// open CORS ("*") on an anonymous, LLM-backed API.
app.use(
  cors({
    origin: env.frontendOrigin,
  }),
);

// Small set of security-related response headers (see middleware file
// for details on why this is manual instead of the `helmet` package).
app.use(securityHeaders);

// Mount routes under /api
app.use("/api", healthRoute);
app.use("/api", generateRoute);

// Fallback for any unmatched route — keeps error responses consistent
// instead of leaking Express's default HTML 404 page.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Centralized error-handling middleware. Express recognizes this by its
// 4-argument signature and routes any error passed to next(err) — or
// thrown synchronously in a non-async handler — here. This is a safety
// net: it also catches things like malformed JSON request bodies, which
// express.json() rejects with a SyntaxError that would otherwise reach
// the client as Express's default HTML error page.
app.use((err, req, res, next) => {
  logger.error("Unhandled request error", {
    message: err.message,
    path: req.path,
  });

  if (res.headersSent) {
    // Streaming (SSE) may have already started; we can't send a fresh
    // JSON response at this point, so just end the connection.
    return res.end();
  }
  res.status(400).json({ error: "Invalid request." });
});

const server = app.listen(env.port, () => {
  logger.info(
    `Campus Copilot AI backend running on http://localhost:${env.port}`,
  );
  logger.info(`Health check: http://localhost:${env.port}/api/health`);
});

// Handle startup failures (e.g. the port is already in use) with a clear
// message instead of an unhandled stack trace.
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error(
      `Port ${env.port} is already in use. Is another instance already running?`,
    );
  } else {
    logger.error("Server failed to start", { message: err.message });
  }
  process.exit(1);
});

// --- Graceful shutdown ---
// AWS App Runner (and Docker generally) sends SIGTERM to ask a container
// to stop cleanly before killing it — this happens on every deploy and
// scaling event. Node's default behavior on SIGTERM is to exit
// immediately, which could cut off an in-flight SSE stream mid-response
// for whoever is using the app at that exact moment. Instead, we stop
// accepting NEW connections and let in-flight requests finish naturally.
function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  server.close(() => {
    logger.info("All connections closed. Exiting.");
    process.exit(0);
  });

  // Safety net: if some connection never finishes (e.g. a truly stuck
  // stream), don't let the process hang forever — force exit after a
  // bounded grace period. .unref() means this timer alone won't keep
  // the process alive if everything else has already finished.
  setTimeout(() => {
    logger.warn("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// --- Process-level safety nets ---
// Per Node's own guidance, an uncaughtException means the process is in
// an unknown state — we log it and exit rather than keep running
// something potentially broken (App Runner will restart the container).
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception — exiting", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// A rejected Promise with no .catch() anywhere ends up here. We log it
// so it's visible, without crashing the process — most of our async code
// already has explicit error handling, so this is a last-resort net for
// anything that slips through.
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
