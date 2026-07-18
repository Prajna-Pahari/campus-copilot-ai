// js/toolSelector.js
//
// Manages which of the 3 tools is currently selected, keeps the UI (the
// tool cards) in sync via the aria-pressed attribute (both a visual hook
// for CSS and a screen-reader-accessible state), and supports arrow-key
// navigation across the cards. This file has no idea what happens after
// a tool is selected — generator.js reacts to selection on Generate.

const ToolSelector = (() => {
  let selectedTool = "summarizer"; // sensible default: first tool active on load
  let cards;

  function init() {
    cards = Array.from(document.querySelectorAll(".tool-card"));

    cards.forEach((card, index) => {
      card.addEventListener("click", () => selectTool(card.dataset.tool));

      // Arrow keys move focus between cards, matching the standard
      // keyboard pattern for a group of related, mutually-exclusive
      // options (like a tab list).
      card.addEventListener("keydown", (e) => {
        if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
        e.preventDefault();

        const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
        const nextIndex = forward
          ? (index + 1) % cards.length
          : (index - 1 + cards.length) % cards.length;
        cards[nextIndex].focus();
      });
    });

    selectTool(selectedTool);
  }

  function selectTool(tool) {
    selectedTool = tool;
    cards.forEach((card) => {
      card.setAttribute("aria-pressed", String(card.dataset.tool === tool));
    });
  }

  function getSelectedTool() {
    return selectedTool;
  }

  return { init, getSelectedTool };
})();
