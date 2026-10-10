import { useEffect, useRef, useState } from "react";
import { t, LANGUAGE_NAMES } from "../data/i18n.js";
import { sendChatMessage } from "../api.js";

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

  async function sendMessage(textToSend) {
    const text = (textToSend || input).trim();
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
      const { reply, prediction } = await sendChatMessage({
        message: text,
        state,
        language: LANGUAGE_NAMES[language] || "English",
        history: nextMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      onMessagesChange([...nextMessages, { role: "assistant", content: reply, prediction }]);
    } catch (err) {
      onMessagesChange([
        ...nextMessages,
        { role: "assistant", content: err.message || t(language, "errorGeneric"), isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e) {
    e?.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const quickPrompts = [
    { label: "⏱️ Predict flood arrival at 5 km", query: "Predict flood wave arrival time and velocity at 5 km downstream" },
    { label: "🌊 Flow velocity & wave speed", query: "What is the predicted flood flow velocity, wave celerity, and hazard risk?" },
    { label: "🌧️ Predict future flood if 60mm rain", query: "Forecast future flood spread and velocity if upstream rainfall reaches 60mm" },
    { label: "🛡️ Regional safety & dam release guidelines", query: `What are the critical flood precautions, dam release protocols, and emergency guidelines for ${state}?` },
  ];

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
        <div className="chat-model-badge" title="Trained on CFD Velocity Field Dataset (21,642 samples, R²=0.9987)">
          <span className="ai-pulse" /> ML CFD Forecaster Active
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-inner">
          <div className="disclaimer-pill">
            🌊 Powered by Trained Hydrodynamic CFD Model (21,642 simulation points) • Predicting flood velocity, wave arrival & regional risk
          </div>

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
                {/* Render live ML prediction card if present */}
                {m.prediction && (
                  <div className="prediction-card">
                    <div className="prediction-header">
                      <span className="prediction-tag">ML Hydrodynamic Prediction</span>
                      <span className={`risk-badge risk-${(m.prediction.riskLevel || "low").toLowerCase().replace(/[^a-z]/g, "")}`}>
                        {m.prediction.riskLevel}
                      </span>
                    </div>
                    <div className="prediction-grid">
                      <div className="pred-stat">
                        <span className="pred-label">Arrival Time</span>
                        <span className="pred-value">{m.prediction.estimatedArrival?.summary || "N/A"}</span>
                      </div>
                      <div className="pred-stat">
                        <span className="pred-label">Predicted Velocity</span>
                        <span className="pred-value">{m.prediction.velocityMagnitudeMs} m/s</span>
                      </div>
                      <div className="pred-stat">
                        <span className="pred-label">Wave Celerity</span>
                        <span className="pred-value">{m.prediction.waveCelerityMs} m/s</span>
                      </div>
                      <div className="pred-stat">
                        <span className="pred-label">Flow Depth</span>
                        <span className="pred-value">{m.prediction.flowDepthM} m</span>
                      </div>
                    </div>
                  </div>
                )}

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

          {/* Quick interactive prompts */}
          {messages.length <= 2 && !loading && (
            <div className="quick-prompts-container">
              <span className="quick-prompts-title">Try predicting with trained AI model:</span>
              <div className="quick-prompts-list">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    className="quick-prompt-chip"
                    onClick={() => sendMessage(qp.query)}
                  >
                    {qp.label}
                  </button>
                ))}
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
        <div className="composer-hint">
          Ask any question for any region • Supports arrival time, flow velocity & future flood forecasts
        </div>
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