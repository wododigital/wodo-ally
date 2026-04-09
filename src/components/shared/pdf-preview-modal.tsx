"use client";

import { X, Download, FileText } from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl?: string;
  onDownload?: () => void;
}

export function PdfPreviewModal({ isOpen, onClose, title, pdfUrl, onDownload }: PdfPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{ background: "#1d1f2e", border: "1px solid rgba(255,255,255,0.1)", height: "85vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(253,126,20,0.15)" }}>
              <FileText className="w-4 h-4" style={{ color: "#fd7e14" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{title}</p>
          </div>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "#fd7e14", color: "#fff" }}
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title={title}
              style={{ border: "none" }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-6 rounded-2xl" style={{ background: "rgba(253,126,20,0.1)" }}>
                <FileText className="w-12 h-12" style={{ color: "#fd7e14" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                {title}
              </p>
              <p className="text-xs text-center max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Generating PDF preview...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
