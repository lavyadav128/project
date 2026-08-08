# Flood Assist — AI Flood Query Chatbot (College Project)

A chatbot that answers flood-related questions — precautions, dam status,
evacuation guidance, "when might flood water reach my area" — with a
language + state picker on first launch. Built with **React (Vite)** on
the frontend and **Node/Express** on the backend. The backend can call
**either** a free cloud LLM (OpenRouter) **or** a fully local model
(Ollama) — you flip one setting, no code changes.

```
flood-chatbot/
├── back/     ← Express API (chat logic, LLM calls, dummy flood data)
└── front/    ← React chat UI (onboarding + chat window)
```

---

## 1. Requirements

- Node.js 18+ (check with `node -v`)
- npm (comes with Node)
- Either:
  - a free [OpenRouter](https://openrouter.ai) account + API key, **or**
  - [Ollama](https://ollama.com) installed locally

---

## 2. Backend setup

```bash
cd back
npm install
cp .env.example .env
```

Open `back/.env` and set **one** provider:

### Option A — OpenRouter (free tier, cloud, easiest to demo anywhere)

1. Sign up free at https://openrouter.ai and create a key at
   https://openrouter.ai/keys
2. In `back/.env`:
   ```
   LLM_PROVIDER=openrouter
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
   ```
3. Free models change over time — if that model stops working, browse
   current free models at https://openrouter.ai/models?max_price=0 and
   paste a different model's ID into `OPENROUTER_MODEL`.

### Option B — Ollama (100% local, no internet needed after setup, free forever)

1. Install Ollama from https://ollama.com
2. In a terminal, pull a small model once:
   ```bash
   ollama pull llama3.2
   ```
3. Make sure Ollama is running (the desktop app running in the background
   is enough, or run `ollama serve` in a terminal)
4. In `back/.env`:
   ```
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2
   ```

You only need to set up **one** of these two — whichever `LLM_PROVIDER`
you pick is the one that gets used. Switching later is just editing that
one line and restarting the server.

### Run the backend

```bash
npm run dev
```

You should see:
```
Flood Assistant backend running on http://localhost:5000
LLM provider: openrouter   (or ollama)
```

Sanity check in a browser: http://localhost:5000/api/health

---

## 3. Frontend setup

In a **second terminal**:

```bash
cd front
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173). The frontend is
already configured (in `vite.config.js`) to forward `/api/*` calls to
`http://localhost:5000`, so as long as the backend is running, the chat
"just works."

---

## 4. Replacing the dummy data with your professor's real data

All demo flood data lives in **one file**: `back/data/floodData.js`.
Every state is an object with this exact shape:

```js
StateName: {
  majorRivers: [...],
  floodProneDistricts: [...],
  highRiskMonths: "...",
  dams: [{ name, river, currentLevel, status }],
  generalPrecautions: [...],
  emergencyContacts: { stateFloodControlRoom, ndrfHelpline, ambulance },
}
```

To swap in real data:
1. Keep the same keys/shape for each state.
2. Add/edit entries in that file (or write a small script that generates
   this file from your professor's spreadsheet/CSV/DB — same idea as
   `back/ai/ingest.js` did in the old project, just simpler).
3. Nothing else needs to change — `systemPrompt.js` and the frontend
   automatically pick up whatever states exist in this file.

### Scaling up (optional, later)
If your professor gives you a large document/PDF dataset instead of
clean structured facts, that's when you'd want real RAG (retrieval
augmented generation) — chunk the documents, embed them, and retrieve
the top-k relevant chunks per question, the way the old project's
`ingest.js`/vector-store approach did. For a college-project scope,
the simple "look up the selected state's object" approach in
`systemPrompt.js` is usually enough and is much easier to defend/explain
in a viva.

---

## 5. What to change/add for a full deployment (optional)

- **Frontend language list**: `front/src/data/i18n.js` — add a new
  `{ code, label }` to `LANGUAGES`, a full name to `LANGUAGE_NAMES`, and
  a translated string block to `STRINGS`.
- **Deploying**: `npm run build` inside `front/` produces a static
  `dist/` folder you can host anywhere (Vercel, Netlify, GitHub Pages).
  The backend (`back/`) can go on Render/Railway/a VPS — just set the
  same `.env` variables there. If deploying separately (different
  domains), update the frontend's `fetch` calls in `front/src/api.js`
  to point at your backend's full URL instead of relying on the Vite
  dev proxy.

---

## 6. What was deleted from your original upload, and why

Your uploaded `project-main.zip` was actually the skeleton of a
**different project** (an EdTech "study copilot" called NoteNova), not a
flood chatbot — it referenced MongoDB, Cloudinary, and files that weren't
even included in the zip (`middleware/rateLimit.js`,
`schema/batches.model.js`, a `dash/` folder), so it couldn't run as-is.
The frontend was the untouched default Vite+React starter page.

**Delete entirely** from your old project folder:
- `back/ai/chatbot.js` and `back/ai/ingest.js` — replaced by
  `back/server.js`, `back/src/llm.js`, `back/src/systemPrompt.js`,
  `back/data/floodData.js`
- `front/src/App.jsx`, `front/src/App.css`, `front/src/assets/` (react.svg,
  vite.svg, hero.png), `front/public/icons.svg` — replaced by the new
  `front/src/App.jsx`, `front/src/components/`, `front/src/styles/index.css`
- `back/package-lock.json` and `back/node_modules/` — the new
  `back/package.json` has different (much simpler) dependencies; run
  `npm install` fresh instead of reusing the old lockfile/node_modules

Just use this new `flood-chatbot/` folder as your project going forward
— it's a clean, complete, working replacement, not a patch on top of the
old one.

---

## 7. Notes for your viva/report

- The dummy dataset is clearly commented as placeholder in
  `back/data/floodData.js` — swap it for real data before submission if
  your professor expects that.
- The "RAG" here is intentionally simple (direct state lookup, not a
  vector database) — easy to explain, easy to extend later if you want
  to show off vector search as a "future work" section.
- The dual-provider LLM setup (`back/src/llm.js`) is a good talking
  point: it shows you understand the difference between a cloud API and
  a locally-hosted model, and designed the system to be provider-agnostic.
