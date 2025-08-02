import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import {
  CrosswordGrid,
  CrosswordExportOptions,
} from '../models/crossword.model';
import { PdfConfig } from '../config/pdf-config';
import { CanvasUtils } from '../utils/canvas-utils';
import { FooterRenderer } from '../utils/footer-renderer';
import { CellElementFactory } from '../utils/cell-element-factory';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  async exportCrosswordToPdf(
    crossword: CrosswordGrid,
    options: CrosswordExportOptions = {
      includeAnswers: false,
      layout: 'single',
      orientation: 'portrait',
    }
  ): Promise<void> {
    try {
      const isDoubleLayout = options.layout === 'double';
      const orientation = options.orientation || 'portrait';

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4',
      });

      if (isDoubleLayout) {
        await this.createDoubleLayoutPdf(pdf, crossword, options);
      } else {
        await this.createSingleLayoutPdf(pdf, crossword, options);
      }

      const fileName = this.generateFileName(crossword.title);
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting crossword to PDF:', error);
      throw new Error('Failed to export crossword to PDF');
    }
  }

  private generateFileName(title: string): string {
    return `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_crossword.pdf`;
  }

  private async createSingleLayoutPdf(
    pdf: jsPDF,
    crossword: CrosswordGrid,
    options: CrosswordExportOptions
  ): Promise<void> {
    const tempContainer = this.createTempContainer(crossword, options);
    document.body.appendChild(tempContainer);

    try {
      const canvas = await CanvasUtils.createCanvasFromElement(tempContainer);
      const dimensions = PdfConfig.calculateDimensions(pdf, false);
      const imageDimensions = CanvasUtils.calculateImageDimensions(
        canvas,
        dimensions.availableWidth,
        dimensions.availableHeight
      );
      const position = CanvasUtils.calculateCenterPosition(
        dimensions.pageWidth,
        dimensions.pageHeight,
        imageDimensions.width,
        imageDimensions.height,
        dimensions.margin,
        dimensions.titleHeight,
        dimensions.availableHeight
      );

      this.addTitle(pdf, crossword.title, dimensions);
      this.addCrosswordImage(pdf, canvas, position, imageDimensions);
      FooterRenderer.addSingleFooter(pdf);
    } finally {
      document.body.removeChild(tempContainer);
    }
  }

  private addTitle(pdf: jsPDF, title: string, dimensions: any): void {
    pdf.setFontSize(PdfConfig.FONTS.titleSize);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, dimensions.pageWidth / 2, dimensions.margin + 12, {
      align: 'center',
    });
  }

  private addCrosswordImage(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    position: { x: number; y: number },
    dimensions: { width: number; height: number }
  ): void {
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(
      imgData,
      'PNG',
      position.x,
      position.y,
      dimensions.width,
      dimensions.height
    );
  }

  private async createDoubleLayoutPdf(
    pdf: jsPDF,
    crossword: CrosswordGrid,
    options: CrosswordExportOptions
  ): Promise<void> {
    const leftGrid = this.createTempContainer(crossword, options);
    const rightGrid = this.createTempContainer(crossword, options);

    document.body.appendChild(leftGrid);
    document.body.appendChild(rightGrid);

    try {
      const [leftCanvas, rightCanvas] = await Promise.all([
        CanvasUtils.createCanvasFromElement(leftGrid),
        CanvasUtils.createCanvasFromElement(rightGrid),
      ]);

      const dimensions = PdfConfig.calculateDimensions(pdf, true);
      const gridWidth =
        (dimensions.availableWidth - PdfConfig.LAYOUT.gridGap) / 2;

      const imageDimensions = CanvasUtils.calculateImageDimensions(
        leftCanvas,
        gridWidth,
        dimensions.availableHeight
      );

      const positions = CanvasUtils.calculateDoubleLayoutPositions(
        dimensions.margin,
        gridWidth,
        PdfConfig.LAYOUT.gridGap,
        dimensions.titleHeight,
        dimensions.availableHeight,
        imageDimensions.height
      );

      this.addDoubleTitles(
        pdf,
        crossword.title,
        positions,
        imageDimensions.width,
        dimensions
      );
      this.addDoubleImages(
        pdf,
        leftCanvas,
        rightCanvas,
        positions,
        imageDimensions
      );
      FooterRenderer.addDoubleFooter(
        pdf,
        positions.leftX,
        positions.rightX,
        gridWidth
      );
    } finally {
      document.body.removeChild(leftGrid);
      document.body.removeChild(rightGrid);
    }
  }

  private addDoubleTitles(
    pdf: jsPDF,
    title: string,
    positions: { leftX: number; rightX: number },
    imageWidth: number,
    dimensions: any
  ): void {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, positions.leftX + imageWidth / 2, dimensions.margin + 10, {
      align: 'center',
    });
    pdf.text(title, positions.rightX + imageWidth / 2, dimensions.margin + 10, {
      align: 'center',
    });
  }

  private addDoubleImages(
    pdf: jsPDF,
    leftCanvas: HTMLCanvasElement,
    rightCanvas: HTMLCanvasElement,
    positions: { leftX: number; rightX: number; y: number },
    dimensions: { width: number; height: number }
  ): void {
    const leftImgData = leftCanvas.toDataURL('image/png');
    const rightImgData = rightCanvas.toDataURL('image/png');

    pdf.addImage(
      leftImgData,
      'PNG',
      positions.leftX,
      positions.y,
      dimensions.width,
      dimensions.height
    );
    pdf.addImage(
      rightImgData,
      'PNG',
      positions.rightX,
      positions.y,
      dimensions.width,
      dimensions.height
    );
  }

  private createTempContainer(
    crossword: CrosswordGrid,
    options: CrosswordExportOptions
  ): HTMLElement {
    const container = document.createElement('div');
    const colors = PdfConfig.COLORS;
    const fonts = PdfConfig.FONTS;
    const cellConfig = PdfConfig.CELL;

    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.backgroundColor = colors.background;
    container.style.padding = '20px';
    container.style.fontFamily = fonts.family;

    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'inline-block';
    gridContainer.style.border = `2px solid ${colors.border}`;
    gridContainer.style.backgroundColor = colors.background;

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${crossword.cols}, ${cellConfig.width}px)`;
    grid.style.gridTemplateRows = `repeat(${crossword.rows}, ${cellConfig.height}px)`;
    grid.style.gap = '0';

    // Add cells to grid using the factory
    for (let row = 0; row < crossword.rows; row++) {
      for (let col = 0; col < crossword.cols; col++) {
        const cell = crossword.cells[row][col];
        const cellElement = CellElementFactory.createCellElement(cell, options);
        grid.appendChild(cellElement);
      }
    }

    gridContainer.appendChild(grid);
    container.appendChild(gridContainer);

    return container;
  }
}
