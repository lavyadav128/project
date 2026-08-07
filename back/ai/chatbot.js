// =========================
// OLLAMA CALL
// =========================
// This whole block below is COMMENTED OUT (disabled) — it was an older way to call a local AI model called Ollama
// "async function" means this function is asynchronous — it waits for the AI to respond before continuing
// async function callLLM(messages) {
//   const res = await fetch("http://127.0.0.1:11434/api/chat", {   // Sends a POST request to Ollama running on your own computer (localhost)
//     method:  "POST",                                               // POST means we are SENDING data (not just reading a page)
//     headers: { "Content-Type": "application/json" },              // Telling the server: "I'm sending JSON format data"
//     body: JSON.stringify({                                         // JSON.stringify converts a JS object into a JSON string so it can be sent over the internet
//       model:    "qwen2.5:1.5b",                                   // The name of the AI model to use (a small 1.5 billion parameter model)
//       messages,                                                    // The list of chat messages (user + assistant history) to send
//       stream:   false,                                             // Don't stream the response — wait and get the full reply at once
//     }),
//   });

//   const data = await res.json();                                   // Convert the raw HTTP response into a JavaScript object
//   return data?.message?.content || "No response generated";       // Return the AI's reply text, or a fallback message if empty
// }


// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS — bringing in tools/libraries we need to run this file
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";                    // Express is a web framework — it helps us create routes (like /chatbot)
import fs from "fs";                               // fs = File System — lets us read/write files on the computer
import path from "path";                           // path helps us work with file paths (like folder/file.json)
import fetch from "node-fetch";                    // fetch lets us make HTTP requests (call APIs) from Node.js
import { createRequire } from "module";            // createRequire lets us use old-style "require()" in modern ES module files
import { rateLimiter } from "../middleware/rateLimit.js"; // Protects this route from being spammed (it costs money per API call)

const require = createRequire(import.meta.url);    // Creates a custom require() function so we can import CommonJS packages
const pdfParse = require("pdf-parse");             // pdf-parse is a library that reads text out of PDF files

const router = express.Router();                   // Creates a mini-router — like a mini Express app just for this file's routes


// =========================
// VECTOR STORE
// =========================

// This section loads the pre-built vector database (a list of text chunks + their embeddings saved as a JSON file)

const VECTOR_STORE_PATH = path.join(path.resolve(), "ai", "vector_store.json");
// path.resolve() gives the full absolute path of the current working directory
// path.join(...) combines it with "ai/vector_store.json" to get the full file path

const vectorStore = JSON.parse(
  fs.readFileSync(VECTOR_STORE_PATH, "utf-8")
);
// fs.readFileSync reads the file synchronously (blocking — waits until done)
// JSON.parse converts the JSON string from the file into a JavaScript array/object
// vectorStore now holds ALL the text chunks and their vector embeddings in memory


// =========================
// EMBEDDINGS (lazy load)
// =========================

// This section handles loading the embedding model — which converts text into numbers (vectors)
// "Lazy load" means we only load it the FIRST time it's needed, not at app startup (saves memory/time)

let embedder = null; // Start with null — model not loaded yet

async function getEmbedder() {
  // This function returns the embedder model, loading it only once

  if (!embedder) {
    // If embedder is still null (not loaded yet), load it now

    const transformers = await import("@xenova/transformers");
    // Dynamically imports the Transformers.js library (an ML library that runs AI models in Node.js)

    embedder = await transformers.pipeline(
      "feature-extraction",           // Task type: extract feature vectors (embeddings) from text
      "Xenova/all-MiniLM-L6-v2"       // Model name: a small, fast sentence embedding model
    );
    // "pipeline" sets up the model so we can run text through it easily
  }
  return embedder; // Return the loaded model (or the already-loaded one)
}


// =========================
// COSINE SIMILARITY
// =========================

// This function measures how SIMILAR two vectors are
// Returns a number from -1 (opposite) to 1 (identical) — higher = more similar

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  // dot = dot product (sum of a[i] * b[i])
  // na = magnitude of vector a (sum of squares)
  // nb = magnitude of vector b (sum of squares)

  for (let i = 0; i < a.length; i++) {
    // Loop through every dimension of the vectors

    dot += a[i] * b[i]; // Multiply matching dimensions and add to dot product
    na += a[i] ** 2;     // Square each value of a and add to na
    nb += b[i] ** 2;     // Square each value of b and add to nb
  }

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
  // Cosine similarity formula: dot product divided by (magnitude of a × magnitude of b)
  // Math.sqrt converts sum-of-squares into the actual magnitude (length) of the vector
}


// =========================
// VECTOR SEARCH (RAG)
// =========================

// RAG = Retrieval-Augmented Generation
// This function finds the TOP K most relevant text chunks from the vector store for a given query

async function searchChunks(query, k = 6) {
  // query = the user's question
  // k = how many top results to return (default: 6)

  const model = await getEmbedder();
  // Get the embedding model (loads it if not already loaded)

  const embedding = await model(query, {
    pooling: "mean",     // Average all token embeddings to get one single vector for the whole sentence
    normalize: true      // Scale the vector to length 1 (makes cosine similarity more accurate)
  });
  // Convert the query text into a vector (array of numbers)

  const qVec = Array.from(embedding.data);
  // embedding.data is a typed array (Float32Array) — convert it to a regular JS array

  return vectorStore
    .map(item => ({
      ...item,                              // Keep all existing properties of the chunk (text, metadata, etc.)
      score: cosine(qVec, item.embedding)  // Add a "score" = similarity between query vector and this chunk's vector
    }))
    .sort((a, b) => b.score - a.score)     // Sort by score descending (highest similarity first)
    .slice(0, k);                           // Take only the top K results
}


// =========================
// TOPIC DETECTION
// =========================

// Figures out WHICH chapter/topic is most represented in the retrieved chunks

function detectTopic(chunks, context) {
  const map = {};
  // map = an object used as a counter: { "Chapter 3": 2, "Chapter 1": 1 }

  for (const c of chunks) {
    // Loop through each retrieved chunk

    const chapter = c.metadata?.chapter || "Unknown";
    // Get the chapter name from the chunk's metadata (optional chaining ?. prevents crash if metadata is undefined)
    // If no chapter found, use "Unknown"

    map[chapter] = (map[chapter] || 0) + 1;
    // Count how many chunks belong to each chapter
    // If this chapter hasn't been seen yet, start at 0, then add 1
  }

  const best = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  // Object.entries(map) = converts the object into [[chapter, count], ...] pairs
  // .sort(...) sorts by count descending (most frequent chapter first)
  // [0] = take the first (most frequent) chapter

  return {
    chapter: best?.[0] || "Unknown",               // Name of the most common chapter
    subject: chunks[0]?.metadata?.subject || "General", // Subject from the first chunk's metadata
    urlTopic: context?.topic || "Unknown"           // Topic extracted from the page URL context
  };
}


// =========================
// URL TOPIC PARSER
// =========================

// Converts a URL slug like "binary-search-trees" into readable text like "Binary Search Trees"

function topicFromUrl(context) {
  const slug = context?.topic || "";
  // Get the topic slug from context (e.g., "binary-search-trees")
  // If not present, use empty string

  return slug
    .split("-")                                          // Split by hyphens: ["binary", "search", "trees"]
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))   // Capitalize first letter of each word
    .join(" ") || "the current topic";                  // Join back with spaces: "Binary Search Trees"
    // If slug was empty, fall back to "the current topic"
}


// =========================
// FORMAT RULES (AI STYLE)
// =========================

// A string of formatting instructions passed to the AI to control how it writes responses

const FORMAT_RULES = `
- Use headings (##)
- Use bullet points
- Keep answers structured
- Bold important terms
- Keep explanation beginner friendly
`;
// This is a template literal (backtick string) — can span multiple lines
// These rules are injected into the system prompt so the AI always formats nicely


// =========================
// MESSAGE ENRICHER
// =========================

// Adds extra context to the user's message based on keywords they used
// So "explain" becomes "Explain Binary Search Trees" instead of just "explain"

function enrichMessage(message, topic) {
  const lower = message.toLowerCase();
  // Convert message to lowercase so keyword matching is case-insensitive

  if (lower.includes("summar")) return `Summarize ${topic}`;  // "summar" catches "summarize", "summary", etc.
  if (lower.includes("explain")) return `Explain ${topic}`;   // If user says "explain", prepend the topic
  if (lower.includes("quiz")) return `Create quiz on ${topic}`; // If user wants a quiz, frame it around the topic
  if (lower.includes("key")) return `Key points of ${topic}`; // If user asks for key points

  return `${message}\n(Context: ${topic})`;
  // Default: just append the topic as context so the AI knows what we're talking about
}


// =========================
// BUILD MESSAGES (RAG PROMPT)
// =========================

// Constructs the full array of messages to send to the AI API
// Includes: system instructions, study material, chat history, and the user's message

function buildMessages(message, context, chunks, history) {
  const studyMaterial = chunks.map(c => c.text).join("\n\n");
  // Extract just the text from each retrieved chunk and join them with blank lines

  const topic = topicFromUrl(context);
  // Convert the URL slug into a readable topic name

  const systemPrompt = `
You are an AI Study Copilot inside an EdTech platform.

Current Topic: ${topic}
URL: ${context.fullUrl || "unknown"}

Use study material first, then general knowledge.

Study Material:
${studyMaterial}

Rules:
${FORMAT_RULES}
`;
  // The system prompt sets the AI's role and gives it the study material + formatting rules
  // Template literals (backticks) let us embed variables with ${}

  const historyMessages = history.map(h => ({
    role: h.role === "bot" ? "assistant" : "user",
    // AI APIs use "assistant" not "bot" — convert our internal naming to the API's naming
    content: h.content
    // Keep the message content as-is
  }));
  // Converts our chat history array into the format the AI API expects

  return [
    { role: "system", content: systemPrompt },  // First message: system instructions
    ...historyMessages,                          // Spread in all previous conversation turns
    {
      role: "user",
      content: enrichMessage(message, topic)    // Last message: the enriched user query
    }
  ];
  // Final array of messages ready to send to the LLM
}


// =========================
// PDF TEXT EXTRACTION
// =========================

// Takes a base64-encoded PDF string, decodes it, and extracts the raw text

async function extractPdfText(base64) {
  const buffer = Buffer.from(base64, "base64");
  // Buffer.from converts the base64 string back into binary data (the actual PDF bytes)

  const data = await pdfParse(buffer);
  // pdfParse reads the binary PDF and extracts all text from it

  return data.text.slice(0, 15000);
  // Return only the first 15,000 characters to avoid hitting the AI's context limit
}


// =========================
// OPENROUTER LLM (FINAL FIX)
// =========================

// This is the ACTIVE LLM caller — sends messages to OpenRouter API (which routes to real AI models)

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Read the API key from environment variables (never hardcode secret keys in code!)
// process.env = a Node.js object containing all environment variables set on the system

async function callLLM(messages) {
  // messages = array of { role, content } objects to send to the AI

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not set");
    // If the API key is missing, throw an error immediately — can't call the API without it
  }

  const res = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    // OpenRouter's API endpoint — it's OpenAI-compatible format
    {
      method: "POST",                                    // POST = we're sending data
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`, // API key sent as a Bearer token for authentication
        "Content-Type": "application/json",              // We're sending JSON
        "HTTP-Referer": "http://localhost",              // Required by OpenRouter — identifies your app's origin
        "X-Title": "AI Study Copilot"                   // Optional — names your app in OpenRouter's dashboard
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-9b-v2:free",                // ✅ updated
        messages,                                        // The full conversation to send
        temperature: 0.7                                 // Controls randomness: 0 = very focused, 1 = very creative
      })
    }
  );

  let data;
  try {
    data = await res.json();
    // Try to parse the JSON response from OpenRouter
  } catch {
    return "Invalid AI response";
    // If JSON parsing fails (e.g., network error, bad response), return a safe fallback
  }

  if (!res.ok) {
    // res.ok is true if HTTP status is 200–299; false means something went wrong
    console.log("OpenRouter error:", data); // Log the error details for debugging
    return "AI service error";              // Return a user-friendly error message
  }

  return data?.choices?.[0]?.message?.content || "No response";
  // Navigate the OpenRouter response structure to get the AI's reply text
  // choices[0] = first (and usually only) response option
  // .message.content = the actual text the AI generated
  // If anything is missing/null, fall back to "No response"
}


// =========================
// MAIN ROUTE
// =========================

// This is the actual HTTP endpoint — POST /chatbot
// It receives the user's message and returns the AI's reply

router.post("/chatbot", rateLimiter({ requests: 10, window: '1 m', prefix: 'rl:chatbot' }), async (req, res) => {
    // router.post sets up a POST route at "/chatbot"
  // req = request object (contains what the client sent)
  // res = response object (used to send data back to the client)

  try {
    const { message, context = {}, history = [], pdf } = req.body;
    // Destructure the request body into individual variables
    // message = the user's chat message (required)
    // context = page info like topic, URL (defaults to empty object if not sent)
    // history = previous chat messages (defaults to empty array)
    // pdf = optional PDF data (base64 + filename) for PDF summarization mode

    if (!message) {
      return res.status(400).json({
        reply: "Message required"
      });
      // If no message was sent, respond with HTTP 400 (Bad Request) and an error message
      // "return" stops further execution
    }

    // =========================
    // PDF MODE
    // =========================

    if (message === "__PDF_SUMMARISE__" && pdf?.base64) {
      // Special trigger: if the message is exactly "__PDF_SUMMARISE__" AND a PDF was provided
      // This is a special internal signal from the frontend to summarize a PDF

      const text = await extractPdfText(pdf.base64);
      // Extract text from the base64-encoded PDF

      const msgs = [
        {
          role: "system",
          content: "You are a PDF summarizer"
          // Simple system prompt for PDF mode — just tell AI its job
        },
        {
          role: "user",
          content: text
          // Send the extracted PDF text as the user's message
        }
      ];

      const reply = await callLLM(msgs);
      // Call the AI with the PDF text and get a summary

      return res.json({
        reply,                               // The AI-generated summary
        detected: {
          chapter: "PDF",                    // No real chapter for PDF mode — hardcode "PDF"
          subject: pdf.name                  // Use the PDF filename as the subject
        }
      });
      // Send the response back to the client and stop here
    }

    // =========================
    // NORMAL CHAT (RAG)
    // =========================

    const chunks = await searchChunks(message, 6);
    // Find the 6 most relevant text chunks from the vector store for this user message

    const msgs = buildMessages(message, context, chunks, history);
    // Build the full message array (system prompt + study material + history + user message)

    const reply = await callLLM(msgs);
    // Send everything to the AI and get a reply

    res.json({
      reply,                               // The AI's answer
      detected: detectTopic(chunks, context) // Info about which chapter/topic was detected
    });
    // Send the final JSON response back to the frontend

  } catch (err) {
    // If ANY error occurs anywhere in the try block, this catch block runs

    console.error("CHATBOT ERROR:", err);
    // Log the full error to the server console for debugging

    res.status(500).json({
      reply: "Server error: " + err.message
    });
    // Send HTTP 500 (Internal Server Error) with the error message to the client
  }
});

export default router;
// Export this router so it can be imported and used in the main Express app (e.g., app.use("/ai", router))