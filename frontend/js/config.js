// js/config.js
//
// Single source of truth for where the backend API lives.
// Why this file exists: when we deploy later (Docker / AWS App Runner),
// the frontend will need to call a different URL than localhost. Keeping
// it here means that's a one-line change, not a search-and-replace across
// every JS file.

const CONFIG = {
  API_BASE_URL: "https://campus-copilot-ai-49j4.onrender.com",
};
