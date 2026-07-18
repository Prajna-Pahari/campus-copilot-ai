// src/prompts/summarizer.js
//
// Prompt template for the "Smart Notes Summarizer" tool.
// This file's only job: turn raw student notes (a string) into a prompt
// string that instructs the LLM to produce a specific, predictable
// structure. Keeping this separate from routing/validation means we can
// tweak wording here freely without touching any request-handling code.

/**
 * Builds the prompt sent to the LLM for the Summarizer tool.
 * @param {string} content - Raw academic notes pasted by the student.
 * @returns {string} A complete prompt instructing the LLM how to respond.
 */
function buildPrompt(content) {
  return `You are an academic study assistant helping a college student prepare for exams.

Given the following study notes, produce a response with exactly these four sections, using these exact headings:

## Summary
A concise summary of the material (aim for clarity, not just brevity).

## Key Concepts
A bullet list of the core concepts a student must understand.

## Important Exam Points
A bullet list of details, facts, or nuances that are commonly tested.

## Revision Checklist
A checklist (using "- [ ]" markdown checkbox syntax) the student can use to self-verify they've mastered the material before an exam.

Do not add any other sections. Do not include commentary outside these four sections.

--- STUDY NOTES START ---
${content}
--- STUDY NOTES END ---`;
}

module.exports = { buildPrompt };
