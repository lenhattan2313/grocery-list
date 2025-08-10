"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { usePWADetection } from "./use-pwa-detection";

interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
}

interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  maxAlternatives?: number;
}

function getIOSVersion(): number {
  if (/iP(hone|od|ad)/.test(navigator.platform)) {
    const v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
    return parseFloat(
      `${parseInt(v?.[1] || "0", 10)}.${parseInt(v?.[2] || "0", 10)}`
    );
  }
  return 0;
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: "",
    confidence: 0,
    error: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any | null>(null);
  const finalTranscriptRef = useRef("");
  const { isPWA, isIOS } = usePWADetection();
  const iOSVersion = getIOSVersion();

  useEffect(() => {
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) return;

    const recognition = new SpeechRecognition();
    if (isIOS) {
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
    } else {
      recognition.continuous = options.continuous ?? true;
      recognition.interimResults = options.interimResults ?? true;
      recognition.maxAlternatives = options.maxAlternatives ?? 1;
    }
    recognition.lang = options.lang ?? "en-US";

    recognition.onstart = () => {
      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
        transcript: "",
      }));
      finalTranscriptRef.current = "";
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = finalTranscriptRef.current;
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;
        if (isFinal) {
          finalTranscript += transcript;
          confidence = Math.max(confidence, event.results[i][0].confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      setState((prev) => ({
        ...prev,
        transcript: finalTranscript + interimTranscript,
        confidence,
      }));
    };

    recognition.onerror = (event) => {
      let errorMessage = `Speech recognition error: ${event.error}`;
      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected. Please try again.";
          break;
        case "audio-capture":
          errorMessage =
            "Audio capture failed. Please check your microphone permissions.";
          break;
        case "not-allowed":
          errorMessage =
            "Microphone access denied. Please allow microphone access in your browser settings.";
          break;
        case "network":
          errorMessage = "Network error occurred.";
          break;
        case "service-not-allowed":
          errorMessage = "Speech recognition service not allowed.";
          break;
        case "aborted":
          errorMessage = "Voice recognition was interrupted. Please try again.";
          break;
        case "bad-grammar":
          errorMessage = "Speech recognition grammar error.";
          break;
        case "language-not-supported":
          errorMessage = "Language not supported. Please use English.";
          break;
      }
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: errorMessage,
      }));
      if (event.error !== "aborted") {
        toast.error("Voice Recognition Error", { description: errorMessage });
      }
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;
  }, [
    options.continuous,
    options.interimResults,
    options.lang,
    options.maxAlternatives,
    isIOS,
  ]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported");
      return;
    }

    // Early block for old iOS PWAs
    if (isPWA && isIOS && iOSVersion < 17.4) {
      toast.error("Not Supported", {
        description:
          "Microphone is not available in PWAs on iOS before version 17.4. Please open in Safari.",
      });
      return;
    }

    // Must be inside a user gesture
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Stop the stream immediately
        stream.getTracks().forEach((track) => track.stop());
        recognitionRef.current.start();
      })
      .catch(() => {
        toast.error("Microphone Permission Required", {
          description:
            "Please allow microphone access in your device settings to use voice input.",
        });
      });
  }, [isPWA, isIOS, iOSVersion]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: "",
      confidence: 0,
      error: null,
    }));
    finalTranscriptRef.current = "";
  }, []);

  const clearTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: "" }));
    finalTranscriptRef.current = "";
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    reset,
    clearTranscript,
  };
}
