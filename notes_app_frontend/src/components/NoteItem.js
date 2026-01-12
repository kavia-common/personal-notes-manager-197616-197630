import React from "react";
import { formatTimestamp } from "../utils/noteUtils";

/**
 * PUBLIC_INTERFACE
 * A single item row in the note list.
 */
export function NoteItem({ note, selected, onSelect, buttonRef }) {
  const preview =
    (note.content || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 72) || "No content yet.";

  return (
    <button
      type="button"
      ref={buttonRef}
      className="ListItemBtn"
      onClick={onSelect}
      aria-selected={selected}
      aria-label={`Select note ${note.title || "Untitled"}`}
    >
      <div style={{ minWidth: 0 }}>
        <p className="ListItemTitle">{note.title || "Untitled note"}</p>
        <div className="ListItemMeta">
          {preview} · {formatTimestamp(note.updatedAt || note.createdAt)}
        </div>
      </div>

      <div className="ListItemRight" aria-hidden="true">
        {(note.tags || []).length > 0 ? <div className="SmallDot" /> : null}
      </div>
    </button>
  );
}
