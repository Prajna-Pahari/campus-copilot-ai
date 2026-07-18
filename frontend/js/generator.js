// js/generator.js
//
// The orchestrator: reacts to the Generate button click (or the
// Ctrl/Cmd+Enter shortcut), reads the current input + selected tool, and
// wires sse.js's callbacks to output.js's rendering functions. This is
// the only file that "knows" what clicking Generate means — it doesn't
// know how streaming works (sse.js's job) or how rendering works
// (output.js's job).

const Generator = (() => {
  let generateBtn;
  let contentInput;
  let isGenerating = false;

  function init() {
    generateBtn = document.getElementById("generate-btn");
    contentInput = document.getElementById("content-input");

    generateBtn.addEventListener("click", handleGenerateClick);

    // Accessibility/power-user convenience: Ctrl+Enter (Cmd+Enter on Mac)
    // submits without requiring a mouse trip to the button.
    contentInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerateClick();
      }
    });
  }

  function handleGenerateClick() {
    if (isGenerating) return; // ignore repeat clicks/shortcuts mid-stream

    const content = contentInput.value.trim();
    if (!content) {
      Output.showError("Please paste some content first.");
      return;
    }

    const tool = ToolSelector.getSelectedTool();

    Output.reset();
    setGeneratingState(true);

    streamGenerate(tool, content, {
      onToken: (token) => {
        Output.appendToken(token);
      },
      onDone: () => {
        Output.markComplete();
        setGeneratingState(false);
      },
      onError: (message) => {
        Output.showError(message);
        setGeneratingState(false);
      },
    });
  }

  /** Toggles the Generate button between idle and busy (spinner) states. */
  function setGeneratingState(generating) {
    isGenerating = generating;
    generateBtn.disabled = generating;
    generateBtn.classList.toggle("is-loading", generating);
    generateBtn.querySelector(".generate-btn__label").textContent = generating
      ? "Generating..."
      : "Generate";
  }

  return { init };
})();
