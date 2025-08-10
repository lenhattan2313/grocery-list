"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePWADetection } from "./use-pwa-detection";

interface AudioContextState {
  isInitialized: boolean;
  isRecording: boolean;
  error: string | null;
  audioBlob: Blob | null;
}

export function useIOSAudioFix() {
  const [state, setState] = useState<AudioContextState>({
    isInitialized: false,
    isRecording: false,
    error: null,
    audioBlob: null,
  });

  const { isPWA, isIOS } = usePWADetection();
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Initialize audio context with user interaction
  const initializeAudioContext = useCallback(async () => {
    if (!isIOS || !isPWA) return;

    try {
      // Create audio context only after user interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }

      // Resume audio context (required for iOS)
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      setState((prev) => ({ ...prev, isInitialized: true, error: null }));
      console.log("Audio context initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to initialize audio context",
      }));
    }
  }, [isIOS, isPWA]);

  // Request microphone permissions with proper iOS handling
  const requestMicrophonePermission = useCallback(async () => {
    if (!isIOS || !isPWA) return true;

    try {
      // First, ensure audio context is initialized
      await initializeAudioContext();

      // Request microphone access with specific constraints for iOS
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
        video: false,
      });

      streamRef.current = stream;
      console.log("Microphone permission granted");
      return true;
    } catch (error) {
      console.error("Microphone permission error:", error);
      setState((prev) => ({
        ...prev,
        error:
          "Microphone access denied. Please allow microphone access in Settings.",
      }));
      return false;
    }
  }, [isIOS, isPWA, initializeAudioContext]);

  // Start recording with iOS-specific handling
  const startRecording = useCallback(async () => {
    if (!isIOS || !isPWA) return;

    try {
      // Ensure we have permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;

      // Create media recorder with iOS-compatible settings
      let mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: "audio/webm;codecs=opus",
      });

      // Fallback for iOS if webm is not supported
      if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mediaRecorder = new MediaRecorder(streamRef.current!, {
          mimeType: "audio/mp4",
        });
      }

      // Fallback for older iOS versions
      if (!MediaRecorder.isTypeSupported("audio/mp4")) {
        mediaRecorder = new MediaRecorder(streamRef.current!);
      }

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob,
        }));
        console.log("Recording stopped, blob created");
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: "Recording failed. Please try again.",
        }));
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to start recording. Please try again.",
      }));
    }
  }, [isIOS, isPWA, requestMicrophonePermission]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      console.log("Stopping recording...");
    }
  }, [state.isRecording]);

  // Clean up resources
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    setState((prev) => ({
      ...prev,
      isRecording: false,
      audioBlob: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    initializeAudioContext,
    requestMicrophonePermission,
    startRecording,
    stopRecording,
    cleanup,
  };
}
