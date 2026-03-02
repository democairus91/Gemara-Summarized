import React, { useState, useRef, useEffect, useCallback } from "react";

export default function GemaraViewer({ data, showEnglish, onTextSelected }) {
  const [selectionInfo, setSelectionInfo] = useState(null);
  const viewerRef = useRef(null);

  // ── Get context from the selected segment ────────────────
  const getSegmentContext = useCallback((node) => {
    let el = node;
    if (el.nodeType === Node.TEXT_NODE) el = el.parentElement;
    while (el && !el.hasAttribute("data-segment")) {
      el = el.parentElement;
    }
    return el ? el.textContent : "";
  }, []);

  // ── Handle text selection ────────────────────────────────
  const handleMouseUp = useCallback(() => {
    // Small delay so the selection is finalized
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (
        text &&
        text.length > 0 &&
        viewerRef.current?.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const context = getSegmentContext(selection.anchorNode);

        setSelectionInfo({
          text,
          context,
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }
    }, 10);
  }, [getSegmentContext]);

  // ── Clear selection on outside click ─────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest(".explain-float-btn")) return;
    setSelectionInfo(null);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);

  // ── Handle explain click ─────────────────────────────────
  const handleExplain = () => {
    if (selectionInfo) {
      onTextSelected(selectionInfo.text, selectionInfo.context);
      setSelectionInfo(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  if (!data) return null;

  return (
    <div className="gemara-viewer" ref={viewerRef}>
      {/* Reference header */}
      <div className="gemara-ref">
        <div className="gemara-ref-he">{data.heRef}</div>
        <div className="gemara-ref-en">{data.ref}</div>
      </div>

      {/* Text segments */}
      <div className="gemara-text-container">
        {data.he.map((segment, idx) => (
          <React.Fragment key={idx}>
            <div
              className="gemara-segment"
              data-segment={idx}
              dangerouslySetInnerHTML={{ __html: segment }}
            />
            {showEnglish && data.text[idx] && (
              <div
                className="english-segment"
                dangerouslySetInnerHTML={{ __html: data.text[idx] }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <p className="gemara-hint">
        💡 Highlight any word or phrase to get an AI-powered explanation
      </p>

      {/* Floating explain button */}
      {selectionInfo && (
        <button
          className="explain-float-btn"
          style={{
            left: selectionInfo.x,
            top: selectionInfo.y - 8,
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
          onClick={handleExplain}
        >
          ✨ Explain
        </button>
      )}
    </div>
  );
}
