import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { callLLM, currentProvider } from "./src/llm.js";
import { buildSystemPrompt } from "./src/systemPrompt.js";
import { floodData, stateList } from "./data/floodData.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// -----------------------------------------------------------------------
// Very small in-memory rate limiter (per IP). Good enough for a college
// demo running on one machine. Resets every minute.
// -----------------------------------------------------------------------
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count++;
  hits.set(ip, entry);

  if (entry.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please wait a bit and try again." });
  }
  next();
}

// -----------------------------------------------------------------------
// GET /api/states  -> lets the frontend fetch the list of states we have
// demo data for, instead of hardcoding it twice.
// -----------------------------------------------------------------------
app.get("/api/states", (req, res) => {
  const states = stateList.map((name) => ({
    name,
    highRiskMonths: floodData[name].highRiskMonths,
    majorRivers: floodData[name].majorRivers,
  }));
  res.json({ states });
});

// -----------------------------------------------------------------------
// GET /api/health -> quick check of which LLM provider is active
// -----------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, provider: currentProvider() });
});

// -----------------------------------------------------------------------
// POST /api/chat
// body: { message: string, state: string, language: string, history: [{role, content}] }
// -----------------------------------------------------------------------
app.post("/api/chat", rateLimit, async (req, res) => {
  try {
    const { message, state, language, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const systemPrompt = buildSystemPrompt({ state, language });

    // Keep only the last 12 turns so the prompt doesn't grow unbounded.
    const trimmedHistory = history.slice(-12).map((h) => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: String(h.content || "").slice(0, 4000),
    }));

    const messages = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory,
      { role: "user", content: message.slice(0, 4000) },
    ];

    const reply = await callLLM(messages);
    res.json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err.message);
    res.status(500).json({ error: err.message || "Something went wrong. Please try again." });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\nFlood Assistant backend running on http://localhost:${PORT}`);
  console.log(`LLM provider: ${currentProvider()}\n`);
});

// Node's default server timeout can kill long-running requests before a
// slow local Ollama model finishes generating. Disable it so responses
// aren't cut off mid-generation.
server.timeout = 0;
server.keepAliveTimeout = 300000;
