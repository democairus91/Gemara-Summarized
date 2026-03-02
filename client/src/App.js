import React, { useState, useCallback } from "react";
import DafSelector from "./components/DafSelector";
import GemaraViewer from "./components/GemaraViewer";
import ExplanationPopup from "./components/ExplanationPopup";
import "./App.css";

export default function App() {
  const [tractate, setTractate] = useState("Berakhot");
  const [dafNumber, setDafNumber] = useState(2);
  const [amud, setAmud] = useState("a");

  const [gemaraData, setGemaraData] = useState(null);
  const [gemaraLoading, setGemaraLoading] = useState(false);
  const [gemaraError, setGemaraError] = useState(null);
  const [showEnglish, setShowEnglish] = useState(false);

  // Popup state
  const [popupData, setPopupData] = useState(null);

  const currentRef = `${tractate} ${dafNumber}${amud}`;

  // ── Fetch Gemara ─────────────────────────────────────────
  const fetchGemara = useCallback(async (t, d, a) => {
    setGemaraLoading(true);
    setGemaraError(null);
    try {
      const daf = `${d}${a}`;
      const res = await fetch(
        `/api/gemara/${encodeURIComponent(t)}/${daf}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch");
      }
      const data = await res.json();
      setGemaraData(data);
    } catch (err) {
      setGemaraError(err.message);
      setGemaraData(null);
    } finally {
      setGemaraLoading(false);
    }
  }, []);

  // Fetch on first load
  React.useEffect(() => {
    fetchGemara(tractate, dafNumber, amud);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigate = () => fetchGemara(tractate, dafNumber, amud);

  // ── Prev / Next ──────────────────────────────────────────
  const parseRef = (ref) => {
    if (!ref) return null;
    const match = ref.match(/^(.+)\s(\d+)([ab])$/);
    if (match) {
      return {
        tractate: match[1],
        dafNumber: parseInt(match[2], 10),
        amud: match[3],
      };
    }
    return null;
  };

  const goToRef = (ref) => {
    const parsed = parseRef(ref);
    if (parsed) {
      setTractate(parsed.tractate);
      setDafNumber(parsed.dafNumber);
      setAmud(parsed.amud);
      fetchGemara(parsed.tractate, parsed.dafNumber, parsed.amud);
    }
  };

  // ── AI Explanation (streaming) ───────────────────────────
  const handleTextSelected = useCallback(
    async (text, context) => {
      setPopupData({ text, context, explanation: "", loading: true, error: null });

      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedText: text,
            context,
            reference: currentRef,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (part.startsWith("data: ")) {
              try {
                const data = JSON.parse(part.slice(6));
                if (data.done) break;
                if (data.error) throw new Error(data.error);
                if (data.content) {
                  fullText += data.content;
                  setPopupData((prev) => ({
                    ...prev,
                    explanation: fullText,
                    loading: false,
                  }));
                }
              } catch (parseErr) {
                if (parseErr.message !== "Unexpected end of JSON input") {
                  throw parseErr;
                }
              }
            }
          }
        }

        // Final update
        setPopupData((prev) => ({
          ...prev,
          explanation: fullText || prev.explanation,
          loading: false,
        }));
      } catch (err) {
        setPopupData((prev) => ({
          ...prev,
          error: err.message,
          loading: false,
        }));
      }
    },
    [currentRef]
  );

  const handleClosePopup = () => setPopupData(null);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-he">גמרא</span>
          <span className="title-en">Gemara Explorer</span>
        </h1>
        <p className="app-subtitle">
          Select text to get AI-powered explanations with linked sources
        </p>
      </header>

      <DafSelector
        tractate={tractate}
        dafNumber={dafNumber}
        amud={amud}
        showEnglish={showEnglish}
        onTractateChange={setTractate}
        onDafNumberChange={setDafNumber}
        onAmudChange={setAmud}
        onNavigate={handleNavigate}
        onToggleEnglish={() => setShowEnglish((p) => !p)}
        onPrev={gemaraData?.prev ? () => goToRef(gemaraData.prev) : null}
        onNext={gemaraData?.next ? () => goToRef(gemaraData.next) : null}
      />

      <main className="app-main">
        {gemaraLoading && (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading Gemara…</p>
          </div>
        )}

        {gemaraError && (
          <div className="error-container">
            <p>⚠️ {gemaraError}</p>
            <button onClick={handleNavigate}>Retry</button>
          </div>
        )}

        {gemaraData && !gemaraLoading && (
          <GemaraViewer
            data={gemaraData}
            showEnglish={showEnglish}
            onTextSelected={handleTextSelected}
          />
        )}
      </main>

      {popupData && (
        <ExplanationPopup
          text={popupData.text}
          explanation={popupData.explanation}
          loading={popupData.loading}
          error={popupData.error}
          reference={currentRef}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
}
