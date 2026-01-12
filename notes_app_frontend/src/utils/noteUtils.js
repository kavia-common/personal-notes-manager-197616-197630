/**
 * Utilities for notes: IDs, timestamps, tag normalization.
 */

/**
 * PUBLIC_INTERFACE
 * Generates a reasonably unique ID for notes created client-side.
 * @returns {string} Unique ID string.
 */
export function generateId() {
  // Prefer crypto.randomUUID when available; fallback to time + random.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `note_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * PUBLIC_INTERFACE
 * Returns ISO timestamp for "now".
 * @returns {string} ISO timestamp.
 */
export function nowIso() {
  return new Date().toISOString();
}

/**
 * PUBLIC_INTERFACE
 * Normalizes a tags string like "work, personal  ideas" into ["work","personal","ideas"].
 * @param {string} rawTags Raw input string (comma-separated) or empty.
 * @returns {string[]} Normalized unique tags.
 */
export function parseTags(rawTags) {
  if (!rawTags) return [];
  const parts = rawTags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase());

  return Array.from(new Set(parts));
}

/**
 * PUBLIC_INTERFACE
 * Formats an ISO timestamp into a concise human string.
 * @param {string} iso ISO timestamp.
 * @returns {string} Human-friendly date/time.
 */
export function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { year: "numeric", month: "short", day: "2-digit" });
}
