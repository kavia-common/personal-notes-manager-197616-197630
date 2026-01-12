# Notes App Frontend (React)

A lightweight personal notes manager UI built with React (no heavy UI libraries).  
It supports creating, viewing, editing, deleting notes, plus search and tag filtering.

## Environment variables

This app reads the backend base URL from:

- `REACT_APP_API_BASE` (preferred)
- `REACT_APP_BACKEND_URL` (fallback)

If neither is set, the app runs fully client-side.

## API + fallback behavior (API → localStorage)

The app uses an **API-first** strategy:

1. If `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL` is set, the UI will attempt to call:
   - `GET    /notes`
   - `POST   /notes`
   - `PUT    /notes/:id`
   - `DELETE /notes/:id`

2. If the API is unreachable (network error / non-OK responses), the app automatically falls back to **localStorage** persistence.

3. When API calls succeed, results are mirrored into localStorage (best-effort) so the app remains usable offline.

Local storage key: `notes_app_v1`

## UX Notes

- **Keyboard**: `Ctrl + N` (Windows/Linux) or `⌘ + N` (macOS) creates a new note.
- **Filtering**: Search by title/content; click tags to filter; clear tags to reset.
- **Sample data**: On first run (or when storage is empty/corrupted), the app shows sample notes to make the UI feel alive immediately.

## Running

In this directory:

- `npm install`
- `npm start`

The app runs on port **3000** with standard Create React App tooling.
