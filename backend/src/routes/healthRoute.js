// src/routes/healthRoute.js
//
// A minimal endpoint that reports the service is up and responding.
// Why this file exists: it's how we (locally) and later AWS App Runner
// (in production) verify the container is alive and ready to take traffic.
// App Runner can be configured to hit this path as a health check and
// restart the container if it stops responding.

const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "campus-copilot-ai-backend",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
