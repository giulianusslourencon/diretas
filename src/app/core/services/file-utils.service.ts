import { Injectable } from '@angular/core';

/**
 * Service for file-related utility functions
 */
@Injectable({
  providedIn: 'root',
})
export class FileUtilsService {
  /**
   * Sanitizes a filename by removing invalid characters and limiting length
   * @param fileName The original filename
   * @param maxLength Maximum length for the filename (default: 100)
   * @returns Sanitized filename
   */
  sanitizeFileName(fileName: string, maxLength: number = 100): string {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters for file systems
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, maxLength); // Limit the length
  }

  /**
   * Generates a filename for PDF export
   * @param title The crossword title
   * @returns Sanitized PDF filename
   */
  generatePdfFileName(title: string): string {
    const sanitized = title
      .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with underscore
      .toLowerCase();
    return `${sanitized}_crossword.pdf`;
  }

  /**
   * Generates a filename for JSON export
   * @param title The crossword title
   * @returns Sanitized JSON filename
   */
  generateJsonFileName(title: string): string {
    return `${this.sanitizeFileName(title)}.json`;
  }

  /**
   * Creates a download link and triggers download
   * @param blob The blob to download
   * @param filename The filename for the download
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Clean up resources
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validates if a file has the expected extension
   * @param file The file to validate
   * @param expectedExtension The expected extension (e.g., '.json')
   * @returns True if file has the expected extension
   */
  validateFileExtension(file: File, expectedExtension: string): boolean {
    return file.name.toLowerCase().endsWith(expectedExtension.toLowerCase());
  }
}
