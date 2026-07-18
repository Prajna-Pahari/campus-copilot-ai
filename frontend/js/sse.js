// js/sse.js
//
// This is the ONLY file in the frontend that knows anything about how
// streaming actually works (Server-Sent Events, fetch's ReadableStream,
// parsing "data: ..." lines). Every other frontend file just calls
// streamGenerate() and receives plain callbacks — they have no idea SSE
// is involved, and they never touch the LLM provider's format either
// (the backend already normalized that). This mirrors how llmService.js
// is the only backend file that knows the LLM provider's wire format.
//
// If the transport ever changes (e.g. WebSockets instead of SSE), this
// is the only file that needs to change.

/**
 * Sends content to the backend for a given tool and streams the result.
 *
 * @param {string} tool - Which tool to run (must match a key the backend recognizes).
 * @param {string} content - The academic content pasted by the student.
 * @param {object} callbacks
 * @param {(text: string) => void} callbacks.onToken - Called with each chunk of generated text, in order.
 * @param {() => void} callbacks.onDone - Called once generation finishes successfully.
 * @param {(message: string) => void} callbacks.onError - Called if anything goes wrong.
 */
async function streamGenerate(tool, content, { onToken, onDone, onError }) {
  let response;
  try {
    response = await fetch(`${CONFIG.API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, content }),
    });
  } catch (networkErr) {
    // fetch itself throws on network failure (e.g. backend not running).
    onError("Could not reach the server. Is the backend running?");
    return;
  }

  // If the request failed validation (e.g. missing content), the backend
  // responds with a normal (non-streamed) JSON error, not SSE — because
  // validation happens before any streaming headers are set. Handle that
  // case separately from the streaming path below.
  if (!response.ok) {
    try {
      const errorBody = await response.json();
      onError(errorBody.error || "Something went wrong. Please try again.");
    } catch {
      onError("Something went wrong. Please try again.");
    }
    return;
  }

  // From here on, the response body is an SSE stream: a series of lines
  // like `data: {"token":"..."}\n\n`, ending with `data: {"done":true}`.
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines; keep any incomplete trailing line in buffer,
    // same approach as the backend uses when reading from the LLM provider.
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const data = trimmed.slice("data:".length).trim();
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue; // skip malformed lines rather than crashing
      }

      if (parsed.error) {
        onError(parsed.error);
        return;
      }
      if (parsed.done) {
        onDone();
        return;
      }
      if (parsed.token) {
        onToken(parsed.token);
      }
    }
  }

  // If the stream ended without an explicit "done" event, still tell
  // the caller generation has finished so the UI doesn't hang.
  onDone();
}
