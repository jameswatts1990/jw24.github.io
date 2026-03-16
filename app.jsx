const { useEffect, useRef, useState } = React;

const LOCAL_STORAGE_KEY = "kanban-board-local-v1";
const REMOTE_SAVE_DELAY_MS = 900;

const REMOTE_CONFIG = window.KANBAN_REMOTE || {
  url: "",
  apiKey: "",
  table: "boards",
  boardId: "main",
};

const INIT_DATA = {
  columns: [
    { id: "backlog", title: "Backlog", color: "#6366f1" },
    { id: "todo", title: "To Do", color: "#f59e0b" },
    { id: "progress", title: "In Progress", color: "#3b82f6" },
    { id: "review", title: "Review", color: "#a855f7" },
    { id: "done", title: "Done", color: "#22c55e" },
  ],
  cards: [
    { id: "c1", col: "backlog", title: "Research competitors", desc: "Analyze top 5 competitors and summarize findings.", tags: ["research"], priority: "low", created: "Mar 10" },
    { id: "c2", col: "backlog", title: "Define user personas", desc: "", tags: ["design"], priority: "med", created: "Mar 11" },
    { id: "c3", col: "todo", title: "Design landing page", desc: "Create wireframes and hi-fi mockups.", tags: ["design", "ui"], priority: "high", created: "Mar 8" },
  ],
};

const PRIO = { high: { bg: "#fee2e2", text: "#dc2626", label: "High" }, med: { bg: "#fef3c7", text: "#d97706", label: "Med" }, low: { bg: "#dcfce7", text: "#16a34a", label: "Low" } };
const TAG_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#e11d48", "#84cc16"];
const tagColor = (t) => TAG_COLORS[Math.abs([...t].reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_COLORS.length];

const hasRemote = Boolean(REMOTE_CONFIG.url && REMOTE_CONFIG.apiKey);
const remoteHeaders = () => ({
  apikey: REMOTE_CONFIG.apiKey,
  Authorization: `Bearer ${REMOTE_CONFIG.apiKey}`,
  "Content-Type": "application/json",
});

async function remoteLoad() {
  if (!hasRemote) return null;
  const base = `${REMOTE_CONFIG.url.replace(/\/$/, "")}/rest/v1/${REMOTE_CONFIG.table}`;
  const res = await fetch(`${base}?select=data&id=eq.${encodeURIComponent(REMOTE_CONFIG.boardId)}`, { headers: remoteHeaders() });
  if (!res.ok) throw new Error("Unable to load remote board");
  const rows = await res.json();
  return rows?.[0]?.data?.cards ? rows[0].data : null;
}

async function remoteSave(cards) {
  if (!hasRemote) return;
  const base = `${REMOTE_CONFIG.url.replace(/\/$/, "")}/rest/v1/${REMOTE_CONFIG.table}`;
  const payload = { id: REMOTE_CONFIG.boardId, data: { cards } };
  const res = await fetch(base, {
    method: "POST",
    headers: { ...remoteHeaders(), Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Unable to save remote board");
}

function App() {
  const [cols] = useState(INIT_DATA.columns);
  const [cards, setCards] = useState(INIT_DATA.cards);
  const [modal, setModal] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropCol, setDropCol] = useState(null);
  const [addingTo, setAddingTo] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [syncStatus, setSyncStatus] = useState(hasRemote ? "Connecting" : "Local only");
  const inputRef = useRef(null);
  const isReadyRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fromLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (fromLocal) {
      try {
        const parsed = JSON.parse(fromLocal);
        if (Array.isArray(parsed?.cards)) setCards(parsed.cards);
      } catch {}
    }

    if (!hasRemote) {
      isReadyRef.current = true;
      return;
    }

    (async () => {
      try {
        const remoteData = await remoteLoad();
        if (remoteData?.cards) setCards(remoteData.cards);
        setSyncStatus("Shared sync on");
      } catch {
        setSyncStatus("Remote unavailable");
      } finally {
        isReadyRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ cards }));
    if (!hasRemote || !isReadyRef.current) return;

    setSyncStatus((s) => (s === "Remote unavailable" ? s : "Syncing…"));
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await remoteSave(cards);
        setSyncStatus("Shared sync on");
      } catch {
        setSyncStatus("Remote unavailable");
      }
    }, REMOTE_SAVE_DELAY_MS);
  }, [cards]);

  const closeModal = () => {
    if (modal) {
      setCards((cs) => cs.map((c) => (c.id === modal.id ? { ...modal } : c)));
      setModal(null);
    }
  };

  const addCard = (colId) => {
    if (!newTitle.trim()) return;
    setCards((cs) => [...cs, { id: `c${Date.now()}`, col: colId, title: newTitle.trim(), desc: "", tags: [], priority: "med", created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }]);
    setNewTitle("");
    setAddingTo(null);
  };

  const colCards = (colId) => cards.filter((c) => c.col === colId);

  return <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", height: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#e2e8f0" }}>
    <header style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "grid", placeItems: "center", fontWeight: 800 }}>K</div>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Kanban Board</h1>
      <span style={{ marginLeft: "auto", fontSize: 13, color: "#94a3b8" }}>{cards.length} cards</span>
      <span style={{ fontSize: 12, color: "#cbd5e1", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 999, padding: "4px 10px" }}>{syncStatus}</span>
    </header>

    <div style={{ padding: "8px 24px 0", fontSize: 12, color: "#94a3b8" }}>
      {hasRemote ? "Board changes are shared across users through Supabase." : "Set window.KANBAN_REMOTE in index.html to enable shared persistence across users."}
    </div>

    <div style={{ flex: 1, display: "flex", gap: 16, padding: "16px 24px 20px", overflowX: "auto", minHeight: 0 }}>
      {cols.map((col) => {
        const cc = colCards(col.id);
        const isOver = dropCol === col.id;
        return <div key={col.id} onDragOver={(e) => { e.preventDefault(); setDropCol(col.id); }} onDragLeave={() => setDropCol(null)} onDrop={(e) => { e.preventDefault(); if (dragId) setCards((cs) => cs.map((c) => c.id === dragId ? { ...c, col: col.id } : c)); setDropCol(null); setDragId(null); }} style={{ minWidth: 272, maxWidth: 272, display: "flex", flexDirection: "column", background: isOver ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)", borderRadius: 12, border: isOver ? "2px dashed #6366f1" : "2px solid transparent" }}>
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{col.title}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>{cc.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
            {cc.map((card) => <div key={card.id} draggable onDragStart={(e) => { setDragId(card.id); e.dataTransfer.effectAllowed = "move"; }} onClick={() => setModal({ ...card })} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 10, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{card.title}</div>
              {card.desc && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{card.desc}</div>}
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: PRIO[card.priority].bg, color: PRIO[card.priority].text }}>{PRIO[card.priority].label}</span>
            </div>)}
            {addingTo === col.id ? <div style={{ display: "flex", gap: 6 }}>
              <input ref={inputRef} autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Card title" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e2e8f0", padding: "8px 10px", fontSize: 12, outline: "none" }} />
              <button onClick={() => addCard(col.id)} style={{ border: "none", borderRadius: 8, padding: "8px 10px", background: "#6366f1", color: "#fff", cursor: "pointer" }}>Add</button>
            </div> : <button onClick={() => { setAddingTo(col.id); setTimeout(() => inputRef.current?.focus(), 0); }} style={{ marginTop: 2, background: "transparent", border: "1px dashed rgba(148,163,184,0.45)", color: "#94a3b8", borderRadius: 10, padding: "9px 10px", fontSize: 12, textAlign: "left", cursor: "pointer" }}>+ Add card</button>}
          </div>
        </div>;
      })}
    </div>

    {modal && <div onClick={closeModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1e293b", borderRadius: 16, width: "min(520px,90vw)", maxHeight: "85vh", overflow: "auto", padding: 28, border: "1px solid rgba(255,255,255,0.08)" }}>
        <input value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} style={{ width: "100%", background: "transparent", border: "none", color: "#f1f5f9", fontSize: 20, fontWeight: 700, marginBottom: 12, outline: "none" }} />
        <textarea value={modal.desc} onChange={(e) => setModal({ ...modal, desc: e.target.value })} rows={4} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button onClick={() => { setCards((cs) => cs.filter((c) => c.id !== modal.id)); setModal(null); }} style={{ padding: "8px 16px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Delete</button>
          <button onClick={closeModal} style={{ padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Save</button>
        </div>
      </div>
    </div>}
  </div>;
}

ReactDOM.render(<App />, document.getElementById("root"));
