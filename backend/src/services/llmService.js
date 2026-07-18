// src/services/llmService.js
//
// This is the ONLY file that knows about the OpenAI-compatible API's
// request/response shape. Every other file that needs an LLM response
// just calls streamCompletion() below and doesn't care how it works
// under the hood. If we ever switch LLM providers, this is the one
// file that needs to change.
//
// We use Node's built-in `fetch` (no extra dependency needed) to call
// the provider's /chat/completions endpoint with `stream: true`.

const { env } = require("../config/env");
const logger = require("../utils/logger");

// Generous but bounded: real generations can legitimately take a while,
// but without SOME limit, a provider that hangs mid-stream (never sends
// [DONE], never closes the connection) would hold this request — and the
// SSE connection to the browser — open indefinitely, leaking a connection
// per stuck request.
const LLM_REQUEST_TIMEOUT_MS = 120000; // 2 minutes

/**
 * Streams a chat completion from the configured OpenAI-compatible API.
 *
 * @param {string} prompt - The fully-built prompt to send to the model.
 * @param {(token: string) => void} onToken - Called once per chunk of
 *   generated text, in order, as it arrives from the provider.
 * @returns {Promise<void>} Resolves once the stream has fully ended.
 * @throws {Error} If the HTTP request fails, or the provider doesn't
 *   finish within LLM_REQUEST_TIMEOUT_MS.
 */
async function streamCompletion(prompt, onToken) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    LLM_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${env.openaiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The API key never leaves the backend — the frontend never sees this.
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `LLM provider request failed (${response.status}): ${errorText || response.statusText}`,
      );
    }

    // OpenAI-compatible streaming responses are themselves formatted as
    // Server-Sent Events: a series of lines like:
    //   data: {"choices":[{"delta":{"content":"Hello"}}]}
    //   data: {"choices":[{"delta":{"content":" world"}}]}
    //   data: [DONE]
    // We read the raw bytes, decode them to text, and pull out just the
    // text fragments (the "delta.content" values) to hand to onToken.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; // holds any partial (not-yet-complete) line between reads

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on newlines. The provider sends complete lines ending in "\n",
      // but a network chunk might cut a line in half — so we keep the last
      // (possibly incomplete) piece in `buffer` for the next read.
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice("data:".length).trim();
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const textChunk = parsed.choices?.[0]?.delta?.content;
          if (textChunk) onToken(textChunk);
        } catch (err) {
          // A malformed chunk shouldn't crash the whole stream — log and continue.
          logger.warn("Skipping unparseable LLM stream chunk", {
            message: err.message,
          });
        }
      }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        `LLM provider did not finish within ${LLM_REQUEST_TIMEOUT_MS / 1000}s.`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { streamCompletion };
