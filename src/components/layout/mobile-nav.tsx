"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-colors duration-150 md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
