# 🎙️ Voxora AI — Realtime Voice-to-Voice RAG Assistant

![Main Page](Images/Main%20Page.png)

> **Talk to your documents.** Upload a PDF, ask questions by voice or text, and hear concise answers grounded in the document.

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=nextdotjs&logoColor=white)
![LiveKit](https://img.shields.io/badge/LiveKit-Agents-00BFFF?style=flat)
![Redis](https://img.shields.io/badge/Redis-Vector_Search-DC382D?style=flat&logo=redis&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat&logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## What it does

The web app reads a PDF in the browser, sends the document and your question to Gemini, and speaks the answer aloud. You can type a question or use browser speech recognition when supported.

The current frontend flow is lightweight: the PDF is converted to base64 in the browser and submitted to the Next.js API route when you ask a question.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                 │
│  PDF upload → browser base64                           │
│  Type or speak a question                              │
└──────────────────────┬─────────────────────────────────┘
                       │ POST /api/ask-gemini
┌──────────────────────▼─────────────────────────────────┐
│              Next.js API route                         │
│  Gemini request: PDF + question                        │
└──────────────────────┬─────────────────────────────────┘
                       │ answer text
┌──────────────────────▼─────────────────────────────────┐
│  Browser SpeechSynthesis → spoken response              │
└─────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Details |
|---|---|
| **PDF questions** | Gemini receives the selected PDF and question together |
| **Voice input** | Browser `SpeechRecognition` / `webkitSpeechRecognition` when available |
| **Spoken answers** | Browser `SpeechSynthesis` reads Gemini's answer aloud |
| **Text input** | Questions can always be typed into the prompt field |
| **Upload validation** | PDF files only, with a 10 MB client-side limit |
| **Frontend** | Next.js 14 with drag-and-drop upload and session state |

---

## Failure Modes — and How They're Handled

This is the part most demos skip. Here's what breaks and how the system recovers:

| Failure | Recovery |
|---|---|
| Missing Gemini key | The API route returns a configuration error |
| Unsupported microphone browser | The UI asks the user to type the question instead |
| Microphone permission failure | The UI displays an input error and keeps text input available |
| Invalid PDF | The upload is rejected before it is submitted |
| Gemini request failure | The API error is shown in the voice room |

---

## Project Structure

```
Voxora-AI/
├── agent/
│   ├── agent.py              # Optional LiveKit/OpenAI voice agent
│   ├── requirements.txt
│   ├── .env.example
│   └── rag/
│       ├── document_store.py # PDF parsing + overlapping chunking
│       ├── retriever.py      # Embedding + cosine retrieval (Redis + fallback)
│       └── redis_store.py    # RediSearch KNN vector store
│
└── frontend/
    ├── app/
    │   ├── page.tsx           # Main UI — upload + session management
    │   └── api/
    │       ├── ask-gemini/route.ts          # Gemini PDF question endpoint
    │       └── connection-details/route.ts  # Optional LiveKit token endpoint
    └── components/
        ├── GeminiVoiceRoom.tsx # Browser voice input + Gemini answers
        ├── PDFUploader.tsx    # Drag-and-drop with validation
        └── StatusBar.tsx      # Session state display
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A browser with microphone access for voice input

### 1. Clone the repo

```bash
git clone https://github.com/Nityam4678/Voxora-AI.git
cd Voxora-AI
```

### 2. Set up the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` and add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

To verify the frontend production build, run:

```bash
cd frontend
npm run build
```

---

## How to Use

1. **Upload a PDF** — drag and drop or click the upload area. The limit is 10 MB.
2. **Start the session** — the question panel appears after the PDF is loaded.
3. **Ask a question** — type it or press **Mic** and speak.
4. **Listen to the answer** — Gemini's response appears on screen and is read aloud by the browser.

---

## Tech Stack

**Frontend (TypeScript)**
- [Next.js 14](https://nextjs.org/) — App Router
- [React 18](https://react.dev/) — client-side UI state
- [Google Gemini API](https://ai.google.dev/gemini-api/docs) — PDF question answering
- Browser Web Speech APIs — speech recognition and speech synthesis

**Optional Python agent**
- [LiveKit Agents](https://docs.livekit.io/agents/) — separate voice-agent implementation
- [OpenAI](https://platform.openai.com/) — embeddings and optional agent LLM/TTS
- [Redis](https://redis.io/) — optional vector storage for the Python agent
- [PyMuPDF](https://pymupdf.readthedocs.io/) — PDF extraction for the Python agent

---

## Design Decisions

The `agent/` directory contains an alternate LiveKit/OpenAI RAG implementation. It is not required by the current Gemini browser flow; the frontend calls `frontend/app/api/ask-gemini/route.ts` directly.

**Why send the PDF with the question?**
The current app keeps the flow simple and server-light by letting Gemini inspect the uploaded PDF directly. This avoids maintaining a separate indexing service for the frontend experience.

**Why overlapping chunks in the optional agent?**
A 500-char chunk with 80-char overlap ensures that answers sitting at chunk boundaries aren't split. Without overlap, the RAG system frequently misses answers that straddle two chunks.

**Why Redis in the optional agent?**
Redis serves dual purpose: vector search + session caching. For a real-time voice system, minimizing infrastructure is critical for latency. Redis KNN search at demo scale (hundreds of chunks) is sub-millisecond.

**Why an in-memory fallback in the optional agent?**
Production systems fail. The in-memory fallback means a Redis outage degrades gracefully instead of crashing the session. The fallback is logged and visible — no silent failures.

---

---

*Built by Nityam Pal and Saksham Gupta*
