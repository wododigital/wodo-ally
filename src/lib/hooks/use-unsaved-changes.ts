"use client";

import { useEffect } from "react";

/**
 * Warns the user before leaving the page if there are unsaved changes.
 * Uses the browser's native beforeunload event.
 *
 * @param isDirty - whether the form has unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages but still show the dialog
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
