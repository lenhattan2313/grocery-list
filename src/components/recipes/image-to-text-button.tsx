"use client";

import { useState } from "react";
import { CameraIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { dialogService } from "@/stores/dialog-store";
import { ImageCropWorkflow } from "./image-crop-workflow";

interface ImageToTextButtonProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export function ImageToTextButton({
  onTextExtracted,
  disabled,
}: ImageToTextButtonProps) {
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  const handleOpenDialog = () => {
    const dialogId = `image-crop-${uuidv4()}`;
    dialogService.showDialog({
      id: dialogId,
      title: "Import from Image",
      maxWidth: "2xl",
      content: (
        <ImageCropWorkflow
          dialogId={dialogId}
          onTextExtracted={onTextExtracted}
          setIsOcrLoading={setIsOcrLoading}
        />
      ),
      showCloseButton: false, // Prevent closing from the 'x'
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-1 top-1 z-10 h-8 w-8"
      onClick={handleOpenDialog}
      disabled={isOcrLoading || disabled}
      aria-label="Import instructions from image"
    >
      {isOcrLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <CameraIcon className="h-4 w-4" />
      )}
    </Button>
  );
}
