const express = require("express");
const crypto = require("crypto");
const dotenv = require("dotenv");
const { handleWebhookEvent } = require("./webhooks");
const { getRecentLogs, getRecentPrReviews, getSuccessRate } = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.get("/", (req, res) => {
  res.json({
    message: "GitHub App automation bot with PR review is running",
    version: "2.0.0",
    routes: [
      "POST /webhook",
      "GET /logs",
      "GET /pr-reviews",
      "GET /stats"
    ]
  });
});

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const payload = req.rawBody;

  if (!signature || !payload) {
    return res.status(401).json({ error: "Missing signature" });
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex")}`;

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const eventName = req.headers["x-github-event"];
  const body = req.body;

  try {
    await handleWebhookEvent(eventName, body);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

app.get("/logs", (req, res) => {
  const limit = Number(req.query.limit || 10);
  res.json({
    count: limit,
    logs: getRecentLogs(limit)
  });
});

app.get("/pr-reviews", (req, res) => {
  const limit = Number(req.query.limit || 10);
  res.json({
    count: limit,
    pr_reviews: getRecentPrReviews(limit)
  });
});

app.get("/stats", (req, res) => {
  res.json(getSuccessRate());
});

app.listen(PORT, () => {
  console.log(`GitHub App server with PR review running on http://localhost:${PORT}`);
});

module.exports = app;