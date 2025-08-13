/**
 * Creates a downloadable file from data
 * @param content - The file content as string
 * @param filename - The name of the file to download
 * @param mimeType - The MIME type of the file
 */
export function createDownloadableFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sanitizes filename by removing special characters and diacritics
 * @param name - The original filename
 * @returns Sanitized filename safe for download
 */
export function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD") // Decompose characters with diacritics
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s]/gi, "_") // Replace special characters with underscore
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .toLowerCase();
}
