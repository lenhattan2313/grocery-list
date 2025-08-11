/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";

export default function VoicePage() {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported on this browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setTranscript(text);
    };

    recognition.onerror = (e: any) => {
      console.error("Recognition error:", e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening((prev) => !prev);
  };

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>🎤 Voice Recognition PWA</h1>
      <button
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          background: isListening ? "red" : "green",
          color: "white",
          border: "none",
          borderRadius: "8px",
        }}
        onClick={toggleListening}
      >
        {isListening ? "Stop" : "Start"} Listening
      </button>
      <p style={{ marginTop: 20 }}>
        <strong>Transcript:</strong> {transcript}
      </p>
    </div>
  );
}
