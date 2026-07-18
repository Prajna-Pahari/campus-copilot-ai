// src/routes/generateRoute.js
//
// Defines POST /api/generate — the single endpoint used by all three
// (and future) academic tools. The request body looks like:
//   { "tool": "summarizer", "content": "...pasted notes..." }
//
// This slice replaces the Slice 2 placeholder with a real, streamed LLM
// call. Instead of one JSON response, this endpoint keeps the HTTP
// connection open and sends a series of Server-Sent Events (SSE) as the
// model generates text, so the frontend can render output as it arrives.

const express = require("express");
const router = express.Router();

const validateGenerateRequest = require("../middleware/validateRequest");
const { toolRegistry } = require("../prompts");
const { streamCompletion } = require("../services/llmService");
const { sendEvent } = require("../utils/sseWriter");
const logger = require("../utils/logger");

router.post("/generate", validateGenerateRequest, async (req, res) => {
  const { tool, content } = req.body;

  // By the time we reach here, validateGenerateRequest has already
  // confirmed `tool` exists in toolRegistry, so this lookup is safe.
  const buildPrompt = toolRegistry[tool];

  // Building the prompt happens BEFORE any SSE headers are sent, so if it
  // ever throws, we can still return a normal JSON error response here —
  // this is deliberately a separate try/catch from the streaming one
  // below, which runs after headers are already committed.
  let prompt;
  try {
    prompt = buildPrompt(content);
  } catch (err) {
    logger.error("Prompt building failed", { tool, message: err.message });
    return res
      .status(500)
      .json({ error: "Failed to prepare the request. Please try again." });
  }

  // --- Set up the response as a Server-Sent Events stream ---
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    await streamCompletion(prompt, (token) => {
      sendEvent(res, { token });
    });

    // Tell the frontend generation has finished successfully.
    sendEvent(res, { done: true });
    res.end();
  } catch (err) {
    logger.error("LLM streaming error", { tool, message: err.message });
    // Headers are already sent by this point (streaming already started),
    // so we can't send a normal 500 JSON response — we send an SSE-shaped
    // error event instead, which the frontend already knows how to handle.
    sendEvent(res, {
      error: "Failed to generate a response. Please try again.",
    });
    res.end();
  }
});

module.exports = router;
