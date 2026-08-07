import React, { useState, useRef, useEffect, useCallback } from "react";
import server from "../environment";

// ─────────────────────────────────────────────
// MARKDOWN RENDERER
// Converts bot reply text → rich HTML like ChatGPT
// ─────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";

  let html = text
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks ```lang\n...\n```
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic *text* or _text_
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_\n]+)_/g, "<em>$1</em>");

  // Headers ### ## #
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Numbered list items (1. 2. etc)
  html = html.replace(/^(\d+)\. (.+)$/gm, "<li class='ol-item'><span class='ol-num'>$1.</span> $2</li>");

  // Bullet list items (- * •)
  html = html.replace(/^[-*•] (.+)$/gm, "<li class='ul-item'>$1</li>");

  // Wrap consecutive <li class='ol-item'> in <ol>
  html = html.replace(/(<li class='ol-item'>[\s\S]*?<\/li>\n?)+/g, (m) => `<ol>${m}</ol>`);

  // Wrap consecutive <li class='ul-item'> in <ul>
  html = html.replace(/(<li class='ul-item'>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

  // Horizontal rule ---
  html = html.replace(/^---+$/gm, "<hr/>");

  // Blockquote > text
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  // Paragraphs — blank lines → <p> breaks
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap block elements
      if (/^<(h[1-3]|ul|ol|pre|blockquote|hr)/.test(trimmed)) return trimmed;
      // Single newlines within a para → <br>
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const S = {
  fab: {
    position: "fixed", bottom: 24, right: 24, zIndex: 9999,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  fabBtn: (open) => ({
    width: 52, height: 52, borderRadius: "50%",
    background: open ? "#0F6E56" : "#1D9E75",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(29,158,117,0.35)",
    color: "#fff", fontSize: 22, transition: "background 0.15s",
  }),
  panel: (open) => ({
    position: "fixed",
    zIndex: 9998,
  
    // DESKTOP (unchanged)
    bottom: window.innerWidth <= 768 ? "auto" : 88,
    right: window.innerWidth <= 768 ? "50%" : 24,
  
    // MOBILE FRIENDLY CENTERED POPUP
    top: window.innerWidth <= 768 ? "10%" : "auto",
    left: window.innerWidth <= 768 ? "50%" : "auto",
    transform:
      window.innerWidth <= 768
        ? open
          ? "translate(-50%, 0) scale(1)"
          : "translate(-50%, 20px) scale(0.96)"
        : open
        ? "translateY(0) scale(1)"
        : "translateY(12px) scale(0.97)",
  
    // MOBILE SIZE
    width: window.innerWidth <= 768 ? "90vw" : 380,
    height: window.innerWidth <= 768 ? "70vh" : 580,
  
    display: "flex",
    flexDirection: "column",
  
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.12)",
  
    // MORE BEAUTIFUL MOBILE RADIUS
    borderRadius: window.innerWidth <= 768 ? 22 : 16,
  
    overflow: "hidden",
  
    // Better floating look on mobile
    boxShadow:
      window.innerWidth <= 768
        ? "0 18px 60px rgba(0,0,0,0.22)"
        : "0 8px 40px rgba(0,0,0,0.12)",
  
    fontFamily: "'DM Sans', system-ui, sans-serif",
  
    transition: "opacity 0.18s, transform 0.18s",
  
    opacity: open ? 1 : 0,
  
    pointerEvents: open ? "all" : "none",
  }),

  
  header: {
    padding: "12px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.08)",
    display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
  },
  headerIcon: {
    width: 32, height: 32, borderRadius: 8, background: "#E1F5EE",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, flexShrink: 0,
  },
  headerTitle: { fontSize: 14, fontWeight: 500, color: "#111", margin: 0 },
  headerSub: { fontSize: 12, color: "#888", margin: "1px 0 0" },
  headerActions: { marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" },
  iconBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 16, color: "#aaa", padding: "4px 6px", borderRadius: 6,
    lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
    transition: "color 0.12s, background 0.12s",
  },
  contextPill: {
    margin: "10px 16px 4px", padding: "5px 10px",
    background: "#E1F5EE", border: "0.5px solid #9FE1CB",
    borderRadius: 8, fontSize: 12, color: "#0F6E56",
    display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
  },
  pdfBanner: (visible) => ({
    margin: "0 16px 6px", padding: "8px 12px",
    background: "#F0F7FF", border: "0.5px solid #B3D4FF",
    borderRadius: 8, fontSize: 12, color: "#1A5FBF",
    display: visible ? "flex" : "none",
    alignItems: "center", gap: 8, flexShrink: 0,
  }),
  errorBanner: {
    margin: "6px 16px 0", padding: "8px 12px",
    background: "#FFF0F0", border: "0.5px solid #FFBBBB",
    borderRadius: 8, fontSize: 12, color: "#CC3333", flexShrink: 0,
  },
  messagesArea: {
    flex: 1, overflowY: "auto", padding: "10px 16px 6px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  msgWrap: (role) => ({
    display: "flex", flexDirection: "column",
    alignItems: role === "user" ? "flex-end" : "flex-start",
    maxWidth: role === "user" ? "82%" : "100%",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    gap: 3,
  }),
  bubble: (role) => ({
    padding: role === "user" ? "9px 13px" : "10px 14px",
    borderRadius: role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
    fontSize: 13.5, lineHeight: 1.6,
    wordBreak: "break-word",
    background: role === "user" ? "#1D9E75" : "#F5F5F3",
    color: role === "user" ? "#fff" : "#111",
    border: role === "user" ? "none" : "0.5px solid rgba(0,0,0,0.08)",
    whiteSpace: role === "user" ? "pre-wrap" : undefined,
  }),
  msgMeta: { fontSize: 11, color: "#bbb", padding: "0 2px" },
  typingWrap: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "9px 13px", background: "#F5F5F3",
    border: "0.5px solid rgba(0,0,0,0.08)",
    borderRadius: "12px 12px 12px 3px", width: "fit-content",
  },
  suggestionsRow: {
    display: "flex", gap: 6, flexWrap: "wrap",
    padding: "4px 16px 6px", flexShrink: 0,
  },
  chip: {
    fontSize: 12, padding: "5px 10px",
    background: "#F5F5F3", border: "0.5px solid rgba(0,0,0,0.1)",
    borderRadius: 20, cursor: "pointer", color: "#555",
    fontFamily: "'DM Sans', system-ui, sans-serif", whiteSpace: "nowrap",
  },
  inputRow: {
    padding: "8px 14px 12px", borderTop: "0.5px solid rgba(0,0,0,0.08)",
    display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0,
  },
  uploadBtn: {
    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
    background: "#F5F5F3", border: "0.5px solid rgba(0,0,0,0.12)",
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 16, color: "#888",
    transition: "all 0.12s",
  },
  textarea: {
    flex: 1, resize: "none", borderRadius: 8,
    border: "0.5px solid rgba(0,0,0,0.12)", background: "#F5F5F3",
    padding: "9px 12px", fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 13.5, color: "#111", outline: "none",
    lineHeight: 1.5, minHeight: 38, maxHeight: 100,
    overflowY: "auto", transition: "border-color 0.12s",
  },
  sendBtn: (disabled) => ({
    width: 36, height: 36, borderRadius: 8,
    background: disabled ? "#F5F5F3" : "#1D9E75",
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: 18, color: disabled ? "#ccc" : "#fff",
    transition: "background 0.12s",
  }),
};

// Markdown bubble CSS injected once
const GLOBAL_CSS = `
  @keyframes copilot-bounce {
    0%,80%,100%{transform:translateY(0);opacity:.4}
    40%{transform:translateY(-5px);opacity:1}
  }
  .copilot-md h1{font-size:15px;font-weight:700;margin:10px 0 4px;color:#0F6E56}
  .copilot-md h2{font-size:14px;font-weight:700;margin:8px 0 4px;color:#0F6E56}
  .copilot-md h3{font-size:13.5px;font-weight:600;margin:6px 0 3px;color:#1D9E75}
  .copilot-md p{margin:4px 0;line-height:1.6}
  .copilot-md ul{margin:4px 0 4px 0;padding:0;list-style:none}
  .copilot-md ul li.ul-item{padding:2px 0 2px 16px;position:relative;line-height:1.55}
  .copilot-md ul li.ul-item::before{content:"•";position:absolute;left:4px;color:#1D9E75;font-weight:700}
  .copilot-md ol{margin:4px 0;padding:0;list-style:none;counter-reset:none}
  .copilot-md ol li.ol-item{padding:2px 0 2px 28px;position:relative;line-height:1.55}
  .copilot-md ol li.ol-item .ol-num{position:absolute;left:4px;color:#1D9E75;font-weight:600;font-size:12.5px}
  .copilot-md strong{font-weight:700;color:#0a0a0a}
  .copilot-md em{font-style:italic;color:#444}
  .copilot-md code{background:#E8E8E6;border-radius:4px;padding:1px 5px;font-family:monospace;font-size:12.5px;color:#c7254e}
  .copilot-md pre{background:#1e1e1e;borderRadius:8px;padding:10px 12px;overflow-x:auto;margin:6px 0}
  .copilot-md pre code{background:none;color:#d4d4d4;font-size:12px;padding:0}
  .copilot-md blockquote{border-left:3px solid #1D9E75;margin:6px 0;padding:4px 10px;background:#F0FAF5;border-radius:0 6px 6px 0;font-style:italic;color:#555}
  .copilot-md hr{border:none;border-top:1px solid rgba(0,0,0,0.1);margin:8px 0}
  .copilot-md a{color:#1D9E75;text-decoration:underline}
`;

const dot = (delay) => ({
  width: 6, height: 6, borderRadius: "50%", background: "#bbb",
  display: "inline-block",
  animation: `copilot-bounce 1.2s ease-in-out ${delay}s infinite`,
});

function getContext() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return {
    fullUrl:   window.location.href,
    path:      window.location.pathname,
    topic:     parts[parts.length - 1] || "home",
    pageTitle: document.title,
  };
}

function getTopicLabel() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts.length >= 2 ? parts.slice(-2).join("/") : parts[0] || "home";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function enrichMessage(message, topicSlug) {
  const topic = topicSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "this topic";

  const lower = message.toLowerCase().trim();
  if (/summar/i.test(lower))     return `Summarise "${topic}" — cover what it is, why it matters, and the main concepts.`;
  if (/key point/i.test(lower)) return `List the key points of "${topic}" in bullet form.`;
  if (/quiz/i.test(lower))      return `Give me a 3-question quiz about "${topic}" with answers.`;
  if (/explain/i.test(lower))   return `Explain "${topic}" with a simple example.`;
  return `${message} (I am studying "${topic}")`;
}

const DEFAULT_SUGGESTIONS = ["Summarise this topic", "Give me key points", "Quiz me on this"];

// ─────────────────────────────────────────────
// MARKDOWN MESSAGE BUBBLE
// ─────────────────────────────────────────────
function BotBubble({ text }) {
  return (
    <div
      style={S.bubble("bot")}
      className="copilot-md"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}

// ─────────────────────────────────────────────
// MAIN WIDGET
// ─────────────────────────────────────────────
export default function ChatbotWidget() {
  const [open, setOpen]                       = useState(false);
  const [messages, setMessages]               = useState([]);
  const [input, setInput]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [topicLabel, setTopicLabel]           = useState("");
  const [apiError, setApiError]               = useState("");
  const [pdfFile, setPdfFile]                 = useState(null);   // { name, base64 }
  const [pdfUploading, setPdfUploading]       = useState(false);

  const bottomRef     = useRef(null);
  const textareaRef   = useRef(null);
  const fileInputRef  = useRef(null);
  const styleInjected = useRef(false);
  const loadingRef    = useRef(false);
  const messagesRef   = useRef([]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Inject global CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    styleInjected.current = true;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const ctx   = getContext();
    const topic = capitalize(ctx.topic.replace(/-/g, " "));
    setTopicLabel(getTopicLabel());
    setApiError("");
    setShowSuggestions(true);
    setPdfFile(null);
    setMessages([{
      role: "bot",
      text: `Hi! I can see you're studying **"${topic}"**.\n\nAsk me anything — definitions, examples, a quick quiz, or **upload a PDF** to summarise it instantly.`,
      time: new Date(),
    }]);
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, [open]);

  // ── PDF UPLOAD ──────────────────────────────
  const handlePdfSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setApiError("Only PDF files are supported for upload.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setApiError("PDF must be under 10 MB.");
      return;
    }

    setPdfUploading(true);
    setApiError("");

    // Read as base64
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result.split(",")[1]);
      r.onerror = () => rej(new Error("File read failed"));
      r.readAsDataURL(file);
    });

    setPdfFile({ name: file.name, base64 });
    setPdfUploading(false);

    // Auto-trigger summarise message
    sendMessage(
      `__PDF_SUMMARISE__`,
      `📄 Summarise: ${file.name}`,
      { name: file.name, base64 }
    );
  }, []);

  const clearPdf = () => {
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── SEND ────────────────────────────────────
  const sendMessage = async (overrideText, displayText, pdfPayload) => {
    const userText  = (overrideText !== undefined ? overrideText : input).trim();
    const shownText = (displayText  !== undefined ? displayText  : userText);
    if (!userText || loadingRef.current) return;

    loadingRef.current = true;
    setApiError("");
    setShowSuggestions(false);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: shownText, time: new Date() }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const history = messagesRef.current.map((m) => ({
      role:    m.role,
      content: m.text,
    }));

    try {
      const body = {
        message: userText,
        history,
        context: getContext(),
      };

      // Attach PDF if present
      const pdf = pdfPayload || (pdfFile && userText === "__PDF_SUMMARISE__" ? pdfFile : null);
      if (pdf) {
        body.pdf = pdf; // { name, base64 }
      }

      const res = await fetch(`${server}/api/chatbot`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      const rawText = await res.text();
      console.log("[Chatbot] HTTP", res.status, "| body:", rawText.slice(0, 200));

      let data;
      try { data = JSON.parse(rawText); }
      catch {
        setApiError(`Non-JSON response (HTTP ${res.status}) — see console.`);
        loadingRef.current = false; setLoading(false); return;
      }

      if (!res.ok) {
        setApiError(`HTTP ${res.status}: ${data?.error || rawText}`);
        loadingRef.current = false; setLoading(false); return;
      }

      if (data.reply) {
        setMessages((prev) => [...prev, {
          role: "bot", text: data.reply, time: new Date(), detected: data.detected,
        }]);
        // Clear PDF banner after summary delivered
        if (pdf) clearPdf();
      } else {
        setApiError(`Unexpected response: ${JSON.stringify(data)}`);
      }

    } catch (err) {
      console.error("[Chatbot] fetch failed:", err);
      setApiError(`Network error: ${err.message}`);
    }

    loadingRef.current = false;
    setLoading(false);
  };

  const applySuggestion = (chipLabel) => {
    setShowSuggestions(false);
    const ctx = getContext();
    const enriched = enrichMessage(chipLabel, ctx.topic);
    sendMessage(enriched, chipLabel);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loadingRef.current && e.target.value.trim()) sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !loading && !pdfUploading;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handlePdfSelect}
      />

      {/* FAB */}
      <div style={S.fab}>
        <button
          style={S.fabBtn(open)}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close study copilot" : "Open study copilot"}
        >
          {open ? "×" : "🧠"}
        </button>
      </div>

      {/* Panel */}
      <div style={S.panel(open)} role="dialog" aria-label="AI Study Copilot" aria-modal="true">

        {/* Header */}
        <div style={S.header}>
          <div style={S.headerIcon}>🌿</div>
          <div>
            <p style={S.headerTitle}>Study Copilot</p>
            <p style={S.headerSub}>Powered by your course material</p>
          </div>
          <div style={S.headerActions}>
            <button
              style={S.iconBtn}
              title="Upload PDF to summarise"
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E1F5EE"; e.currentTarget.style.color = "#1D9E75"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none";    e.currentTarget.style.color = "#aaa"; }}
            >
              📎
            </button>
            <button
              style={S.iconBtn}
              title="Clear conversation"
              onClick={() => {
                setMessages([{ role: "bot", text: "Conversation cleared. Ask me anything!", time: new Date() }]);
                setShowSuggestions(true);
                clearPdf();
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF0F0"; e.currentTarget.style.color = "#CC3333"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none";    e.currentTarget.style.color = "#aaa"; }}
            >
              🗑
            </button>
            <button
              style={S.iconBtn}
              onClick={() => setOpen(false)}
              aria-label="Close"
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F5F3"; e.currentTarget.style.color = "#555"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none";    e.currentTarget.style.color = "#aaa"; }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Context pill */}
        <div style={S.contextPill}>
          <span>📍</span>
          <span>{topicLabel || "detecting topic…"}</span>
        </div>

        {/* PDF banner */}
        <div style={S.pdfBanner(!!pdfFile || pdfUploading)}>
          {pdfUploading
            ? <><span>⏳</span><span>Reading PDF…</span></>
            : <>
                <span>📄</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pdfFile?.name}
                </span>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, padding: "0 2px" }}
                  onClick={clearPdf}
                  title="Remove PDF"
                >×</button>
              </>
          }
        </div>

        {/* Error banner */}
        {apiError && <div style={S.errorBanner}>⚠️ {apiError}</div>}

        {/* Messages */}
        <div style={S.messagesArea}>
          {messages.map((m, i) => (
            <div key={i} style={S.msgWrap(m.role)}>
              {m.role === "bot"
                ? <BotBubble text={m.text} />
                : <div style={S.bubble("user")}>{m.text}</div>
              }
              <span style={S.msgMeta}>{formatTime(m.time)}</span>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start" }}>
              <div style={S.typingWrap}>
                <span style={dot(0)} /><span style={dot(0.2)} /><span style={dot(0.4)} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        {showSuggestions && !loading && (
          <div style={S.suggestionsRow}>
            {DEFAULT_SUGGESTIONS.map((s) => (
              <button
                key={s} style={S.chip}
                onClick={() => applySuggestion(s)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background  = "#E1F5EE";
                  e.currentTarget.style.borderColor = "#1D9E75";
                  e.currentTarget.style.color       = "#0F6E56";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background  = "#F5F5F3";
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
                  e.currentTarget.style.color       = "#555";
                }}
              >{s}</button>
            ))}
            <button
              style={{ ...S.chip, color: "#1A5FBF", borderColor: "#B3D4FF", background: "#F0F7FF" }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.background  = "#DCF0FF";
                e.currentTarget.style.borderColor = "#1A5FBF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background  = "#F0F7FF";
                e.currentTarget.style.borderColor = "#B3D4FF";
              }}
            >📎 Upload PDF</button>
          </div>
        )}

        {/* Input row */}
        <div style={S.inputRow}>
          <button
            style={S.uploadBtn}
            title="Upload PDF"
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#E1F5EE"; e.currentTarget.style.color = "#1D9E75"; e.currentTarget.style.borderColor = "#9FE1CB"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#F5F5F3"; e.currentTarget.style.color = "#888";    e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; }}
          >
            📎
          </button>
          <textarea
            ref={textareaRef}
            style={S.textarea}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#1D9E75")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)")}
            placeholder="Ask anything about this topic…"
            rows={1}
            aria-label="Message input"
          />
          <button
            style={S.sendBtn(!canSend)}
            onClick={() => sendMessage()}
            disabled={!canSend}
            aria-label="Send"
          >↑</button>
        </div>

      </div>
    </>
  );
}





