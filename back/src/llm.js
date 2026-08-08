// =====================================================================
// LLM PROVIDER SWITCH
// One function, callLLM(messages), that sends your chat to whichever
// provider you've picked in .env — no other file needs to know or care
// which one is active.
//
//   LLM_PROVIDER=openrouter   -> uses OpenRouter's free-tier cloud API
//   LLM_PROVIDER=ollama       -> uses a local Ollama model on your PC
// =====================================================================

import fetch from "node-fetch";
import dotenv from "dotenv";

// IMPORTANT: dotenv must be loaded here (not just in server.js) because ES
// module imports are evaluated before the importing file's own code runs.
// If we relied on server.js's dotenv.config() alone, this file would read
// process.env.LLM_PROVIDER before the .env file had actually been loaded.
dotenv.config();

const PROVIDER = (process.env.LLM_PROVIDER || "openrouter").toLowerCase();

// ---------------------------------------------------------------------
// OPTION 1: OpenRouter (cloud, free-tier models)
// ---------------------------------------------------------------------
async function callOpenRouter(messages) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

  if (!apiKey || apiKey.includes("your-key-here")) {
    throw new Error(
      "OPENROUTER_API_KEY is missing. Get a free key at https://openrouter.ai/keys and put it in back/.env"
    );
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Flood Query Assistant",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4, // lower = more factual/consistent, good for safety info
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    console.error("OpenRouter error:", data);
    throw new Error(
      data?.error?.message ||
        "OpenRouter request failed. Check your API key, or that the model in .env is still free/available."
    );
  }

  return data?.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response. Please try again.";
}

// ---------------------------------------------------------------------
// OPTION 2: Ollama (local, offline)
// ---------------------------------------------------------------------
async function callOllama(messages) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  let res;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.4 } }),
    });
  } catch (err) {
    throw new Error(
      `Could not reach Ollama at ${baseUrl}. Is Ollama installed and running? Try "ollama serve" in a terminal, and make sure you've run "ollama pull ${model}" at least once.`
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    console.error("Ollama error:", data);
    throw new Error("Ollama request failed. See server logs for details.");
  }

  return data?.message?.content?.trim() || "I couldn't generate a response. Please try again.";
}

// ---------------------------------------------------------------------
// PUBLIC: pick the right provider based on .env
// ---------------------------------------------------------------------
export async function callLLM(messages) {
  if (PROVIDER === "ollama") return callOllama(messages);
  if (PROVIDER === "openrouter") return callOpenRouter(messages);
  throw new Error(`Unknown LLM_PROVIDER "${PROVIDER}" in .env — use "openrouter" or "ollama".`);
}

export function currentProvider() {
  return PROVIDER;
}
