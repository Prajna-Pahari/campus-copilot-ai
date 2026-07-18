// src/prompts/index.js
//
// The "tool registry" — a single lookup table mapping a tool's string
// identifier (as sent by the frontend in the request body, e.g. "summarizer")
// to the function that knows how to build a prompt for that tool.
//
// Why this file exists: without it, both the route handler and the
// validation middleware would need their own list of "which tools exist,"
// and those lists could drift out of sync. By importing this one registry
// everywhere, there's exactly one place that defines what tools are valid.
//
// To add a new tool later (e.g. Flashcards):
//   1. Create src/prompts/flashcards.js exporting buildPrompt(content)
//   2. Add one line below: flashcards: flashcards.buildPrompt
// No other file needs to change.

const summarizer = require("./summarizer");
const explainer = require("./explainer");
const quizGenerator = require("./quizGenerator");

const toolRegistry = {
  summarizer: summarizer.buildPrompt,
  explainer: explainer.buildPrompt,
  quiz: quizGenerator.buildPrompt,
};

module.exports = { toolRegistry };
