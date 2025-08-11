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
  isRecording: boolean;
  audioBlob: Blob | null;
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
    isRecording: false,
    audioBlob: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const finalTranscriptRef = useRef("");
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const { isPWA, isIOS } = usePWADetection();

  // Check if we should use audio recording instead of speech recognition
  const shouldUseAudioRecording = isPWA && isIOS;

  useEffect(() => {
    // For iOS PWA, we'll use audio recording instead of speech recognition
    if (shouldUseAudioRecording) {
      setState((prev) => ({
        ...prev,
        isSupported: true,
        transcript: "",
      }));
      return;
    }

    // Standard speech recognition for other platforms
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;

    const isSupported = !!SpeechRecognition;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();

    // iOS tends to have unstable continuous mode
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
          errorMessage = "Audio capture failed. Please check your microphone.";
          break;
        case "not-allowed":
          errorMessage =
            "Microphone access denied. Please allow microphone access.";
          break;
        case "network":
          errorMessage = "Network error occurred.";
          break;
        case "service-not-allowed":
          errorMessage = "Speech recognition service not allowed.";
          break;
        case "aborted":
          errorMessage = "Voice recognition was interrupted.";
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
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };

    recognitionRef.current = recognition;
  }, [
    options.continuous,
    options.interimResults,
    options.lang,
    options.maxAlternatives,
    isIOS,
    shouldUseAudioRecording,
  ]);

  const startListening = useCallback(async () => {
    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      if (shouldUseAudioRecording) {
        // Use audio recording for iOS PWA
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm",
        });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstart = () => {
          setState((prev) => ({
            ...prev,
            isRecording: true,
            transcript: "Recording audio... Speak clearly.",
            error: null,
          }));
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          setState((prev) => ({
            ...prev,
            isRecording: false,
            audioBlob,
            transcript: `Audio recorded (${Math.round(
              audioBlob.size / 1024
            )}KB). Processing...`,
          }));

          // Simulate processing time
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              transcript:
                "Audio recorded successfully! Voice processing is limited in iOS PWA. Please use text input for now.",
            }));
          }, 1000);
        };

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          setState((prev) => ({
            ...prev,
            isRecording: false,
            error: "Audio recording failed. Please try again.",
          }));
        };

        mediaRecorder.start();

        toast.success("Recording audio...", {
          description: "Speak your shopping items clearly",
        });
      } else {
        // Use standard speech recognition
        if (!recognitionRef.current) {
          toast.error("Speech recognition not available");
          return;
        }

        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Microphone access error:", error);
      toast.error("Microphone access required", {
        description: "Please allow microphone access to use voice input",
      });
    }
  }, [shouldUseAudioRecording]);

  const stopListening = useCallback(() => {
    if (
      shouldUseAudioRecording &&
      mediaRecorderRef.current &&
      state.isRecording
    ) {
      mediaRecorderRef.current.stop();
    } else if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [shouldUseAudioRecording, state.isRecording, state.isListening]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: "",
      confidence: 0,
      error: null,
      audioBlob: null,
    }));
    finalTranscriptRef.current = "";
    audioChunksRef.current = [];
  }, []);

  const clearTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: "", audioBlob: null }));
    finalTranscriptRef.current = "";
    audioChunksRef.current = [];
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    reset,
    clearTranscript,
    shouldUseAudioRecording,
  };
}
