import React, { useMemo, useState } from "react";
import "./App.css";
import { NotesProvider, useNotesActions, useNotesState } from "./context/NotesContext";
import { SearchBar } from "./components/SearchBar";
import { TagFilter } from "./components/TagFilter";
import { NotesList } from "./components/NotesList";
import { NoteEditor } from "./components/NoteEditor";
import { ConfirmDeleteDialog } from "./components/ConfirmDeleteDialog";
import { EmptyState } from "./components/EmptyState";

function AppInner() {
  const {
    loading,
    error,
    providerMode,
    filteredNotes,
    selectedNoteId,
    selectedNote,
    allTags,
    searchQuery,
    selectedTags
  } = useNotesState();

  const { selectNote, setSearch, toggleTag, clearTags, createNote, updateNote, deleteNote } =
    useNotesActions();

  const [deleteDialog, setDeleteDialog] = useState({ open: false, note: null });

  const notesCount = filteredNotes.length;

  const kbdHint = useMemo(() => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    return isMac ? "⌘ N" : "Ctrl N";
  }, []);

  return (
    <div className="App">
      <div className="AppShell">
        <header className="Header">
          <div className="Brand">
            <div className="Logomark" aria-hidden="true" />
            <div className="TitleWrap">
              <h1 className="Title">Notes</h1>
              <p className="Subtitle">Personal notes manager · fast, offline-friendly</p>
            </div>
          </div>
          <div className="HeaderActions">
            <div className="KbdHint" aria-label="Keyboard shortcut hint">
              New: <strong>{kbdHint}</strong>
            </div>
            <button type="button" className="Btn BtnPrimary" onClick={createNote} aria-label="New note">
              New note
            </button>
          </div>
        </header>

        <main className="MainGrid">
          <section className="Panel" aria-label="Notes sidebar">
            <div className="PanelHeader">
              <div className="SidebarTopRow">
                <h2 className="SidebarTitle">Your notes</h2>
                <span className="Badge" aria-label="Visible notes count">
                  {notesCount}
                </span>
              </div>

              <div className="Toolbar">
                <SearchBar value={searchQuery} onChange={setSearch} />
              </div>

              <div style={{ marginTop: 12 }}>
                <TagFilter
                  tags={allTags}
                  selectedTags={selectedTags}
                  onToggleTag={toggleTag}
                  onClear={clearTags}
                />
              </div>
            </div>

            <div>
              {loading ? (
                <EmptyState title="Loading…" body="Fetching your notes and preparing the editor." />
              ) : (
                <NotesList notes={filteredNotes} selectedNoteId={selectedNoteId} onSelect={selectNote} />
              )}
            </div>
          </section>

          <section className="Panel" aria-label="Note editor panel">
            <div className="PanelHeader">
              <div className="Row" style={{ justifyContent: "space-between" }}>
                <h2 className="SidebarTitle">Details</h2>
                <span className="Pill" aria-label="Sync mode badge">
                  {providerMode === "api" ? "API connected" : "Local mode"}
                </span>
              </div>
            </div>

            <div className="PanelBody">
              <NoteEditor
                note={selectedNote}
                onCreateNew={createNote}
                onUpdate={(id, patch) => updateNote(id, patch)}
                onDeleteRequest={(note) => setDeleteDialog({ open: true, note })}
                providerMode={providerMode}
                error={error}
              />
            </div>
          </section>
        </main>

        <ConfirmDeleteDialog
          open={deleteDialog.open}
          title="Delete note?"
          body={
            <div>
              This will permanently delete <strong>{deleteDialog.note?.title || "Untitled note"}</strong>.
              <div className="HelpText">Tip: You can create a new note with {kbdHint}.</div>
            </div>
          }
          confirmText="Delete"
          onCancel={() => setDeleteDialog({ open: false, note: null })}
          onConfirm={() => {
            const id = deleteDialog.note?.id;
            setDeleteDialog({ open: false, note: null });
            if (id) deleteNote(id);
          }}
        />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Root application entry component. */
  return (
    <NotesProvider>
      <AppInner />
    </NotesProvider>
  );
}

export default App;
