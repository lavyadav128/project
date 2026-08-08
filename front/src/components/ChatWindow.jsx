import { useEffect, useRef, useState } from "react";
import { t, LANGUAGE_NAMES } from "../data/i18n.js";
import { sendChatMessage } from "../api.js";

// Maps our UI language codes to BCP-47 locale tags for the Web Speech API.
// (Browser support for some Indian languages varies — Chrome/Edge on
// Android and desktop generally cover all of these; Punjabi support can
// be patchy on some browsers, in which case it silently falls back to
// whatever the browser understands, or errors out gracefully.)
const SPEECH_LOCALES = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
  gu: "gu-IN",
  pa: "pa-IN",
};

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function ChatWindow({
  language,
  state,
  messages,
  onMessagesChange,
  onOpenSidebar,
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Stop any in-progress recognition when the component unmounts
  // (e.g. user switches conversation) so the mic doesn't stay hot.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function handleMicClick() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setVoiceUnsupported(true);
      setTimeout(() => setVoiceUnsupported(false), 4000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LOCALES[language] || "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      requestAnimationFrame(autoResize);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    if (listening) {
      recognitionRef.current?.stop();
    }

    const nextMessages = [...messages, { role: "user", content: text }];
    onMessagesChange(nextMessages);
    setInput("");
    requestAnimationFrame(autoResize);
    setLoading(true);

    try {
      const reply = await sendChatMessage({
        message: text,
        state,
        language: LANGUAGE_NAMES[language] || "English",
        history: nextMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      onMessagesChange([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      onMessagesChange([
        ...nextMessages,
        { role: "assistant", content: err.message || t(language, "errorGeneric"), isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-main">
      <header className="chat-topbar">
        <button className="icon-btn" onClick={onOpenSidebar} aria-label="Open menu">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="chat-topbar-title">
          <span>{t(language, "appName")}</span>
          <span className="chat-topbar-state">{state}</span>
        </div>
        <div className="icon-btn spacer" aria-hidden="true" />
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-inner">
          {messages.length <= 1 && (
            <div className="disclaimer-pill">{t(language, "disclaimer")}</div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.role}`}>
              <div className={`msg-avatar ${m.role}`} aria-hidden="true">
                {m.role === "user" ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 20c1.6-4 5-6 8-6s6.4 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 64 24" width="18" height="8">
                    <path d="M0 12c6-8 12 8 18 0s12-8 18 0 12 8 18 0 8-4 10 0" />
                  </svg>
                )}
              </div>
              <div className={`msg-content ${m.role} ${m.isError ? "error" : ""}`}>
                {m.content.split("\n").map((line, j) => (
                  <p key={j}>{renderInline(line)}</p>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row assistant">
              <div className="msg-avatar assistant" aria-hidden="true">
                <svg viewBox="0 0 64 24" width="18" height="8">
                  <path d="M0 12c6-8 12 8 18 0s12-8 18 0 12 8 18 0 8-4 10 0" />
                </svg>
              </div>
              <div className="msg-content assistant typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="composer-wrap">
        {voiceUnsupported && (
          <div className="voice-unsupported-note">{t(language, "voiceNotSupported")}</div>
        )}
        <form className="composer" onSubmit={handleSend}>
          <button
            type="button"
            className={`mic-btn ${listening ? "listening" : ""}`}
            onClick={handleMicClick}
            aria-label={listening ? t(language, "listening") : "Voice input"}
          >
            {listening && <span className="mic-pulse" aria-hidden="true" />}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={listening ? t(language, "listening") : t(language, "typePlaceholder")}
          />
          <button type="submit" className="send-btn" disabled={!input.trim() || loading} aria-label={t(language, "send")}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <div className="composer-hint">{t(language, "disclaimer")}</div>
      </div>
    </div>
  );
}

function renderInline(line) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}