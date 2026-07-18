// js/output.js
//
// Owns the output panel: rendering streamed text, the empty state, the
// streaming cursor, error display, and the Copy/Download actions. This
// file doesn't know or care where the text came from (SSE, LLM, whatever)
// — it just receives plain strings to display.
//
// Note on innerHTML: to visually style the "## Heading" and "- [ ]"
// checklist lines our own prompt templates always produce, this file
// renders formatted HTML instead of plain textContent. Because the
// underlying text originates from an LLM, escapeHtml() runs FIRST on
// every render so nothing in generated text can ever inject markup.

const Output = (() => {
  let outputEl;
  let emptyEl;
  let copyBtn;
  let downloadBtn;
  let currentText = "";

  function init() {
    outputEl = document.getElementById("output-text");
    emptyEl = document.getElementById("output-empty");
    copyBtn = document.getElementById("copy-btn");
    downloadBtn = document.getElementById("download-btn");

    copyBtn.addEventListener("click", copyToClipboard);
    downloadBtn.addEventListener("click", downloadAsFile);
  }

  /** Escapes HTML special characters so generated text can never be
   *  interpreted as markup when we set innerHTML below. */
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /** Turns "## Heading" and "- [ ] item" lines into styled spans.
   *  Everything else passes through unchanged (still escaped). */
  function formatOutput(text) {
    return escapeHtml(text)
      .split("\n")
      .map((line) => {
        const heading = line.match(/^##\s+(.*)/);
        if (heading) return `<span class="output-heading">${heading[1]}</span>`;

        const checklistItem = line.match(/^-\s*\[\s*\]\s*(.*)/);
        if (checklistItem) return `<span class="output-checklist-item">${checklistItem[1]}</span>`;

        return line;
      })
      .join("\n");
  }

  /** Clears the output panel and shows the empty state — called right
   *  before a new generation starts. */
  function reset() {
    currentText = "";
    outputEl.innerHTML = "";
    outputEl.classList.remove("is-visible");
    emptyEl.style.display = "flex";
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
  }

  /** Appends a chunk of streamed text and re-renders with a blinking
   *  cursor at the end, indicating generation is still in progress. */
  function appendToken(token) {
    currentText += token;
    emptyEl.style.display = "none";
    outputEl.classList.add("is-visible");
    outputEl.innerHTML = formatOutput(currentText) + '<span class="output-cursor"></span>';
  }

  /** Called once generation finishes successfully: removes the cursor
   *  and enables Copy/Download. */
  function markComplete() {
    outputEl.innerHTML = formatOutput(currentText);
    if (currentText) {
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
    }
  }

  /** Displays an error message. If some content already streamed in
   *  before the error occurred, it's preserved and shown alongside the
   *  error (rather than silently erased) — but `currentText` itself is
   *  left unchanged, so Copy/Download never include the error notice,
   *  only genuinely generated content. */
  function showError(message) {
    emptyEl.style.display = "none";
    outputEl.classList.add("is-visible");
    outputEl.innerHTML =
      formatOutput(currentText) + `<span class="output-error-notice">${escapeHtml(message)}</span>`;

    if (currentText) {
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
    }
  }

  /** Briefly flips a button's label to confirm an action succeeded,
   *  then reverts it — the only feedback mechanism these buttons need. */
  function flashSuccess(button, tempLabel) {
    const originalLabel = button.textContent;
    button.textContent = tempLabel;
    button.classList.add("is-success");
    setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove("is-success");
    }, 1500);
  }

  function copyToClipboard() {
    if (!currentText) return;
    navigator.clipboard.writeText(currentText).then(() => {
      flashSuccess(copyBtn, "Copied ✓");
    });
  }

  function downloadAsFile() {
    if (!currentText) return;
    const blob = new Blob([currentText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "campus-copilot-output.txt";
    link.click();

    URL.revokeObjectURL(url);
    flashSuccess(downloadBtn, "Downloaded ✓");
  }

  return { init, reset, appendToken, markComplete, showError };
})();
