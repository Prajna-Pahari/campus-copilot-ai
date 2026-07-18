// src/prompts/explainer.js
//
// Prompt template for the "Concept Explainer" tool.
// Same pattern as summarizer.js: pure prompt-building, no HTTP/Express code.

/**
 * Builds the prompt sent to the LLM for the Concept Explainer tool.
 * @param {string} content - The academic topic or concept to explain.
 * @returns {string} A complete prompt instructing the LLM how to respond.
 */
function buildPrompt(content) {
  return `You are an academic tutor skilled at explaining difficult topics clearly to college students.

Given the following topic or concept, produce a response with exactly these five sections, using these exact headings:

## Beginner Explanation
Explain the concept as simply as possible, assuming no prior background.

## College-Level Explanation
Explain the concept with the depth and terminology expected at college level.

## Real-World Analogy
Give one clear, relatable analogy that connects the concept to everyday life.

## Common Mistakes
A bullet list of misconceptions or errors students commonly make with this topic.

## Quick Recap
A short 2-3 sentence recap a student could read right before an exam.

Do not add any other sections. Do not include commentary outside these five sections.

--- TOPIC START ---
${content}
--- TOPIC END ---`;
}

module.exports = { buildPrompt };
