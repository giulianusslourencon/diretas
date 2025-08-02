import html2canvas from 'html2canvas';
import { PdfConfig } from '../config/pdf-config';

export class CanvasUtils {
  static async createCanvasFromElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    const config = PdfConfig.CANVAS;
    
    return html2canvas(element, {
      scale: config.scale,
      backgroundColor: config.backgroundColor,
      useCORS: config.useCORS,
      allowTaint: config.allowTaint,
      logging: config.logging,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });
  }

  static calculateImageDimensions(
    canvas: HTMLCanvasElement,
    availableWidth: number,
    availableHeight: number
  ): { width: number; height: number; ratio: number } {
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);

    return {
      width: imgWidth * ratio,
      height: imgHeight * ratio,
      ratio,
    };
  }

  static calculateCenterPosition(
    pageWidth: number,
    pageHeight: number,
    imageWidth: number,
    imageHeight: number,
    margin: number,
    titleHeight: number,
    availableHeight: number
  ): { x: number; y: number } {
    const x = (pageWidth - imageWidth) / 2;
    const y = margin + titleHeight + (availableHeight - imageHeight) / 2;

    return { x, y };
  }

  static calculateDoubleLayoutPositions(
    margin: number,
    gridWidth: number,
    gridGap: number,
    titleHeight: number,
    availableHeight: number,
    imageHeight: number
  ): { leftX: number; rightX: number; y: number } {
    const leftX = margin;
    const rightX = margin + gridWidth + gridGap;
    const y = margin + titleHeight + (availableHeight - imageHeight) / 2;

    return { leftX, rightX, y };
  }
}
