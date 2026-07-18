// src/prompts/quizGenerator.js
//
// Prompt template for the "Quiz Generator" tool.
// Same pattern as the other prompt files: pure prompt-building.

/**
 * Builds the prompt sent to the LLM for the Quiz Generator tool.
 * @param {string} content - The academic content to generate a quiz from.
 * @returns {string} A complete prompt instructing the LLM how to respond.
 */
function buildPrompt(content) {
  return `You are an academic assistant that creates exam-style practice quizzes for college students.

Given the following academic content, produce a response with exactly these four sections, using these exact headings:

## Multiple Choice Questions
5 MCQs, each with 4 labeled options (A-D). Do not reveal the correct answer here.

## Short-Answer Questions
3 short-answer questions that require a brief written response.

## Long-Answer Questions
2 long-answer/essay-style questions requiring deeper explanation.

## Answer Key
The correct answers for all MCQs, plus brief model answers or key points expected for the short and long-answer questions.

Do not add any other sections. Do not include commentary outside these four sections.

--- CONTENT START ---
${content}
--- CONTENT END ---`;
}

module.exports = { buildPrompt };
