import React from "react";

/**
 * PUBLIC_INTERFACE
 * Tag filter chip group. Click to toggle tags; uses aria-pressed.
 */
export function TagFilter({ tags, selectedTags, onToggleTag, onClear }) {
  const hasSelection = selectedTags && selectedTags.length > 0;

  return (
    <div>
      <div className="Row" style={{ justifyContent: "space-between" }}>
        <div className="Pill" aria-label="Tag filters">
          Filter by tags
        </div>
        <button
          type="button"
          className="Btn BtnGhost"
          onClick={onClear}
          disabled={!hasSelection}
          aria-label="Clear tag filters"
        >
          Clear
        </button>
      </div>

      {tags.length === 0 ? (
        <div className="HelpText">No tags yet. Add tags in the editor (comma-separated).</div>
      ) : (
        <div className="TagCloud" role="group" aria-label="Tag filter options">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className="Tag TagButton"
              aria-pressed={selectedTags.includes(t)}
              onClick={() => onToggleTag(t)}
              aria-label={`Filter by tag ${t}`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
