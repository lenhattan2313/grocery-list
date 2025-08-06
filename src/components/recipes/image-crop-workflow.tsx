"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import Image from "next/image";
import { UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { dialogService } from "@/stores/dialog-store";

import "react-image-crop/dist/ReactCrop.css";

interface ImageCropWorkflowProps {
  dialogId: string;
  onTextExtracted: (text: string) => void;
  setIsOcrLoading: Dispatch<SetStateAction<boolean>>;
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<string> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("No 2d context");
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  // Return base64 data URL
  return canvas.toDataURL("image/jpeg");
}

export function ImageCropWorkflow({
  dialogId,
  onTextExtracted,
  setIsOcrLoading,
}: ImageCropWorkflowProps) {
  const [imageSrc, setImageSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageToText = async () => {
    if (completedCrop && imgRef.current) {
      setIsOcrLoading(true);
      dialogService.hideDialog(dialogId);
      try {
        const croppedImageBase64 = await getCroppedImg(
          imgRef.current,
          completedCrop
        );
        const response = await fetch("/api/ocr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: croppedImageBase64 }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || "Failed to extract text.");
        }

        const { text } = await response.json();
        onTextExtracted(text);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.";
        toast.error("OCR Failed", {
          description: errorMessage,
        });
      } finally {
        setIsOcrLoading(false);
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const resultSrc = reader.result?.toString() || "";
        const img = new window.Image();
        img.src = resultSrc;
        img.onload = () => {
          setImageDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
          setImageSrc(resultSrc);
        };
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCancel = () => {
    dialogService.hideDialog(dialogId);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        accept="image/*"
      />

      {imageSrc && imageDimensions ? (
        <div className="flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <Image
              ref={imgRef}
              src={imageSrc}
              alt="Crop me"
              width={imageDimensions.width}
              height={imageDimensions.height}
              style={{ maxHeight: "60vh", width: "auto", height: "auto" }}
            />
          </ReactCrop>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          <UploadCloudIcon className="mb-2 h-10 w-10 text-gray-400" />
          <span className="font-semibold text-gray-600 dark:text-gray-300">
            Click to upload an image
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG, or WEBP
          </p>
        </button>
      )}

      <DialogFooter className="flex gap-2 flex-row justify-end text-gray-800 dark:text-gray-100">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleImageToText}
          disabled={!completedCrop || !imageSrc}
        >
          Crop & Extract Text
        </Button>
      </DialogFooter>
    </div>
  );
}
