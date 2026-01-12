import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { createNotesProvider } from "../api/notesProvider";
import { generateId, nowIso } from "../utils/noteUtils";

const NotesStateContext = createContext(null);
const NotesActionsContext = createContext(null);

function getQueryNoteId() {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get("noteId");
  } catch {
    return null;
  }
}

function setQueryNoteId(noteId) {
  try {
    const url = new URL(window.location.href);
    if (noteId) url.searchParams.set("noteId", noteId);
    else url.searchParams.delete("noteId");
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
}

function deriveAllTags(notes) {
  const set = new Set();
  for (const n of notes) {
    for (const t of n.tags || []) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function matchesSearch(note, q) {
  if (!q) return true;
  const s = q.toLowerCase().trim();
  if (!s) return true;
  return (
    (note.title || "").toLowerCase().includes(s) ||
    (note.content || "").toLowerCase().includes(s)
  );
}

function matchesTags(note, selectedTags) {
  if (!selectedTags || selectedTags.length === 0) return true;
  const tags = new Set(note.tags || []);
  return selectedTags.every((t) => tags.has(t));
}

const initialState = {
  providerMode: "local",
  loading: true,
  error: null,

  notes: [],
  selectedNoteId: null,

  searchQuery: "",
  selectedTags: []
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: null };
    case "LOAD_SUCCESS": {
      const notes = action.notes || [];
      const selectedNoteId =
        state.selectedNoteId && notes.some((n) => n.id === state.selectedNoteId)
          ? state.selectedNoteId
          : action.selectedNoteId || notes[0]?.id || null;

      return {
        ...state,
        loading: false,
        error: null,
        notes,
        selectedNoteId,
        providerMode: action.providerMode || state.providerMode
      };
    }
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error || "Failed to load notes." };

    case "SET_PROVIDER_MODE":
      return { ...state, providerMode: action.providerMode };

    case "SELECT_NOTE":
      return { ...state, selectedNoteId: action.noteId };

    case "SET_SEARCH":
      return { ...state, searchQuery: action.value };

    case "TOGGLE_TAG": {
      const tag = action.tag;
      const exists = state.selectedTags.includes(tag);
      const selectedTags = exists
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag];
      return { ...state, selectedTags };
    }

    case "CLEAR_TAGS":
      return { ...state, selectedTags: [] };

    // Optimistic create/update/delete
    case "CREATE_NOTE_OPTIMISTIC": {
      const newNote = action.note;
      return {
        ...state,
        notes: [newNote, ...state.notes],
        selectedNoteId: newNote.id
      };
    }
    case "CREATE_NOTE_ROLLBACK":
      return {
        ...state,
        notes: state.notes.filter((n) => n.id !== action.noteId),
        selectedNoteId: state.selectedNoteId === action.noteId ? null : state.selectedNoteId
      };

    case "UPDATE_NOTE_OPTIMISTIC": {
      const { noteId, patch } = action;
      const notes = state.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n));
      return { ...state, notes };
    }

    case "DELETE_NOTE_OPTIMISTIC": {
      const noteId = action.noteId;
      const remaining = state.notes.filter((n) => n.id !== noteId);
      const selectedNoteId =
        state.selectedNoteId === noteId ? remaining[0]?.id || null : state.selectedNoteId;
      return { ...state, notes: remaining, selectedNoteId };
    }
    case "DELETE_NOTE_ROLLBACK": {
      // Put the note back at top to recover.
      const recovered = action.note;
      const notes = [recovered, ...state.notes];
      return { ...state, notes, selectedNoteId: recovered.id };
    }

    default:
      return state;
  }
}

/**
 * PUBLIC_INTERFACE
 * Provider that supplies notes state/actions.
 */
export function NotesProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const provider = useMemo(() => createNotesProvider(), []);

  const computed = useMemo(() => {
    const allTags = deriveAllTags(state.notes);
    const filteredNotes = state.notes.filter(
      (n) => matchesSearch(n, state.searchQuery) && matchesTags(n, state.selectedTags)
    );
    const selectedNote = state.notes.find((n) => n.id === state.selectedNoteId) || null;

    return { allTags, filteredNotes, selectedNote };
  }, [state.notes, state.searchQuery, state.selectedTags, state.selectedNoteId]);

  // Initial load + query param selection
  useEffect(() => {
    let cancelled = false;

    async function load() {
      dispatch({ type: "LOAD_START" });
      try {
        const notes = await provider.listNotes();
        if (cancelled) return;

        const qId = getQueryNoteId();
        const selectedNoteId = qId && notes.some((n) => n.id === qId) ? qId : null;

        dispatch({
          type: "LOAD_SUCCESS",
          notes,
          selectedNoteId,
          providerMode: provider.getMode()
        });
      } catch (e) {
        if (cancelled) return;
        dispatch({ type: "LOAD_ERROR", error: e?.message || "Failed to load notes." });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [provider]);

  // Keep URL in sync with selection (optional routing via query param)
  useEffect(() => {
    setQueryNoteId(state.selectedNoteId);
  }, [state.selectedNoteId]);

  // Keyboard shortcut: Ctrl/⌘ + N to create note
  useEffect(() => {
    function onKeyDown(e) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        actions.createNote();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, state.notes]);

  const actions = useMemo(() => {
    return {
      /**
       * PUBLIC_INTERFACE
       * Selects a note by ID.
       */
      selectNote(noteId) {
        dispatch({ type: "SELECT_NOTE", noteId });
      },

      /**
       * PUBLIC_INTERFACE
       * Updates search query.
       */
      setSearch(value) {
        dispatch({ type: "SET_SEARCH", value });
      },

      /**
       * PUBLIC_INTERFACE
       * Toggles a tag filter.
       */
      toggleTag(tag) {
        dispatch({ type: "TOGGLE_TAG", tag });
      },

      /**
       * PUBLIC_INTERFACE
       * Clears tag filters.
       */
      clearTags() {
        dispatch({ type: "CLEAR_TAGS" });
      },

      /**
       * PUBLIC_INTERFACE
       * Creates a new note optimistically and persists via provider.
       */
      async createNote() {
        const now = nowIso();
        const note = {
          id: generateId(),
          title: "Untitled note",
          content: "",
          tags: [],
          createdAt: now,
          updatedAt: now
        };

        dispatch({ type: "CREATE_NOTE_OPTIMISTIC", note });
        try {
          await provider.createNote(note);
          dispatch({ type: "SET_PROVIDER_MODE", providerMode: provider.getMode() });
        } catch (e) {
          dispatch({ type: "CREATE_NOTE_ROLLBACK", noteId: note.id });
          dispatch({ type: "LOAD_ERROR", error: e?.message || "Failed to create note." });
        }
      },

      /**
       * PUBLIC_INTERFACE
       * Updates an existing note optimistically and persists.
       * @param {string} noteId Note ID
       * @param {{title?:string,content?:string,tags?:string[]}} patch Patch fields
       */
      async updateNote(noteId, patch) {
        dispatch({ type: "UPDATE_NOTE_OPTIMISTIC", noteId, patch });
        try {
          await provider.updateNote(noteId, patch);
          dispatch({ type: "SET_PROVIDER_MODE", providerMode: provider.getMode() });
        } catch (e) {
          // Reload to recover from mismatch
          dispatch({ type: "LOAD_START" });
          try {
            const notes = await provider.listNotes();
            dispatch({
              type: "LOAD_SUCCESS",
              notes,
              selectedNoteId: noteId,
              providerMode: provider.getMode()
            });
          } catch {
            dispatch({ type: "LOAD_ERROR", error: e?.message || "Failed to update note." });
          }
        }
      },

      /**
       * PUBLIC_INTERFACE
       * Deletes a note optimistically and persists. Rolls back on failure.
       */
      async deleteNote(noteId) {
        const existing = state.notes.find((n) => n.id === noteId);
        if (!existing) return;

        dispatch({ type: "DELETE_NOTE_OPTIMISTIC", noteId });
        try {
          await provider.deleteNote(noteId);
          dispatch({ type: "SET_PROVIDER_MODE", providerMode: provider.getMode() });
        } catch (e) {
          dispatch({ type: "DELETE_NOTE_ROLLBACK", note: existing });
          dispatch({ type: "LOAD_ERROR", error: e?.message || "Failed to delete note." });
        }
      }
    };
    // state.notes used only for rollback lookup; ok to include.
  }, [provider, state.notes]);

  const stateValue = useMemo(() => ({ ...state, ...computed }), [state, computed]);
  return (
    <NotesStateContext.Provider value={stateValue}>
      <NotesActionsContext.Provider value={actions}>{children}</NotesActionsContext.Provider>
    </NotesStateContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * Hook to access notes state.
 */
export function useNotesState() {
  const ctx = useContext(NotesStateContext);
  if (!ctx) throw new Error("useNotesState must be used within NotesProvider");
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * Hook to access notes actions.
 */
export function useNotesActions() {
  const ctx = useContext(NotesActionsContext);
  if (!ctx) throw new Error("useNotesActions must be used within NotesProvider");
  return ctx;
}
