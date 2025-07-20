import { NextRequest, NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";

export async function POST(req: NextRequest) {
  const { image } = await req.json();

  if (!image) {
    return NextResponse.json(
      { error: "Image data is missing." },
      { status: 400 }
    );
  }

  const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!credentialsJson) {
    console.error(
      "Google Cloud credentials JSON is not set in environment variables."
    );
    return NextResponse.json(
      { error: "OCR service is not configured." },
      { status: 500 }
    );
  }

  try {
    const keyFilename = path.join(
      process.cwd(),
      "grocery-list-465911-122c173913fc.json"
    );
    const client = new ImageAnnotatorClient({
      keyFilename,
    });

    const [result] = await client.textDetection({
      image: {
        content: image.split(",")[1], // Remove base64 prefix
      },
      imageContext: {
        languageHints: ["vi"], // Specify Vietnamese
      },
    });

    const text = result.fullTextAnnotation?.text || "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error during OCR processing:", error);
    let errorMessage = "An unknown error occurred";
    if (
      typeof error === "object" &&
      error !== null &&
      "details" in error &&
      typeof (error as Record<string, unknown>).details === "string"
    ) {
      errorMessage = (error as { details: string }).details;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: "Failed to process image.", details: errorMessage },
      { status: 500 }
    );
  }
}
