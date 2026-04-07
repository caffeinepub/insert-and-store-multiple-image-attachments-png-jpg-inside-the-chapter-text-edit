/**
 * Normalize various binary-like payloads to Uint8Array
 */
function normalizeToUint8Array(data: unknown): Uint8Array {
  // Already a Uint8Array
  if (data instanceof Uint8Array) {
    return data;
  }
  
  // Array of numbers (from Motoko [Nat8])
  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }
  
  // ArrayBuffer
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  
  // Throw error for unsupported types
  throw new Error('Unsupported binary data format');
}

/**
 * Utility function to download binary data as a file
 * Accepts various binary-like formats and normalizes them to Uint8Array
 * Creates a Blob, generates an object URL, triggers download, and cleans up
 * @throws Error if data is empty or invalid
 */
export function downloadFile(
  data: Uint8Array | number[] | ArrayBuffer | unknown,
  filename: string,
  mimeType: string
): void {
  // Normalize data to Uint8Array
  const uint8Data = normalizeToUint8Array(data);
  
  // Validate non-empty
  if (uint8Data.length === 0) {
    throw new Error('Cannot download empty file');
  }
  
  // Create blob and download - cast to BlobPart to satisfy TypeScript
  const blob = new Blob([uint8Data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Sanitize a filename by removing or replacing invalid characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || filename.trim().length === 0) {
    return 'download';
  }
  
  return filename
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/\.+/g, '.')
    .substring(0, 200);
}
