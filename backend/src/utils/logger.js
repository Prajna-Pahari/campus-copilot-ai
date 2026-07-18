// src/utils/logger.js
//
// A minimal, dependency-free logging utility. Wraps console.* with a
// consistent timestamp + level prefix. Deliberately NOT using a logging
// library (winston/pino/etc.): at this project's scale, a few lines of
// console wrapping gives most of the real benefit (consistent format,
// clear levels) without adding a dependency. AWS App Runner captures
// container stdout/stderr automatically, so no log-shipping setup is
// needed for this output to show up in CloudWatch once deployed.
//
// If log volume/searchability needs grow significantly later, swapping
// this file's internals for a real logging library is a contained,
// one-file change — nothing else in the app talks to console directly.

function timestamp() {
  return new Date().toISOString();
}

function info(message, meta) {
  if (meta !== undefined) console.log(`[${timestamp()}] [INFO] ${message}`, meta);
  else console.log(`[${timestamp()}] [INFO] ${message}`);
}

function warn(message, meta) {
  if (meta !== undefined) console.warn(`[${timestamp()}] [WARN] ${message}`, meta);
  else console.warn(`[${timestamp()}] [WARN] ${message}`);
}

function error(message, meta) {
  if (meta !== undefined) console.error(`[${timestamp()}] [ERROR] ${message}`, meta);
  else console.error(`[${timestamp()}] [ERROR] ${message}`);
}

module.exports = { info, warn, error };
