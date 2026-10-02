"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

interface GeminiVoiceRoomProps {
  pdfBase64: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export default function GeminiVoiceRoom({ pdfBase64 }: GeminiVoiceRoomProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [asking, setAsking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
  }, []);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const askGemini = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || asking) return;
    setQuestion(trimmed);
    setAsking(true);
    setError(null);
    stopSpeaking();
    try {
      const response = await fetch("/api/ask-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, pdfBase64 }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Gemini request failed");
      setAnswer(body.answer);
      const utterance = new SpeechSynthesisUtterance(body.answer);
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not get an answer");
    } finally {
      setAsking(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input is not supported in this browser. Type your question instead.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setQuestion(text);
      void askGemini(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Microphone input failed. Check browser microphone permission.");
    };
    recognitionRef.current = recognition;
    setListening(true);
    setError(null);
    recognition.start();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void askGemini(question);
  };

  return (
    <div className="gemini-room">
      <div className="voice-state">
        <span className={listening ? "voice-pulse" : "voice-dot"} />
        {listening ? "Listening..." : asking ? "Gemini is thinking..." : speaking ? "Speaking..." : "Ready for your question"}
      </div>
      <div className="answer-panel">
        <p className="answer-label">LATEST ANSWER</p>
        <p className="answer-text">{answer || "Ask something about your PDF."}</p>
        {speaking && (
          <button type="button" className="stop-speaking-button" onClick={stopSpeaking}>
            Stop speaking
          </button>
        )}
      </div>
      <form className="question-form" onSubmit={submit}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Type or speak a question..."
          aria-label="Question"
        />
        <button type="button" className={`mic-button ${listening ? "is-listening" : ""}`} onClick={toggleListening}>
          {listening ? "Stop" : "Mic"}
        </button>
        <button type="submit" className="ask-button" disabled={!question.trim() || asking}>
          {asking ? "..." : "Ask"}
        </button>
      </form>
      {error && <p className="voice-error">{error}</p>}
    </div>
  );
}
