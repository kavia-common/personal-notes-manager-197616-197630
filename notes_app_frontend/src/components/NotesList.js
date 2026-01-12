import React, { useEffect, useMemo, useRef } from "react";
import { NoteItem } from "./NoteItem";
import { EmptyState } from "./EmptyState";

/**
 * PUBLIC_INTERFACE
 * Renders a list of notes with accessible keyboard navigation.
 */
export function NotesList({ notes, selectedNoteId, onSelect }) {
  const itemRefs = useRef(new Map());

  const ids = useMemo(() => notes.map((n) => n.id), [notes]);

  useEffect(() => {
    // When selected note changes, ensure it is visible.
    const el = itemRefs.current.get(selectedNoteId);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedNoteId]);

  function onKeyDown(e) {
    if (ids.length === 0) return;
    const currentIndex = Math.max(0, ids.findIndex((id) => id === selectedNoteId));

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextId = ids[Math.min(ids.length - 1, currentIndex + 1)];
      onSelect(nextId);
      itemRefs.current.get(nextId)?.focus?.();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevId = ids[Math.max(0, currentIndex - 1)];
      onSelect(prevId);
      itemRefs.current.get(prevId)?.focus?.();
    }
    if (e.key === "Home") {
      e.preventDefault();
      onSelect(ids[0]);
      itemRefs.current.get(ids[0])?.focus?.();
    }
    if (e.key === "End") {
      e.preventDefault();
      onSelect(ids[ids.length - 1]);
      itemRefs.current.get(ids[ids.length - 1])?.focus?.();
    }
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No notes match your filters."
        body="Try clearing tags or adjusting your search."
      />
    );
  }

  return (
    <div
      className="ListScroller"
      role="listbox"
      aria-label="Notes list"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <ul className="List" aria-label="Notes">
        {notes.map((note) => (
          <li key={note.id}>
            <NoteItem
              note={note}
              selected={note.id === selectedNoteId}
              onSelect={() => onSelect(note.id)}
              buttonRef={(el) => {
                if (el) itemRefs.current.set(note.id, el);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
