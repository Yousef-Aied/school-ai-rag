// Sidebar (Previous Conversations)
export default function Sidebar({ conversations, activeId, onNewChat, onSelect, onDelete }) {
  return (
    <aside className="sidebar">
      <div className="sidebarTop">
        <div className="brand">School AI</div>
        <button className="btn" onClick={onNewChat}>+ New chat</button>
      </div>

      <div className="sidebarList">
        {conversations.map((c) => (
          <div
            key={c.id}
            className={"chatItem " + (c.id === activeId ? "active" : "")}
            onClick={() => onSelect(c.id)}
            role="button"
            tabIndex={0}
          >
            <div className="chatTitle">{c.title || "New chat"}</div>
            <button
              className="chatDelete"
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
