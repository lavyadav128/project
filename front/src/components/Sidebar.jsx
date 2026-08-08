import { t } from "../data/i18n.js";

export default function Sidebar({
  language,
  state,
  conversations,
  activeId,
  onNewChat,
  onSelectChat,
  onChangeSettings,
  open,
  onClose,
}) {
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="wave-mark small" aria-hidden="true">
              <svg viewBox="0 0 64 24" width="24" height="10">
                <path d="M0 12c6-8 12 8 18 0s12-8 18 0 12 8 18 0 8-4 10 0" />
              </svg>
            </div>
            <span>{t(language, "appName")}</span>
          </div>
          <button className="icon-btn sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button className="new-chat-btn" onClick={onNewChat}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {t(language, "newChat")}
        </button>

        <nav className="conversation-list">
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`conversation-item ${c.id === activeId ? "active" : ""}`}
              onClick={() => onSelectChat(c.id)}
              title={c.title}
            >
              {c.title}
            </button>
          ))}
        </nav>

        <button className="sidebar-footer" onClick={onChangeSettings}>
          <div className="sidebar-footer-dot" aria-hidden="true" />
          <div className="sidebar-footer-text">
            <span className="sidebar-footer-state">{state}</span>
            <span className="sidebar-footer-lang">{t(language, "changeSettings")}</span>
          </div>
        </button>
      </aside>
    </>
  );
}
