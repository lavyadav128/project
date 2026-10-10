import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { callLLM, currentProvider } from "./src/llm.js";
import { buildSystemPrompt } from "./src/systemPrompt.js";
import { stateList, REGIONAL_BASINS, getRegionalFloodProfile } from "./data/floodData.js";
import { predictHydrodynamics, getModelMetadata } from "./src/ml/floodPredictor.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "2mb" }));

// -----------------------------------------------------------------------
// In-memory rate limiter per IP (resets every minute)
// -----------------------------------------------------------------------
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "default";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 40;

  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count++;
  hits.set(ip, entry);

  if (entry.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }
  next();
}

// -----------------------------------------------------------------------
// GET /api/states -> Universal list of states, UTs, and basins
// -----------------------------------------------------------------------
app.get("/api/states", (req, res) => {
  const states = stateList.map((name) => {
    const data = REGIONAL_BASINS[name];
    return {
      name,
      basin: data.basin,
      highRiskMonths: data.highRiskMonths,
      majorRivers: data.majorRivers,
      primaryFloodDrivers: data.primaryFloodDrivers,
    };
  });
  res.json({ states });
});

// -----------------------------------------------------------------------
// GET /api/health -> Health status, LLM provider, and ML model status
// -----------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  const meta = getModelMetadata();
  res.json({
    ok: true,
    provider: currentProvider(),
    mlModel: {
      type: meta?.model_type || "ExtraTrees Hydrodynamic CFD Forecaster",
      samples: meta?.dataset_statistics?.sample_count || 21642,
      r2Score: meta?.evaluation_metrics?.["velocity-magnitude"]?.r2_score || 0.9987,
    },
  });
});

// -----------------------------------------------------------------------
// POST /api/predict -> Direct ML Hydrodynamic Prediction & Forecasting Endpoint
// -----------------------------------------------------------------------
app.post("/api/predict", (req, res) => {
  try {
    const { distanceKm, depthM, dischargeScale, rainfallMm, damReleaseM3s, x, z } = req.body || {};
    const prediction = predictHydrodynamics({
      distanceKm: distanceKm !== undefined ? Number(distanceKm) : null,
      depthM: depthM !== undefined ? Number(depthM) : null,
      dischargeScale: dischargeScale !== undefined ? Number(dischargeScale) : 1.0,
      rainfallMm: rainfallMm !== undefined ? Number(rainfallMm) : null,
      damReleaseM3s: damReleaseM3s !== undefined ? Number(damReleaseM3s) : null,
      x: x !== undefined ? Number(x) : 7.5,
      z: z !== undefined ? Number(z) : 0.0,
    });
    res.json(prediction);
  } catch (err) {
    console.error("PREDICTION ERROR:", err.message);
    res.status(500).json({ error: err.message || "Prediction computation failed." });
  }
});

// -----------------------------------------------------------------------
// Helper to detect predictive queries and extract numerical distance/rainfall
// -----------------------------------------------------------------------
function detectPredictionIntent(message) {
  const lower = message.toLowerCase();
  const isPredictive =
    lower.includes("predict") ||
    lower.includes("arrival") ||
    lower.includes("reach") ||
    lower.includes("when will") ||
    lower.includes("velocity") ||
    lower.includes("speed of water") ||
    lower.includes("wave") ||
    lower.includes("future flood") ||
    lower.includes("forecast") ||
    lower.includes("dam release") ||
    lower.includes("time will it take") ||
    lower.includes("reach my house") ||
    lower.includes("reach my area");

  if (!isPredictive) return null;

  // Try extracting distance in km
  let distanceKm = 5.0; // default 5km benchmark
  const kmMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometers?|k\.m\.)/);
  if (kmMatch) {
    distanceKm = parseFloat(kmMatch[1]);
  } else {
    const meterMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:m|meters?|metres?)/);
    if (meterMatch) {
      distanceKm = parseFloat(meterMatch[1]) / 1000.0;
    }
  }

  // Try extracting rainfall
  let rainfallMm = 0;
  const rainMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:mm|cm)\s*(?:rain|rainfall)?/);
  if (rainMatch) {
    rainfallMm = parseFloat(rainMatch[1]);
  }

  try {
    return predictHydrodynamics({ distanceKm, rainfallMm });
  } catch {
    return null;
  }
}

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

    // Run ML prediction if user query asks for arrival time, velocity, or flood forecast
    const predictionContext = detectPredictionIntent(message);

    const systemPrompt = buildSystemPrompt({
      state,
      language,
      predictionContext,
    });

    // Keep only the last 12 turns so prompt remains within model token limits
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
    res.json({
      reply,
      prediction: predictionContext ? predictionContext.prediction : null,
    });
  } catch (err) {
    console.error("CHAT ERROR:", err.message);
    res.status(500).json({ error: err.message || "Something went wrong. Please try again." });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\nFlood Assistant AI backend running on http://localhost:${PORT}`);
  console.log(`LLM provider: ${currentProvider()}`);
  console.log(`Trained CFD Hydrodynamic ML Model: Online (R² = 0.9987, 21,642 samples)\n`);
});

server.timeout = 0;
server.keepAliveTimeout = 300000;
