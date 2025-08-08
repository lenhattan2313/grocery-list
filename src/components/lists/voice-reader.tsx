"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ShoppingItem } from "@/types";

interface VoiceReaderProps {
  items: ShoppingItem[];
  listName: string;
  className?: string;
}

interface VoiceReaderState {
  isSupported: boolean;
  isReading: boolean;
  isPaused: boolean;
  currentIndex: number;
  rate: number;
  voice: SpeechSynthesisVoice | null;
}

export function VoiceReader({ items, listName, className }: VoiceReaderProps) {
  const [state, setState] = useState<VoiceReaderState>({
    isSupported: false,
    isReading: false,
    isPaused: false,
    currentIndex: 0,
    rate: 1,
    voice: null,
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Check if speech synthesis is supported
  useEffect(() => {
    const isSupported = "speechSynthesis" in window;
    setState((prev) => ({ ...prev, isSupported }));

    if (isSupported) {
      // Load available voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        voicesRef.current = voices;

        // Select a good default voice (prefer English, female)
        const preferredVoice =
          voices.find(
            (voice) =>
              voice.lang.startsWith("en") &&
              voice.name.toLowerCase().includes("female")
          ) ||
          voices.find((voice) => voice.lang.startsWith("en")) ||
          voices[0];

        setState((prev) => ({ ...prev, voice: preferredVoice || null }));
      };

      // Load voices when they become available
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      loadVoices();
    }
  }, []);

  // Handle speech events
  useEffect(() => {
    if (!utteranceRef.current) return;

    const utterance = utteranceRef.current;

    utterance.onstart = () => {
      setState((prev) => ({ ...prev, isReading: true, isPaused: false }));
    };

    utterance.onend = () => {
      setState((prev) => ({ ...prev, isReading: false, isPaused: false }));
      utteranceRef.current = null;
    };

    utterance.onpause = () => {
      setState((prev) => ({ ...prev, isPaused: true }));
    };

    utterance.onresume = () => {
      setState((prev) => ({ ...prev, isPaused: false }));
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setState((prev) => ({ ...prev, isReading: false, isPaused: false }));
      utteranceRef.current = null;

      toast.error("Voice reading error", {
        description: "Failed to read the shopping list",
      });
    };
  }, []);

  const generateShoppingListText = useCallback(() => {
    if (items.length === 0) {
      return "Your shopping list is empty.";
    }

    const completedItems = items.filter((item) => item.isCompleted);
    const pendingItems = items.filter((item) => !item.isCompleted);

    let text = `Shopping list: ${listName}. `;

    if (pendingItems.length > 0) {
      text += `You have ${pendingItems.length} items to buy: `;
      text += pendingItems
        .map((item) => {
          const quantity =
            item.quantity > 1
              ? `${item.quantity} ${item.unit}`
              : item.unit === "pcs"
              ? "1 piece"
              : `1 ${item.unit}`;
          return `${quantity} of ${item.name}`;
        })
        .join(", ");
    }

    if (completedItems.length > 0) {
      text += `. You have already bought ${completedItems.length} items: `;
      text += completedItems
        .map((item) => {
          const quantity =
            item.quantity > 1
              ? `${item.quantity} ${item.unit}`
              : item.unit === "pcs"
              ? "1 piece"
              : `1 ${item.unit}`;
          return `${quantity} of ${item.name}`;
        })
        .join(", ");
    }

    return text;
  }, [items, listName]);

  const startReading = useCallback(() => {
    if (!state.isSupported || !state.voice) {
      toast.error("Voice reading not supported", {
        description: "Your browser doesn't support speech synthesis",
      });
      return;
    }

    // Stop any current reading
    window.speechSynthesis.cancel();

    const text = generateShoppingListText();
    const utterance = new SpeechSynthesisUtterance(text);

    // Configure utterance
    utterance.voice = state.voice;
    utterance.rate = state.rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [state.isSupported, state.voice, state.rate, generateShoppingListText]);

  const pauseReading = useCallback(() => {
    if (state.isReading) {
      window.speechSynthesis.pause();
    }
  }, [state.isReading]);

  const resumeReading = useCallback(() => {
    if (state.isPaused) {
      window.speechSynthesis.resume();
    }
  }, [state.isPaused]);

  const stopReading = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setState((prev) => ({
      ...prev,
      isReading: false,
      isPaused: false,
      currentIndex: 0,
    }));
  }, []);

  const changeRate = useCallback(
    (newRate: number) => {
      setState((prev) => ({ ...prev, rate: newRate }));

      // If currently reading, restart with new rate
      if (state.isReading) {
        stopReading();
        setTimeout(startReading, 100);
      }
    },
    [state.isReading, startReading, stopReading]
  );

  if (!state.isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled={true}
        className={cn("text-muted-foreground", className)}
        title="Voice reading not supported"
      >
        <VolumeX className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Main control button */}
      <Button
        variant="outline"
        size="icon"
        onClick={state.isReading ? stopReading : startReading}
        disabled={items.length === 0}
        className={cn(
          "transition-all duration-200",
          state.isReading && "bg-primary text-primary-foreground",
          className
        )}
        title={state.isReading ? "Stop reading" : "Read shopping list"}
      >
        {state.isReading ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      {/* Pause/Resume button (only show when reading) */}
      {state.isReading && (
        <Button
          variant="ghost"
          size="icon"
          onClick={state.isPaused ? resumeReading : pauseReading}
          className="h-8 w-8"
          title={state.isPaused ? "Resume reading" : "Pause reading"}
        >
          {state.isPaused ? (
            <Play className="h-3 w-3" />
          ) : (
            <Pause className="h-3 w-3" />
          )}
        </Button>
      )}

      {/* Speed control */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => changeRate(0.8)}
          className={cn(
            "h-6 px-2 text-xs",
            state.rate === 0.8 && "bg-primary text-primary-foreground"
          )}
        >
          0.8x
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => changeRate(1)}
          className={cn(
            "h-6 px-2 text-xs",
            state.rate === 1 && "bg-primary text-primary-foreground"
          )}
        >
          1x
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => changeRate(1.2)}
          className={cn(
            "h-6 px-2 text-xs",
            state.rate === 1.2 && "bg-primary text-primary-foreground"
          )}
        >
          1.2x
        </Button>
      </div>

      {/* Status indicator */}
      {state.isReading && (
        <Badge variant="secondary" className="text-xs">
          {state.isPaused ? "Paused" : "Reading"}
        </Badge>
      )}
    </div>
  );
}
