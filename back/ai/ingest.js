import fs from "fs";
// fs = File System — a built-in Node.js module that lets us read/write files and folders on the computer

import path from "path";
// path = a built-in Node.js module that helps us build/join file paths safely (works on Windows, Mac, Linux)

import { createRequire } from "module";
// createRequire lets us use old-style require() inside modern ES module files (files that use "import")

const require = createRequire(import.meta.url);
// Creates a custom require() function tied to the current file's location
// import.meta.url = the full file path of THIS file

const pdfParse = require("pdf-parse");
// pdf-parse is a third-party library that reads PDF files and extracts all the text from them
// We use require() here because pdf-parse is a CommonJS package (old style), not an ES module

import { pipeline } from "@xenova/transformers";
// pipeline is a function from Transformers.js — it loads AI models and lets us run them in Node.js
// We'll use it to load a sentence embedding model (converts text into vectors/numbers)

import dotenv from "dotenv";
// dotenv reads the .env file so this standalone script can access MONGO_URI,
// exactly like index.js does when the real server starts

import mongoose from "mongoose";
// We need our own MongoDB connection here — this script runs SEPARATELY from
// your main server (it's a one-time/occasional command, not something that
// runs on every request), so it has to connect to the database itself

import { fileURLToPath } from "url";
// Used below to reliably find THIS script's own folder, regardless of which
// directory you happen to run the command from

// IMPORTANT: dotenv.config() by default only looks for ".env" in the CURRENT
// WORKING DIRECTORY (wherever you typed "node ...\" from) — NOT relative to
// this file. Since ingest.js lives in back/ai/ but .env lives in back/, running
// this from inside the "ai" folder would fail to find it. We fix this by
// building the exact path to back/.env, based on THIS file's own location,
// so it works correctly no matter which folder you run the command from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });


// ======================================
// EMBEDDING MODEL
// ======================================

console.log("Loading embedding model...");

const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
);

console.log("Embedding model loaded!");


// ======================================
// PATHS
// ======================================

const BASE_DIR = __dirname;
// Same fix as dotenv above: use THIS FILE's own folder, not
// process.cwd() (path.resolve() with no args) — otherwise every path below
// (PDF_DIR, JS_DIR, website knowledge, vector store output) would silently
// break if you ever ran this command from a different folder.

const DASH_DIR = path.join(
    BASE_DIR,
    "../../dash"
);

const PDF_DIR = path.join(
    DASH_DIR,
    "public",
    "images"
);

const JS_DIR = path.join(
    DASH_DIR,
    "src",
    "components"
);

const WEBSITE_KNOWLEDGE_PATH = path.join(
    BASE_DIR,
    "website_knowledge.md"
);
// The new "about the platform" document we wrote — describes what NoteNova
// is, how batches/purchases/doubts/refunds work, etc. — so the chatbot can
// answer questions ABOUT the website, not just about study content.


// VECTOR STORE FILE

const VECTOR_STORE_PATH = path.join(
    BASE_DIR,
    "vector_store.json"
);


// ======================================
// VECTOR STORAGE
// ======================================

const vectorStore = [];


// ======================================
// CHUNK TEXT
// ======================================

function chunkText(text, size = 500) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}


// ======================================
// READ PDF
// ======================================

async function readPDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (err) {
        console.log("PDF Error:", filePath);
        return "";
    }
}


// ======================================
// CREATE EMBEDDING
// ======================================

async function createEmbedding(text) {
    const embedding = await embedder(text, {
        pooling: "mean",
        normalize: true
    });
    return Array.from(embedding.data);
}


// ======================================
// STORE CHUNK
// ======================================

async function storeChunk(chunk, metadata) {
    const embedding = await createEmbedding(chunk);
    vectorStore.push({
        text: chunk,
        embedding: embedding,
        metadata: metadata
    });
}


// ======================================
// PROCESS WEBSITE KNOWLEDGE (by section, not blind 500-char cuts)
// ======================================

async function processWebsiteKnowledge(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`\nNo website_knowledge.md found at ${filePath} — skipping.`);
        return;
    }

    console.log(`\nReading website knowledge: ${path.basename(filePath)}`);

    const text = fs.readFileSync(filePath, "utf-8");

    const sections = text
        .split(/(?=^## )/m)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (let i = 0; i < sections.length; i++) {
        await storeChunk(
            sections[i],
            {
                source: "website_knowledge.md",
                type: "website-info",
                chunk: i
            }
        );
        console.log(`Stored website-info section ${i}`);
    }
}


// ======================================
// PROCESS LIVE BATCH DATA (pulled fresh from MongoDB)
// ======================================

async function processLiveBatchData() {
    console.log(`\nFetching live batch data from MongoDB...`);

    const { default: Batch } = await import("../schema/batches.model.js");

    const batches = await Batch.find({ isActive: true });

    for (let i = 0; i < batches.length; i++) {
        const b = batches[i];

        const priceText = b.price > 0 ? `₹${b.price} (one-time purchase)` : "Free";
        const text = `Batch: ${b.title}
Category: ${b.folder}
Price: ${priceText}
Description: ${b.description || "No description available."}`;

        await storeChunk(
            text,
            {
                source: "live-batch-data",
                type: "batch-info",
                batchId: b.batchId,
                chunk: i
            }
        );
        console.log(`Stored live batch info: ${b.title}`);
    }
}


async function processCloudinaryPDFs() {
    console.log(`\nFetching PDF list from Cloudinary...`);

    let allResources = [];
    let nextCursor = undefined;

    do {
        const result = await cloudinary.api.resources({
            resource_type: "raw",
            type: "upload",
            prefix: "notes/",
            max_results: 500,
            next_cursor: nextCursor,
        });
        allResources = allResources.concat(result.resources);
        nextCursor = result.next_cursor;
    } while (nextCursor);

    const pdfResources = allResources.filter(r =>
        r.format === "pdf" || r.secure_url.toLowerCase().endsWith(".pdf")
    );

    console.log(`Found ${pdfResources.length} PDF(s) on Cloudinary`);

    for (const resource of pdfResources) {
        const fileName = resource.public_id.split("/").pop();
        console.log(`\nDownloading PDF: ${fileName}`);

        try {
            const response = await axios.get(resource.secure_url, {
                responseType: "arraybuffer",
            });
            const dataBuffer = Buffer.from(response.data);
            const data = await pdfParse(dataBuffer);
            const text = data.text;
            const chunks = chunkText(text);

            for (let i = 0; i < chunks.length; i++) {
                await storeChunk(chunks[i], { source: fileName, type: "pdf", chunk: i });
                console.log(`Stored PDF Chunk ${i}`);
            }
        } catch (err) {
            console.log("Cloudinary PDF Error:", fileName, "-", err.message);
        }
    }
}

// ======================================
// PROCESS FILES
// ======================================

async function processFolder(folderPath) {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await processFolder(fullPath);
        }

        else if (file.endsWith(".pdf")) {
            console.log(`\nReading PDF: ${file}`);
            const text = await readPDF(fullPath);
            const chunks = chunkText(text);

            for (let i = 0; i < chunks.length; i++) {
                await storeChunk(
                    chunks[i],
                    {
                        source: file,
                        type: "pdf",
                        chunk: i
                    }
                );
                console.log(`Stored PDF Chunk ${i}`);
            }
        }

        else if (file.endsWith(".js")) {
            console.log(`\nReading JS: ${file}`);
            const text = fs.readFileSync(fullPath, "utf-8");
            const chunks = chunkText(text);

            for (let i = 0; i < chunks.length; i++) {
                await storeChunk(
                    chunks[i],
                    {
                        source: file,
                        type: "js",
                        chunk: i
                    }
                );
                console.log(`Stored JS Chunk ${i}`);
            }
        }
    }
}


// ======================================
// START
// ======================================

console.log(
    "\nStarting ingestion...\n"
);

// Connect to MongoDB — needed for the live batch data step below.
console.log("Connecting to MongoDB...");
await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected!");

// PDFs
await processFolder(PDF_DIR);

// JS Files
await processFolder(JS_DIR);

// Website knowledge (the "about NoteNova" document)
await processWebsiteKnowledge(WEBSITE_KNOWLEDGE_PATH);

// Live batch data (fresh names/prices/descriptions straight from the database)
await processLiveBatchData();

// Done with the database — close the connection cleanly
await mongoose.disconnect();


// ======================================
// SAVE LOCALLY
// ======================================

fs.writeFileSync(
    VECTOR_STORE_PATH,
    JSON.stringify(vectorStore, null, 2)
);

console.log(
    "\nVector Store Saved Locally!"
);

console.log(
    `Saved to: ${VECTOR_STORE_PATH}`
);