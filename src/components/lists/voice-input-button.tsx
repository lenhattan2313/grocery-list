"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Mic, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { VoiceParser } from "@/lib/voice-parser";
import { toast } from "sonner";

interface VoiceInputButtonProps {
  onItemsParsed: (
    items: Array<{ name: string; quantity: number; unit: string }>
  ) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({
  onItemsParsed,
  disabled = false,
  className,
}: VoiceInputButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedItems, setParsedItems] = useState<
    Array<{
      name: string;
      quantity: number;
      unit: string;
      confidence: number;
    }>
  >([]);

  const {
    isListening,
    isSupported,
    transcript,
    isRecording,
    shouldUseAudioRecording,
    startListening,
    stopListening,
    reset,
    clearTranscript,
  } = useVoiceRecognition({
    continuous: true,
    interimResults: true,
    lang: "en-US",
  });

  const voiceParser = useMemo(() => new VoiceParser(), []);

  // Auto-parse when transcript changes
  useEffect(() => {
    if (transcript && transcript.length > 10) {
      const items = voiceParser.parseVoiceInput(transcript);
      setParsedItems(items);
    }
  }, [transcript, voiceParser]);

  // Auto-stop listening after 10 seconds of silence
  useEffect(() => {
    if (isListening) {
      const timeout = setTimeout(() => {
        if (transcript.length > 0) {
          stopListening();
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isListening, transcript, stopListening]);

  const handleStartListening = useCallback(async () => {
    if (!isSupported) {
      toast.error("Voice recognition not supported", {
        description:
          "Your browser doesn't support speech recognition. Please use Chrome or Safari.",
      });
      return;
    }

    // Reset any previous errors and open dialog
    reset();
    setIsOpen(true);

    // Start recording immediately after a short delay to ensure UI is ready
    setTimeout(() => {
      startListening();
    }, 100);
  }, [isSupported, reset, startListening]);

  const handleStopListening = useCallback(() => {
    stopListening();
    setIsOpen(false);

    if (parsedItems.length > 0) {
      const items = parsedItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      }));

      onItemsParsed(items);
      toast.success(
        `Added ${items.length} item${items.length > 1 ? "s" : ""}`,
        {
          description: items
            .map((item) => `${item.quantity} ${item.unit} ${item.name}`)
            .join(", "),
        }
      );
    } else if (transcript.length > 0) {
      toast.error("Could not parse items", {
        description: "Please try speaking more clearly or use the text input",
      });
    }

    reset();
    setParsedItems([]);
  }, [stopListening, parsedItems, transcript, onItemsParsed, reset]);

  const handleCancel = useCallback(() => {
    stopListening();
    setIsOpen(false);
    reset();
    setParsedItems([]);
    clearTranscript();
  }, [stopListening, reset, clearTranscript]);

  const handleAddSingleItem = useCallback(
    (item: { name: string; quantity: number; unit: string }) => {
      onItemsParsed([item]);
      setParsedItems((prev) => prev.filter((i) => i.name !== item.name));
    },
    [onItemsParsed]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Stop listening when popover closes (including clicking outside)
        stopListening();
        reset();
        setParsedItems([]);
        clearTranscript();
      }
      setIsOpen(open);
    },
    [stopListening, reset, clearTranscript]
  );

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled={true}
        className={cn("text-muted-foreground border-red-500", className)}
        title="Voice input not supported - Please use Chrome or Safari"
        aria-label="Voice input not supported - Please use Chrome or Safari"
      >
        <Mic className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={handleStartListening}
          disabled={disabled || isListening || isRecording}
          className={cn(
            "transition-all duration-200 animate-pulse-once",
            (isListening || isRecording) &&
              "bg-primary text-primary-foreground",
            className
          )}
          title={
            isRecording
              ? "Recording audio... Click to stop"
              : isListening
              ? "Listening... Click to stop"
              : shouldUseAudioRecording
              ? "Start recording audio"
              : "Start voice recognition"
          }
          aria-label={
            isRecording
              ? "Recording audio... Click to stop"
              : isListening
              ? "Listening... Click to stop"
              : shouldUseAudioRecording
              ? "Start recording audio"
              : "Start voice recognition"
          }
        >
          <Mic
            className={cn(
              "h-4 w-4",
              (isListening || isRecording) && "animate-pulse"
            )}
          />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md sm:max-w-lg lg:max-w-xl p-4"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isListening || isRecording ? "bg-red-500" : "bg-gray-400"
              )}
            />
            <span className="text-sm font-medium">
              {shouldUseAudioRecording && isRecording
                ? "Recording audio..."
                : shouldUseAudioRecording && !isRecording && transcript
                ? "Audio recorded"
                : isListening
                ? "Listening..."
                : shouldUseAudioRecording
                ? "Ready to record"
                : "Processing..."}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-6 w-6"
            title="Cancel"
            aria-label="Cancel voice input"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* iOS PWA Info */}
        {shouldUseAudioRecording && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
            <p className="text-blue-700 dark:text-blue-300 mb-2">
              📱 iOS PWA Mode:
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              {isRecording
                ? "Recording your voice... Speak clearly into the microphone."
                : "Audio recording mode. Recording will start automatically."}
            </p>
          </div>
        )}

        {/* Error Display */}
        {!isListening &&
          !isRecording &&
          transcript.length === 0 &&
          !shouldUseAudioRecording && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs">
              <p className="text-red-700 dark:text-red-300 mb-2">
                💡 Tips to fix voice recognition:
              </p>
              <ul className="text-red-600 dark:text-red-400 space-y-1">
                <li>• Allow microphone access when prompted</li>
                <li>• Speak clearly and at normal volume</li>
                <li>• Try refreshing the page if issues persist</li>
                <li>• Use Chrome or Safari for best compatibility</li>
              </ul>
            </div>
          )}

        {/* Transcript */}
        <div className="mb-3 p-2 bg-muted rounded text-sm">
          <p className="text-muted-foreground text-xs mb-1">
            {shouldUseAudioRecording ? "Status: " : "Transcript: "}
            {shouldUseAudioRecording
              ? isRecording
                ? "Recording audio..."
                : transcript
                ? "Audio recorded"
                : "Ready to record"
              : transcript
              ? `(${transcript.length} chars)`
              : "(empty)"}
          </p>
          {shouldUseAudioRecording ? (
            <p className="font-medium break-words">
              {isRecording
                ? "Recording your voice... Please speak clearly."
                : transcript || "Starting audio recording..."}
            </p>
          ) : transcript ? (
            <p className="font-medium break-words">{transcript}</p>
          ) : (
            <p className="text-muted-foreground italic">
              Starting voice recognition...
            </p>
          )}
        </div>

        {/* Parsed Items */}
        {parsedItems.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">Parsed items:</p>
            <div className="space-y-1">
              {parsedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.confidence > 0.7 ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        item.confidence > 0.7
                          ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50"
                          : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50"
                      )}
                    >
                      {Math.round(item.confidence * 100)}%
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleAddSingleItem(item)}
                      className="h-6 px-2 text-xs"
                      aria-label={`Add ${item.name} to list`}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isListening || isRecording ? (
            <Button
              onClick={handleStopListening}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              aria-label="Stop recording"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          ) : (
            <Button
              onClick={handleStopListening}
              className="flex-1"
              disabled={parsedItems.length === 0}
              aria-label={`Add all ${parsedItems.length} items to list`}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Add All ({parsedItems.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleCancel}
            aria-label="Cancel voice input"
          >
            Cancel
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">💡 Voice Tips:</p>
          <ul className="space-y-1">
            <li>• &ldquo;Two apples and three bananas&rdquo;</li>
            <li>• &ldquo;One liter of milk, two loaves of bread&rdquo;</li>
            <li>• &ldquo;500 grams of chicken, one pack of pasta&rdquo;</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
