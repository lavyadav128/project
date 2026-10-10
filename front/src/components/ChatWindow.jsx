import { useEffect, useRef, useState, useMemo } from "react";
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
  const [streamingIndex, setStreamingIndex] = useState(null);
  const [displayedText, setDisplayedText] = useState("");

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, displayedText]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  // ChatGPT-style progressive typewriter stream for the latest assistant message
  const lastIndex = messages.length - 1;
  const lastMessage = messages[lastIndex];

  useEffect(() => {
    if (lastMessage && lastMessage.role === "assistant" && !lastMessage.isError && lastIndex !== streamingIndex) {
      const fullText = lastMessage.content || "";
      if (fullText.length > 0) {
        setStreamingIndex(lastIndex);
        setDisplayedText("");

        let charIdx = 0;
        const totalLen = fullText.length;
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);

        typingTimerRef.current = setInterval(() => {
          // Increment in variable chunks for natural ChatGPT typing rhythm
          charIdx = Math.min(totalLen, charIdx + 8);
          setDisplayedText(fullText.slice(0, charIdx));

          if (charIdx >= totalLen) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
        }, 18);
      }
    }
  }, [lastIndex, lastMessage]);

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

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  async function sendMessage(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (listening) {
      recognitionRef.current?.stop();
    }

    // Finish any ongoing typing stream immediately
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
      if (lastMessage) setDisplayedText(lastMessage.content || "");
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
    { label: "🌧️ Future flood forecast if 60mm rain", query: "Forecast future flood spread and velocity if upstream rainfall reaches 60mm" },
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
            🌊 Powered by Trained Hydrodynamic CFD Model (21,642 points) • Real-time flood wave arrival, flow velocity & safety sequence
          </div>

          {messages.map((m, i) => {
            const isStreaming = i === streamingIndex && i === lastIndex && m.role === "assistant";
            const textToRender = isStreaming ? displayedText : m.content;

            return (
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
                  {/* ML Hydrodynamic Prediction Card */}
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

                  {/* Render Structured ChatGPT Markdown */}
                  <StructuredMarkdown content={textToRender} />
                  {isStreaming && displayedText.length < m.content.length && (
                    <span className="chatgpt-cursor" aria-hidden="true">▊</span>
                  )}
                </div>
              </div>
            );
          })}

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
          Ask any flood question • Responses structured in sequential ChatGPT sections with live ML physics
        </div>
      </div>
    </div>
  );
}

/**
 * Robust, lightweight Markdown parser and renderer matching ChatGPT's response structure.
 * Handles headings (###, ##, #), ordered lists (1.), unordered lists (-, *), bold, italic, code, quotes.
 */
function StructuredMarkdown({ content }) {
  if (!content) return null;

  const elements = useMemo(() => {
    const rawLines = content.split("\n");
    const blocks = [];
    let currentList = null; // { type: 'ul' | 'ol', items: [] }

    function flushList() {
      if (currentList) {
        if (currentList.type === "ol") {
          blocks.push(
            <ol key={`ol-${blocks.length}`} className="chat-ol">
              {currentList.items.map((item, idx) => (
                <li key={idx}>{renderInlineFormatted(item)}</li>
              ))}
            </ol>
          );
        } else {
          blocks.push(
            <ul key={`ul-${blocks.length}`} className="chat-ul">
              {currentList.items.map((item, idx) => (
                <li key={idx}>{renderInlineFormatted(item)}</li>
              ))}
            </ul>
          );
        }
        currentList = null;
      }
    }

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        continue;
      }

      // 1. Headings (###, ##, #)
      if (trimmed.startsWith("### ")) {
        flushList();
        blocks.push(
          <h3 key={`h3-${blocks.length}`} className="chat-h3">
            {renderInlineFormatted(trimmed.slice(4))}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith("## ")) {
        flushList();
        blocks.push(
          <h2 key={`h2-${blocks.length}`} className="chat-h2">
            {renderInlineFormatted(trimmed.slice(3))}
          </h2>
        );
        continue;
      }
      if (trimmed.startsWith("# ")) {
        flushList();
        blocks.push(
          <h1 key={`h1-${blocks.length}`} className="chat-h1">
            {renderInlineFormatted(trimmed.slice(2))}
          </h1>
        );
        continue;
      }

      // 2. Horizontal divider (---)
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        flushList();
        blocks.push(<hr key={`hr-${blocks.length}`} className="chat-hr" />);
        continue;
      }

      // 3. Blockquote (> )
      if (trimmed.startsWith("> ")) {
        flushList();
        blocks.push(
          <blockquote key={`quote-${blocks.length}`} className="chat-quote">
            {renderInlineFormatted(trimmed.slice(2))}
          </blockquote>
        );
        continue;
      }

      // 4. Ordered List (1. , 2. )
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        if (!currentList || currentList.type !== "ol") {
          flushList();
          currentList = { type: "ol", items: [] };
        }
        currentList.items.push(olMatch[2]);
        continue;
      }

      // 5. Unordered List (- , * )
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!currentList || currentList.type !== "ul") {
          flushList();
          currentList = { type: "ul", items: [] };
        }
        currentList.items.push(trimmed.slice(2));
        continue;
      }

      // 6. Regular Paragraph
      flushList();
      blocks.push(
        <p key={`p-${blocks.length}`} className="chat-p">
          {renderInlineFormatted(trimmed)}
        </p>
      );
    }

    flushList();
    return blocks;
  }, [content]);

  return <div className="chatgpt-markdown">{elements}</div>;
}

/**
 * Formats inline text with bold (**text**), code (`code`), italics (*text*), and web links.
 */
function renderInlineFormatted(text) {
  if (!text) return "";

  // Split by markdown formatting regexes
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(<code key={match.index} className="chat-inline-code">{token.slice(1, -1)}</code>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}