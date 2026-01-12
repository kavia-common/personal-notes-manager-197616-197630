import React from "react";

/**
 * PUBLIC_INTERFACE
 * Search bar for filtering notes by title/content.
 */
export function SearchBar({ value, onChange }) {
  return (
    <div className="Row RowGrow" role="search">
      <label className="visuallyHidden" htmlFor="searchInput">
        Search notes
      </label>
      <input
        id="searchInput"
        className="Input"
        type="search"
        placeholder="Search notes…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search notes"
      />
    </div>
  );
}
