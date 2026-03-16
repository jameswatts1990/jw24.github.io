import { useState, useRef, useCallback } from "react";

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
    { id: "c3", col: "todo", title: "Design landing page", desc: "Create wireframes and hi-fi mockups for the new landing page.", tags: ["design", "ui"], priority: "high", created: "Mar 8" },
    { id: "c4", col: "todo", title: "Set up CI/CD pipeline", desc: "", tags: ["devops"], priority: "med", created: "Mar 12" },
    { id: "c5", col: "progress", title: "Build auth module", desc: "Implement JWT-based authentication with refresh tokens.", tags: ["backend"], priority: "high", created: "Mar 6" },
    { id: "c6", col: "progress", title: "Create component library", desc: "Button, Input, Modal, Card components.", tags: ["frontend", "ui"], priority: "med", created: "Mar 9" },
    { id: "c7", col: "review", title: "API documentation", desc: "Document all REST endpoints with examples.", tags: ["docs"], priority: "low", created: "Mar 5" },
    { id: "c8", col: "done", title: "Project kickoff meeting", desc: "Completed sprint planning and role assignments.", tags: ["planning"], priority: "med", created: "Mar 1" },
  ],
};

const PRIO = { high: { bg: "#fee2e2", text: "#dc2626", label: "High" }, med: { bg: "#fef3c7", text: "#d97706", label: "Med" }, low: { bg: "#dcfce7", text: "#16a34a", label: "Low" } };
const TAG_COLORS = ["#6366f1","#ec4899","#14b8a6","#f97316","#8b5cf6","#06b6d4","#e11d48","#84cc16"];
const tagColor = (t) => TAG_COLORS[Math.abs([...t].reduce((a,c)=>a+c.charCodeAt(0),0)) % TAG_COLORS.length];

export default function App() {
  const [cols] = useState(INIT_DATA.columns);
  const [cards, setCards] = useState(INIT_DATA.cards);
  const [modal, setModal] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropCol, setDropCol] = useState(null);
  const [addingTo, setAddingTo] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef(null);

  const openModal = (card) => setModal({ ...card });
  const closeModal = () => { if (modal) { setCards(cs => cs.map(c => c.id === modal.id ? { ...modal } : c)); setModal(null); } };

  const addCard = (colId) => {
    if (!newTitle.trim()) return;
    setCards(cs => [...cs, { id: "c" + Date.now(), col: colId, title: newTitle.trim(), desc: "", tags: [], priority: "med", created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }]);
    setNewTitle("");
    setAddingTo(null);
  };

  const deleteCard = (id) => { setCards(cs => cs.filter(c => c.id !== id)); setModal(null); };

  const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e, colId) => { e.preventDefault(); setDropCol(colId); };
  const onDragLeave = () => setDropCol(null);
  const onDrop = (e, colId) => {
    e.preventDefault();
    if (dragId) setCards(cs => cs.map(c => c.id === dragId ? { ...c, col: colId } : c));
    setDragId(null);
    setDropCol(null);
  };

  const colCards = (colId) => cards.filter(c => c.col === colId);

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", height: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#e2e8f0" }}>
      <header style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16 }}>K</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Kanban Board</h1>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#94a3b8" }}>{cards.length} cards</span>
      </header>

      <div style={{ flex: 1, display: "flex", gap: 16, padding: "20px 24px", overflowX: "auto", minHeight: 0 }}>
        {cols.map(col => {
          const cc = colCards(col.id);
          const isOver = dropCol === col.id;
          return (
            <div key={col.id}
              onDragOver={e => onDragOver(e, col.id)}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, col.id)}
              style={{ minWidth: 272, maxWidth: 272, display: "flex", flexDirection: "column", background: isOver ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)", borderRadius: 12, border: isOver ? "2px dashed #6366f1" : "2px solid transparent", transition: "all .2s" }}>
              <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{col.title}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "2px 8px" }}>{cc.length}</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
                {cc.map(card => (
                  <div key={card.id} draggable
                    onDragStart={e => onDragStart(e, card.id)}
                    onClick={() => openModal(card)}
                    style={{ background: "rgba(30,41,59,0.9)", borderRadius: 10, padding: "12px 14px", cursor: "grab", border: "1px solid rgba(255,255,255,0.06)", transition: "all .15s", opacity: dragId === card.id ? 0.4 : 1 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = col.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}>
                    {card.priority && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: PRIO[card.priority].bg, color: PRIO[card.priority].text, display: "inline-block", marginBottom: 6 }}>{PRIO[card.priority].label}</span>}
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{card.title}</div>
                    {card.tags.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>{card.tags.map(t => <span key={t} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: tagColor(t) + "22", color: tagColor(t) }}>{t}</span>)}</div>}
                    {card.desc && <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg> Note
                    </div>}
                  </div>
                ))}
                {addingTo === col.id ? (
                  <div style={{ background: "rgba(30,41,59,0.9)", borderRadius: 10, padding: 10, border: "1px solid rgba(99,102,241,0.3)" }}>
                    <input ref={inputRef} value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addCard(col.id)} placeholder="Card title…" autoFocus
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button onClick={() => addCard(col.id)} style={{ flex: 1, padding: "6px 0", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Add</button>
                      <button onClick={() => { setAddingTo(null); setNewTitle(""); }} style={{ padding: "6px 10px", background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingTo(col.id)} style={{ width: "100%", padding: "8px", background: "transparent", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 8, color: "#64748b", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = col.color; e.currentTarget.style.color = col.color; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#64748b"; }}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add card
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && <div onClick={closeModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", zIndex: 999 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#1e293b", borderRadius: 16, width: "min(520px,90vw)", maxHeight: "85vh", overflow: "auto", padding: 28, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
            <div style={{ flex: 1, marginRight: 16 }}>
              <input value={modal.title} onChange={e => setModal({ ...modal, title: e.target.value })} style={{ width: "100%", background: "transparent", border: "none", color: "#f1f5f9", fontSize: 20, fontWeight: 700, padding: 0, outline: "none", borderBottom: "2px solid transparent", transition: "border .2s", boxSizing: "border-box" }} onFocus={e => e.target.style.borderBottomColor = "#6366f1"} onBlur={e => e.target.style.borderBottomColor = "transparent"} />
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>in <strong style={{ color: "#94a3b8" }}>{cols.find(c => c.id === modal.col)?.title}</strong> · created {modal.created}</div>
            </div>
            <button onClick={closeModal} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#94a3b8", width: 32, height: 32, borderRadius: 8, fontSize: 18, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>✕</button>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Priority</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {Object.entries(PRIO).map(([k, v]) => (
              <button key={k} onClick={() => setModal({ ...modal, priority: k })} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: modal.priority === k ? `2px solid ${v.text}` : "2px solid transparent", background: modal.priority === k ? v.bg : "rgba(255,255,255,0.04)", color: modal.priority === k ? v.text : "#94a3b8", transition: "all .15s" }}>{v.label}</button>
            ))}
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Move to</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {cols.map(c => (
              <button key={c.id} onClick={() => setModal({ ...modal, col: c.id })} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: modal.col === c.id ? `2px solid ${c.color}` : "2px solid transparent", background: modal.col === c.id ? c.color + "22" : "rgba(255,255,255,0.04)", color: modal.col === c.id ? c.color : "#94a3b8", transition: "all .15s" }}>{c.title}</button>
            ))}
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Description</label>
          <textarea value={modal.desc} onChange={e => setModal({ ...modal, desc: e.target.value })} placeholder="Add a more detailed description…" rows={4}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, color: "#e2e8f0", fontSize: 13, resize: "vertical", outline: "none", lineHeight: 1.5, boxSizing: "border-box", transition: "border .2s" }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />

          <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginTop: 20, marginBottom: 6 }}>Tags</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {modal.tags.map(t => (
              <span key={t} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: tagColor(t) + "22", color: tagColor(t), display: "flex", alignItems: "center", gap: 4 }}>
                {t} <span onClick={() => setModal({ ...modal, tags: modal.tags.filter(x => x !== t) })} style={{ cursor: "pointer", opacity: 0.7, fontWeight: 700 }}>✕</span>
              </span>
            ))}
          </div>
          <input placeholder="Add tag + Enter" onKeyDown={e => { if (e.key === "Enter" && e.target.value.trim()) { setModal({ ...modal, tags: [...modal.tags, e.target.value.trim().toLowerCase()] }); e.target.value = ""; } }}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => deleteCard(modal.id)} style={{ padding: "8px 16px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Delete card</button>
            <button onClick={closeModal} style={{ padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save & close</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));