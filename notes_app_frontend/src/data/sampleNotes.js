import { nowIso, generateId } from "../utils/noteUtils";

/**
 * PUBLIC_INTERFACE
 * Returns initial sample notes to show when there is no saved data.
 * @returns {Array<{id:string,title:string,content:string,tags:string[],createdAt:string,updatedAt:string}>}
 */
export function getSampleNotes() {
  const t = nowIso();
  return [
    {
      id: generateId(),
      title: "Welcome to Notes",
      content:
        "This is your personal notes space.\n\nTips:\n- Use the search box to find notes by title/content.\n- Click tags to filter.\n- Use Ctrl/⌘ + N to create a new note.",
      tags: ["welcome", "tips"],
      createdAt: t,
      updatedAt: t
    },
    {
      id: generateId(),
      title: "Project ideas",
      content:
        "- Weekly review template\n- Recipe collection\n- Travel checklist\n\nAdd your own tags like: personal, work, ideas",
      tags: ["ideas", "personal"],
      createdAt: t,
      updatedAt: t
    }
  ];
}
