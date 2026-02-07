// Utilities for managing image attachments in Quill editor

export interface AttachmentReference {
  type: 'image';
  imageId: string;
}

/**
 * Generate an attachment reference format for embedding in chapter content
 * Format: data-attachment-id="imageId"
 */
export function createAttachmentReference(imageId: string): string {
  return imageId;
}

/**
 * Parse attachment reference from an image element
 */
export function parseAttachmentReference(element: HTMLImageElement): AttachmentReference | null {
  const imageId = element.getAttribute('data-attachment-id');
  if (imageId) {
    return {
      type: 'image',
      imageId,
    };
  }
  return null;
}

/**
 * Find all image elements with attachment references in the editor
 */
export function findAttachmentImages(editorRoot: HTMLElement): HTMLImageElement[] {
  return Array.from(editorRoot.querySelectorAll('img[data-attachment-id]'));
}

/**
 * Mark an image element as unresolved (placeholder state)
 */
export function markImageAsUnresolved(img: HTMLImageElement): void {
  img.classList.add('attachment-unresolved');
  img.alt = 'Image unavailable';
}

/**
 * Mark an image element as resolved
 */
export function markImageAsResolved(img: HTMLImageElement): void {
  img.classList.remove('attachment-unresolved');
}

/**
 * Create a placeholder image element for unresolved attachments
 */
export function createPlaceholderImage(imageId: string): string {
  return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect fill='%23f0f0f0' width='200' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3EImage unavailable%3C/text%3E%3C/svg%3E" data-attachment-id="${imageId}" class="attachment-unresolved" alt="Image unavailable" />`;
}
