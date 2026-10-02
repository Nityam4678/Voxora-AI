"use client";

import { useCallback, useRef, useState } from "react";
import { RoomEvent } from "livekit-client";

interface PDFUploaderProps {
  onPdfLoaded: (filename: string, base64: string) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE_MB = 10;

export default function PDFUploader({
  onPdfLoaded,
  disabled,
}: PDFUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") return "Only PDF files are supported.";
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024)
      return `File exceeds ${MAX_FILE_SIZE_MB}MB limit.`;
    return null;
  };

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);
      setFilename(file.name);

      try {
        // Read as base64
        const base64 = await fileToBase64(file);

        onPdfLoaded(file.name, base64);
      } catch (e) {
        setError("Upload failed. Please try again.");
        console.error("PDF upload error:", e);
      } finally {
        setUploading(false);
      }
    },
    [onPdfLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`upload-zone ${dragging ? "is-dragging" : ""} ${disabled ? "is-disabled" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
        }}
      />

      {uploading ? (
        <p className="upload-message is-processing">Processing PDF...</p>
      ) : filename ? (
        <div className="upload-message">
          <p className="file-ready">✓ {filename}</p>
          <p className="upload-hint">Click or drop to replace</p>
        </div>
      ) : (
        <div className="upload-message">
          <p className="document-icon">PDF</p>
          <p className="upload-title">Drop your PDF here</p>
          <p className="upload-hint">or click to browse · max {MAX_FILE_SIZE_MB}MB</p>
        </div>
      )}

      {error && (
        <p className="upload-error">{error}</p>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:application/pdf;base64,
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

