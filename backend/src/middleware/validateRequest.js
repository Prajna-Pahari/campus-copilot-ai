// src/middleware/validateRequest.js
//
// Express middleware that runs BEFORE the /api/generate route handler.
// A middleware function has the signature (req, res, next):
//   - call res.status(...).json(...) to stop the request here and respond
//     immediately (used below when the input is invalid)
//   - call next() to say "this is fine, continue to the actual route handler"
//
// Why this lives in its own file instead of inside the route: validation
// is a distinct concern from "what does this endpoint do." Separating it
// keeps the route handler focused only on its real job, and lets us reuse
// this same validation on any future endpoint that accepts { tool, content }.

const { toolRegistry } = require("../prompts");

// Arbitrary but reasonable cap on pasted content length. This protects
// against accidentally (or intentionally) huge requests driving up LLM
// costs or hitting model context limits. Adjust later if needed.
const MAX_CONTENT_LENGTH = 8000;

function validateGenerateRequest(req, res, next) {
  const { tool, content } = req.body;

  if (!tool || typeof tool !== "string") {
    return res.status(400).json({
      error: "'tool' is required and must be a string.",
    });
  }

  if (!toolRegistry[tool]) {
    return res.status(400).json({
      error: `Unknown tool: "${tool}". Valid tools are: ${Object.keys(toolRegistry).join(", ")}.`,
    });
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({
      error: "'content' is required and must be non-empty text.",
    });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({
      error: `'content' exceeds the maximum allowed length of ${MAX_CONTENT_LENGTH} characters.`,
    });
  }

  // Input looks good — hand off to the route handler.
  next();
}

module.exports = validateGenerateRequest;
