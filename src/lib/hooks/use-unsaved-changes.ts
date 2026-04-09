"use client";

import { useEffect } from "react";

/**
 * Warns the user before leaving the page if there are unsaved changes.
 * Handles browser close/refresh via beforeunload and browser back/forward via popstate.
 *
 * @param isDirty - whether the form has unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Intercept browser back/forward
    const handlePopState = () => {
      if (isDirty) {
        const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
        if (!confirmed) {
          // Push current URL back to prevent navigation
          window.history.pushState(null, "", window.location.href);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty]);
}
