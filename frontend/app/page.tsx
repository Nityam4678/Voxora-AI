"use client";

import { useState, useCallback } from "react";
import GeminiVoiceRoom from "@/components/GeminiVoiceRoom";
import PDFUploader from "@/components/PDFUploader";
import StatusBar from "@/components/StatusBar";

export type AppState = "idle" | "connecting" | "connected" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [statusMsg, setStatusMsg] = useState("Upload a PDF to get started");
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);

  const startSession = useCallback(() => {
    setAppState("connected");
    setStatusMsg("Gemini voice assistant ready — ask a question");
  }, []);

  const handlePdfLoaded = useCallback((filename: string, base64: string) => {
    setPdfReady(true);
    setPdfData(base64);
    setStatusMsg(`"${filename}" loaded — click Start Session to begin`);
  }, []);

  return (
    <main className="app-shell">
      {/* Header */}
      <div className="hero-copy">
        <p className="eyebrow">DOCUMENT INTELLIGENCE / VOICE INTERFACE</p>
        <h1>
          Voice RAG Assistant
        </h1>
        <p className="subtitle">
          Upload a PDF · Start a session · Ask anything by voice
        </p>
      </div>

      {/* Status */}
      <section className="workspace-panel">
        <StatusBar message={statusMsg} state={appState} />

      {/* Upload */}
        <PDFUploader
        onPdfLoaded={handlePdfLoaded}
        disabled={appState === "connected"}
        />

      {/* Voice Room */}
        {appState === "connected" && pdfData ? (
          <GeminiVoiceRoom pdfBase64={pdfData} />
        ) : (
          <button
            onClick={startSession}
            disabled={!pdfReady || appState === "connecting"}
            className="session-button"
          >
            {appState === "connecting" ? "Connecting..." : appState === "error" ? "Try Again" : "Start Voice Session"}
          </button>
        )}
      </section>

      <p className="footer-note">
        Built by Nityam Pal and Saksham Gupta
      </p>
    </main>
  );
}
