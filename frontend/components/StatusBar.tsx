"use client";

import { AppState } from "@/app/page";

interface StatusBarProps {
  message: string;
  state: AppState;
}

export default function StatusBar({ message, state }: StatusBarProps) {
  return (
    <div className={`status-bar status-${state}`}>
      <span className="status-dot" />
      {message}
    </div>
  );
}
