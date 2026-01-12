import { getSampleNotes } from "../data/sampleNotes";
import { generateId, nowIso } from "../utils/noteUtils";

const STORAGE_KEY = "notes_app_v1";

/**
 * LocalStorage provider. Always available; used as fallback or persistence layer.
 */
function createLocalStorageProvider() {
  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { notes: getSampleNotes() };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.notes)) return { notes: getSampleNotes() };
      return { notes: parsed.notes };
    } catch {
      return { notes: getSampleNotes() };
    }
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  return {
    /**
     * PUBLIC_INTERFACE
     * Lists notes from localStorage.
     */
    async listNotes() {
      const state = readState();
      return state.notes;
    },

    /**
     * PUBLIC_INTERFACE
     * Creates a note in localStorage.
     */
    async createNote(input) {
      const state = readState();
      const now = nowIso();
      const newNote = {
        id: input.id || generateId(),
        title: input.title ?? "",
        content: input.content ?? "",
        tags: Array.isArray(input.tags) ? input.tags : [],
        createdAt: input.createdAt || now,
        updatedAt: input.updatedAt || now
      };
      const nextNotes = [newNote, ...state.notes];
      writeState({ notes: nextNotes });
      return newNote;
    },

    /**
     * PUBLIC_INTERFACE
     * Updates a note in localStorage.
     */
    async updateNote(noteId, patch) {
      const state = readState();
      const idx = state.notes.findIndex((n) => n.id === noteId);
      if (idx === -1) {
        const err = new Error("Note not found");
        err.code = "NOT_FOUND";
        throw err;
      }
      const existing = state.notes[idx];
      const updated = {
        ...existing,
        ...patch,
        id: existing.id,
        updatedAt: patch.updatedAt || nowIso()
      };
      const nextNotes = [...state.notes];
      nextNotes[idx] = updated;
      writeState({ notes: nextNotes });
      return updated;
    },

    /**
     * PUBLIC_INTERFACE
     * Deletes a note in localStorage.
     */
    async deleteNote(noteId) {
      const state = readState();
      const nextNotes = state.notes.filter((n) => n.id !== noteId);
      writeState({ notes: nextNotes });
      return { ok: true };
    },

    /**
     * PUBLIC_INTERFACE
     * Clears all notes (local only). Used for recovery scenarios.
     */
    async resetToSamples() {
      writeState({ notes: getSampleNotes() });
      return { ok: true };
    }
  };
}

/**
 * API provider. Uses a minimal REST shape:
 * - GET    /notes
 * - POST   /notes
 * - PUT    /notes/:id
 * - DELETE /notes/:id
 *
 * If the backend does not exist, calls will fail and the app will automatically
 * fall back to localStorage provider.
 */
function createApiProvider(baseUrl) {
  const root = baseUrl.replace(/\/+$/, "");

  async function request(path, options = {}) {
    const url = `${root}${path}`;
    const resp = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      const err = new Error(`API request failed (${resp.status}): ${text || resp.statusText}`);
      err.status = resp.status;
      throw err;
    }

    // Some deletes may return empty body.
    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return resp.json();
  }

  return {
    /**
     * PUBLIC_INTERFACE
     * Lists notes from backend.
     */
    async listNotes() {
      const data = await request("/notes", { method: "GET" });
      return Array.isArray(data) ? data : data?.notes || [];
    },

    /**
     * PUBLIC_INTERFACE
     * Creates a note on backend.
     */
    async createNote(input) {
      const data = await request("/notes", { method: "POST", body: JSON.stringify(input) });
      return data?.note || data;
    },

    /**
     * PUBLIC_INTERFACE
     * Updates a note on backend.
     */
    async updateNote(noteId, patch) {
      const data = await request(`/notes/${encodeURIComponent(noteId)}`, {
        method: "PUT",
        body: JSON.stringify(patch)
      });
      return data?.note || data;
    },

    /**
     * PUBLIC_INTERFACE
     * Deletes a note on backend.
     */
    async deleteNote(noteId) {
      const data = await request(`/notes/${encodeURIComponent(noteId)}`, { method: "DELETE" });
      return data || { ok: true };
    }
  };
}

/**
 * PUBLIC_INTERFACE
 * Returns a resilient provider with API-first behavior and fallback to localStorage.
 *
 * Behavior:
 * 1) If REACT_APP_API_BASE or REACT_APP_BACKEND_URL is set, the app will try API.
 * 2) If the API request fails (network error / non-OK), it transparently falls back to localStorage.
 * 3) All successful operations are mirrored into localStorage for offline persistence.
 *
 * @returns {{listNotes:Function,createNote:Function,updateNote:Function,deleteNote:Function, resetToSamples:Function, getMode: Function}}
 */
export function createNotesProvider() {
  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";
  const local = createLocalStorageProvider();
  const api = apiBase ? createApiProvider(apiBase) : null;

  let mode = api ? "api" : "local";

  async function apiOrFallback(fnApi, fnLocal, mirrorToLocal) {
    if (!api) {
      mode = "local";
      return fnLocal();
    }
    try {
      mode = "api";
      const result = await fnApi();
      if (mirrorToLocal) {
        await mirrorToLocal(result);
      }
      return result;
    } catch (e) {
      // Network/backend unreachable or errors -> fallback
      mode = "local";
      return fnLocal(e);
    }
  }

  return {
    /**
     * PUBLIC_INTERFACE
     * Returns last-used mode: "api" or "local".
     */
    getMode() {
      return mode;
    },

    /**
     * PUBLIC_INTERFACE
     * List notes; falls back to localStorage; also seeds localStorage on first run.
     */
    async listNotes() {
      return apiOrFallback(
        async () => api.listNotes(),
        async () => local.listNotes(),
        async (notesFromApi) => {
          // Mirror list into localStorage to support offline
          try {
            // brute force: reset storage then create in order
            await local.resetToSamples();
            // replace with API notes
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: notesFromApi }));
          } catch {
            // ignore mirroring errors
          }
        }
      );
    },

    /**
     * PUBLIC_INTERFACE
     * Create note (optimistic supported by caller).
     */
    async createNote(input) {
      const safeInput = {
        id: input.id || generateId(),
        title: input.title ?? "",
        content: input.content ?? "",
        tags: Array.isArray(input.tags) ? input.tags : [],
        createdAt: input.createdAt || nowIso(),
        updatedAt: input.updatedAt || nowIso()
      };

      return apiOrFallback(
        async () => api.createNote(safeInput),
        async () => local.createNote(safeInput),
        async (createdFromApi) => {
          // Mirror best-effort; if API returns note with server id, update local accordingly
          const note = createdFromApi?.id ? createdFromApi : safeInput;
          try {
            await local.createNote(note);
          } catch {
            // ignore
          }
        }
      );
    },

    /**
     * PUBLIC_INTERFACE
     * Update note.
     */
    async updateNote(noteId, patch) {
      const safePatch = { ...patch, updatedAt: patch.updatedAt || nowIso() };

      return apiOrFallback(
        async () => api.updateNote(noteId, safePatch),
        async () => local.updateNote(noteId, safePatch),
        async (updatedFromApi) => {
          try {
            const note = updatedFromApi?.id ? updatedFromApi : { id: noteId, ...safePatch };
            await local.updateNote(noteId, note);
          } catch {
            // ignore
          }
        }
      );
    },

    /**
     * PUBLIC_INTERFACE
     * Delete note.
     */
    async deleteNote(noteId) {
      return apiOrFallback(
        async () => api.deleteNote(noteId),
        async () => local.deleteNote(noteId),
        async () => {
          try {
            await local.deleteNote(noteId);
          } catch {
            // ignore
          }
        }
      );
    },

    /**
     * PUBLIC_INTERFACE
     * Resets local storage to samples (useful when storage gets corrupted).
     */
    async resetToSamples() {
      mode = "local";
      return local.resetToSamples();
    }
  };
}
