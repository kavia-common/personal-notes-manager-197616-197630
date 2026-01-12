import React, { useEffect, useMemo, useState } from "react";
import { parseTags } from "../utils/noteUtils";
import { EmptyState } from "./EmptyState";

/**
 * PUBLIC_INTERFACE
 * Editor for the currently selected note.
 */
export function NoteEditor({
  note,
  onCreateNew,
  onUpdate,
  onDeleteRequest,
  providerMode,
  error
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState("");

  const tagsArray = useMemo(() => parseTags(tagsText), [tagsText]);

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setTagsText((note?.tags || []).join(", "));
  }, [note?.id]); // intentionally keyed on identity

  // Auto-save debounce
  useEffect(() => {
    if (!note) return;
    const handle = setTimeout(() => {
      const patch = {
        title,
        content,
        tags: tagsArray
      };
      onUpdate(note.id, patch);
    }, 350);

    return () => clearTimeout(handle);
  }, [note, title, content, tagsArray, onUpdate]);

  if (!note) {
    return (
      <EmptyState
        title="Select a note to start editing"
        body="Create a note or pick one from the list to view and edit it."
        action={
          <button type="button" className="Btn BtnPrimary" onClick={onCreateNew}>
            New note
          </button>
        }
      />
    );
  }

  return (
    <div>
      <div className="EditorHeader">
        <div>
          <p className="EditorTitle">Editor</p>
          <div className="HelpText">
            Sync mode: <strong>{providerMode === "api" ? "API" : "Local"}</strong>
            {providerMode === "api" ? "" : " (offline fallback)"}
          </div>
        </div>

        <div className="EditorActions">
          <button type="button" className="Btn" onClick={onCreateNew} aria-label="Create new note">
            New
          </button>
          <button
            type="button"
            className="Btn BtnDanger"
            onClick={() => onDeleteRequest(note)}
            aria-label="Delete note"
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label className="visuallyHidden" htmlFor="titleInput">
          Note title
        </label>
        <input
          id="titleInput"
          className="Input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          aria-label="Note title"
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <label className="visuallyHidden" htmlFor="tagsInput">
          Note tags
        </label>
        <input
          id="tagsInput"
          className="Input"
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="Tags (comma-separated) e.g. work, personal"
          aria-label="Note tags"
        />
        <div className="HelpText">
          Tags detected:{" "}
          {tagsArray.length === 0
            ? "none"
            : tagsArray.map((t) => (
                <span key={t} className="Tag" style={{ marginRight: 8 }}>
                  #{t}
                </span>
              ))}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <label className="visuallyHidden" htmlFor="contentInput">
          Note content
        </label>
        <textarea
          id="contentInput"
          className="Textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note…"
          aria-label="Note content"
        />
      </div>

      {error ? <div className="ErrorText" role="alert">{error}</div> : null}
    </div>
  );
}
