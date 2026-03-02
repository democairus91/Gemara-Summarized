import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ExplanationPopup({
  text,
  explanation,
  loading,
  error,
  reference,
  onClose,
}) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="popup-header">
          <div className="popup-header-text">
            <h3>「{text}」</h3>
            <div className="popup-ref">{reference}</div>
          </div>
          <button className="popup-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="popup-body">
          {loading && !explanation && (
            <div className="popup-loading">
              <div className="spinner" />
              <p>Analyzing text…</p>
            </div>
          )}

          {error && (
            <div className="popup-error">
              <p>⚠️ {error}</p>
            </div>
          )}

          {explanation && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children} ↗
                  </a>
                ),
              }}
            >
              {explanation}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
