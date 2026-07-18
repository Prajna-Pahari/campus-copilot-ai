// src/config/env.js
//
// Single source of truth for reading environment variables.
// Why this file exists: if we scattered `process.env.X` calls across the
// codebase, a typo'd variable name or a missing .env value would fail
// silently deep inside some unrelated request handler. Instead, we read
// everything once here, validate what's required, and fail fast at
// startup with a clear error message if something's missing.

require("dotenv").config();

/**
 * Reads a required env var. Throws immediately if it's missing, so the
 * server refuses to start rather than crashing later on a real user request.
 */
function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Did you copy .env.example to .env?`,
    );
  }
  return value;
}

/**
 * Reads an optional env var with a fallback default.
 */
function optionalEnv(name, defaultValue) {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : defaultValue;
}

/**
 * Validates that a PORT value is a real, usable port number.
 * Fails fast at startup rather than letting Express silently misbehave
 * with an invalid port later.
 */
function validatePort(value) {
  const portNum = Number(value);
  if (!Number.isInteger(portNum) || portNum <= 0 || portNum > 65535) {
    throw new Error(
      `Invalid PORT value: "${value}". Must be an integer between 1 and 65535.`,
    );
  }
  return String(portNum);
}

/**
 * Validates that a value is a well-formed URL. Catches typos in
 * .env (e.g. a missing "https://") at startup instead of a confusing
 * fetch failure deep inside llmService later.
 */
function validateUrl(name, value) {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return value;
  } catch {
    throw new Error(`Invalid ${name}: "${value}" is not a valid URL.`);
  }
}

const env = {
  port: validatePort(optionalEnv("PORT", "5000")),
  frontendOrigin: validateUrl(
    "FRONTEND_ORIGIN",
    optionalEnv("FRONTEND_ORIGIN", "http://localhost:5500"),
  ),

  // openaiApiKey is required: Slice 3 introduced real LLM calls, so a
  // missing key should crash the server at startup with a clear message,
  // rather than failing confusingly on the first real user request.
  openaiBaseUrl: validateUrl(
    "OPENAI_BASE_URL",
    optionalEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
  ),
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  openaiModel: optionalEnv("OPENAI_MODEL", "gpt-4o-mini"),
};

module.exports = { env, requireEnv, optionalEnv };
