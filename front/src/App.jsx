import { useEffect, useState } from "react";
import Onboarding from "./components/Onboarding.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import { t } from "./data/i18n.js";

const PREFS_KEY = "flood-assist-prefs";
const CONVOS_KEY = "flood-assist-conversations";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(CONVOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function makeConversation(language) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: t(language, "newChat"),
    messages: [{ role: "assistant", content: t(language, "welcomeMessage") }],
  };
}

export default function App() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On first load with existing prefs, make sure there's at least one conversation.
  useEffect(() => {
    if (!prefs) return;
    setConversations((prev) => {
      if (prev.length > 0) {
        setActiveId((cur) => cur || prev[0].id);
        return prev;
      }
      const fresh = makeConversation(prefs.language);
      setActiveId(fresh.id);
      return [fresh];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.language, prefs?.state]);

  useEffect(() => {
    localStorage.setItem(CONVOS_KEY, JSON.stringify(conversations));
  }, [conversations]);

  function handleOnboardComplete(next) {
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }

  function handleChangeSettings() {
    localStorage.removeItem(PREFS_KEY);
    setPrefs(null);
    setSidebarOpen(false);
  }

  function handleNewChat() {
    const fresh = makeConversation(prefs.language);
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setSidebarOpen(false);
  }

  function handleSelectChat(id) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  function handleMessagesChange(newMessages) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        const firstUserMsg = newMessages.find((m) => m.role === "user");
        const title = firstUserMsg
          ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? "…" : "")
          : c.title;
        return { ...c, messages: newMessages, title };
      })
    );
  }

  if (!prefs) {
    return <Onboarding onComplete={handleOnboardComplete} />;
  }

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  if (!active) {
    // conversations still initializing this tick
    return null;
  }

  return (
    <div className="app-shell">
      <Sidebar
        language={prefs.language}
        state={prefs.state}
        conversations={conversations}
        activeId={active.id}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onChangeSettings={handleChangeSettings}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatWindow
        key={active.id}
        language={prefs.language}
        state={prefs.state}
        messages={active.messages}
        onMessagesChange={handleMessagesChange}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
    </div>
  );
}
