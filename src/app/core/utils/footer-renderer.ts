import jsPDF from 'jspdf';
import { PdfConfig } from '../config/pdf-config';

export class FooterRenderer {
  static addSingleFooter(pdf: jsPDF): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const config = PdfConfig.FONTS;
    const colors = PdfConfig.COLORS;
    const footerText = PdfConfig.FOOTER_TEXT;

    // Set footer text properties
    pdf.setFontSize(config.footerSize);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(colors.footerText);

    // Calculate text positioning
    const textWidth = pdf.getTextWidth(footerText.left + footerText.right);
    const heartWidth = PdfConfig.LAYOUT.heartWidth;
    const startX = (pageWidth - textWidth - heartWidth) / 2;

    // Draw left text
    pdf.text(footerText.left, startX, pageHeight - 10);

    // Draw heart
    const heartX = startX + pdf.getTextWidth(footerText.left) + 1;
    this.drawHeart(pdf, heartX, pageHeight - 12, 1.2, colors.heart);

    // Draw right text
    pdf.text(footerText.right, heartX + 3.8, pageHeight - 10);
  }

  static addDoubleFooter(
    pdf: jsPDF,
    leftGridX: number,
    rightGridX: number,
    gridWidth: number
  ): void {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const config = PdfConfig.FONTS;
    const colors = PdfConfig.COLORS;
    const footerText = PdfConfig.FOOTER_TEXT;

    // Set footer text properties
    pdf.setFontSize(config.footerSizeDouble);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(colors.footerText);

    const textWidth = pdf.getTextWidth(footerText.left + footerText.right);
    const heartWidth = 3.5; // Smaller heart for double layout

    // Left grid footer
    this.renderGridFooter(
      pdf,
      leftGridX,
      gridWidth,
      pageHeight,
      textWidth,
      heartWidth,
      footerText,
      colors.heart
    );

    // Right grid footer
    this.renderGridFooter(
      pdf,
      rightGridX,
      gridWidth,
      pageHeight,
      textWidth,
      heartWidth,
      footerText,
      colors.heart
    );
  }

  private static renderGridFooter(
    pdf: jsPDF,
    gridX: number,
    gridWidth: number,
    pageHeight: number,
    textWidth: number,
    heartWidth: number,
    footerText: { left: string; right: string },
    heartColor: string
  ): void {
    const startX = gridX + (gridWidth - textWidth - heartWidth) / 2;
    
    // Draw left text
    pdf.text(footerText.left, startX, pageHeight - 10);

    // Draw heart
    const heartX = startX + pdf.getTextWidth(footerText.left) + 1;
    this.drawHeart(pdf, heartX, pageHeight - 12, 1, heartColor);

    // Draw right text
    pdf.text(footerText.right, heartX + 3, pageHeight - 10);
  }

  private static drawHeart(
    pdf: jsPDF,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    pdf.setFillColor(color);
    
    // Draw two circles for the top of the heart
    pdf.circle(x, y, size, 'F');
    pdf.circle(x + size * 1.5, y, size, 'F');
    
    // Draw triangle for the bottom of the heart
    const triangleScale = size === 1.2 ? 1 : 0.8; // Adjust triangle size based on heart size
    pdf.triangle(
      x - size * 0.67,
      y + size * 0.67,
      x + size * 2.17,
      y + size * 0.67,
      x + size * 0.75,
      y + size * (2.9 * triangleScale),
      'F'
    );
  }
}
