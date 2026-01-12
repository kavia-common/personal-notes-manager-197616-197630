import React from "react";

/**
 * PUBLIC_INTERFACE
 * A small empty-state message panel.
 */
export function EmptyState({ title, body, action }) {
  return (
    <div className="EmptyState" role="status" aria-live="polite">
      <p className="EmptyTitle">{title}</p>
      <p className="EmptyBody">{body}</p>
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  );
}
