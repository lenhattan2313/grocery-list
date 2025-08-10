"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { usePWADetection } from "./use-pwa-detection";
import { useIOSAudioFix } from "./use-ios-audio-fix";

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

export function useVoiceRecognitionIOS(options: VoiceRecognitionOptions = {}) {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: "",
    confidence: 0,
    error: null,
  });

  const { isPWA, isIOS } = usePWADetection();
  const { initializeAudioContext, requestMicrophonePermission } =
    useIOSAudioFix();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any | null>(null);
  const finalTranscriptRef = useRef("");

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    console.log("Speech recognition supported:", isSupported);
    console.log("PWA mode:", isPWA, "iOS:", isIOS);

    setState((prev) => ({ ...prev, isSupported }));

    if (isSupported) {
      const recognition = new SpeechRecognition();

      // Configure recognition with iOS-specific settings
      recognition.continuous = isIOS ? false : options.continuous ?? true;
      recognition.interimResults = isIOS
        ? false
        : options.interimResults ?? true;
      recognition.lang = options.lang ?? "en-US";
      recognition.maxAlternatives = options.maxAlternatives ?? 1;

      // iOS-specific configurations
      if (isIOS) {
        // For iOS, we need to be more conservative with settings
        recognition.continuous = false; // iOS works better with non-continuous
        recognition.interimResults = false; // iOS works better without interim results
      }

      // Event handlers
      recognition.onstart = () => {
        console.log("Speech recognition started");
        setState((prev) => ({
          ...prev,
          isListening: true,
          error: null,
          transcript: "",
        }));
        finalTranscriptRef.current = "";
      };

      recognition.onresult = (event) => {
        console.log("Speech recognition result:", event);
        let interimTranscript = "";
        let finalTranscript = finalTranscriptRef.current;
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;

          console.log(`Result ${i}:`, {
            transcript,
            isFinal,
            confidence: event.results[i][0].confidence,
          });

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
        console.error("Speech recognition error:", event.error, event);
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
        console.log("Speech recognition ended");
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

    console.log("Starting voice recognition...");

    try {
      // For iOS PWA, we need special handling
      if (isIOS && isPWA) {
        // Initialize audio context first
        await initializeAudioContext();

        // Request microphone permission
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          toast.error("Microphone Permission Required", {
            description:
              "Please allow microphone access in your device settings to use voice input.",
          });
          return;
        }

        // Add a delay for iOS PWA
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      recognitionRef.current.start();
      console.log("Voice recognition started successfully");
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start listening";
      setState((prev) => ({ ...prev, error: errorMessage }));
      toast.error("Failed to start voice recognition", {
        description: errorMessage,
      });
    }
  }, [isPWA, isIOS, initializeAudioContext, requestMicrophonePermission]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      console.log("Stopping voice recognition...");
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
