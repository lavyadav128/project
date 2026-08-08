// Small wrapper around fetch — talks to the Express backend.
// In dev, Vite proxies "/api" to http://localhost:5000 (see vite.config.js),
// so this works unchanged in dev and in a same-origin production build.

export async function fetchStates() {
  const res = await fetch("/api/states");
  if (!res.ok) throw new Error("Could not load state list");
  const data = await res.json();
  return data.states;
}

export async function sendChatMessage({ message, state, language, history }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, state, language, history }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data.reply;
}
