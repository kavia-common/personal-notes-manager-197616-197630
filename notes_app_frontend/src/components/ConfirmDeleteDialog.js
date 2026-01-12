import React, { useEffect, useRef } from "react";

/**
 * PUBLIC_INTERFACE
 * Simple confirm dialog for destructive actions.
 */
export function ConfirmDeleteDialog({ open, title, body, confirmText, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="DialogOverlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="Dialog" role="dialog" aria-modal="true" aria-label={title || "Confirm"}>
        <div className="DialogHeader">
          <p className="DialogTitle">{title || "Confirm"}</p>
        </div>
        <div className="DialogBody">{body}</div>
        <div className="DialogFooter">
          <button
            ref={cancelRef}
            type="button"
            className="Btn"
            onClick={onCancel}
            aria-label="Cancel delete"
          >
            Cancel
          </button>
          <button
            type="button"
            className="Btn BtnDanger"
            onClick={onConfirm}
            aria-label="Confirm delete"
          >
            {confirmText || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
