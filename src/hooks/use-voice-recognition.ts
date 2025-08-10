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

  // Check if speech recognition is supported and handle iOS-specific issues
  useEffect(() => {
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    setState((prev) => ({ ...prev, isSupported }));

    if (isSupported) {
      const recognition = new SpeechRecognition();

      // iOS-specific configurations - these are crucial for iOS PWA
      if (isIOS) {
        // iOS works much better with these settings
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
      } else {
        // Default settings for other platforms
        recognition.continuous = options.continuous ?? true;
        recognition.interimResults = options.interimResults ?? true;
        recognition.maxAlternatives = options.maxAlternatives ?? 1;
      }

      recognition.lang = options.lang ?? "en-US";

      // iOS-specific: Set recognition mode for better compatibility
      if (recognition.recognitionMode) {
        recognition.recognitionMode = "continuous";
      }

      // Event handlers
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
        let errorMessage = "Speech recognition error";

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
            errorMessage =
              "Voice recognition was interrupted. Please try again.";
            break;
          case "bad-grammar":
            errorMessage = "Speech recognition grammar error.";
            break;
          case "language-not-supported":
            errorMessage = "Language not supported. Please use English.";
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        setState((prev) => ({
          ...prev,
          isListening: false,
          error: errorMessage,
        }));

        // Don't show toast for aborted errors as they're usually user-initiated
        if (event.error !== "aborted") {
          toast.error("Voice Recognition Error", {
            description: errorMessage,
          });
        }
      };

      recognition.onend = () => {
        setState((prev) => ({ ...prev, isListening: false }));
      };

      recognitionRef.current = recognition;
    }
  }, [
    options.continuous,
    options.interimResults,
    options.lang,
    options.maxAlternatives,
    isPWA,
    isIOS,
  ]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported");
      return;
    }

    // Check if we're in a PWA context and handle iOS-specific requirements
    if (isPWA) {
      // For iOS PWA, we need to ensure microphone permissions are granted
      try {
        // Request microphone permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately
      } catch {
        toast.error("Microphone Permission Required", {
          description:
            "Please allow microphone access in your device settings to use voice input.",
        });
        return;
      }
    }

    try {
      // For iOS PWA, add a small delay before starting
      if (isIOS && isPWA) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      recognitionRef.current.start();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start listening";
      setState((prev) => ({ ...prev, error: errorMessage }));
      toast.error("Failed to start voice recognition", {
        description: errorMessage,
      });
    }
  }, [isPWA, isIOS]);

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
