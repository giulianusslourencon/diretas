import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  CrosswordGrid,
  CrosswordExportOptions,
  CrosswordCell,
  ClueCell,
  SplitCell,
  AnswerCell,
  ClueDirection,
} from '../models/crossword.model';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  // Type guards for cell types
  private isAnswerCell(cell: CrosswordCell): cell is AnswerCell {
    return cell.type === 'answer';
  }

  private isClueCell(cell: CrosswordCell): cell is ClueCell {
    return cell.type === 'clue';
  }

  private isSplitCell(cell: CrosswordCell): cell is SplitCell {
    return cell.type === 'split';
  }
  async exportCrosswordToPdf(
    crossword: CrosswordGrid,
    options: CrosswordExportOptions = {
      includeAnswers: false,
      layout: 'single',
      orientation: 'portrait',
    }
  ): Promise<void> {
    try {
      // Determine if we need double layout
      const isDoubleLayout = options.layout === 'double';
      const orientation = options.orientation || 'portrait';

      // Create PDF with appropriate orientation
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

      // Save the PDF
      const fileName = `${crossword.title
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}_crossword.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting crossword to PDF:', error);
      throw new Error('Failed to export crossword to PDF');
    }
  }

  private async createSingleLayoutPdf(
    pdf: jsPDF,
    crossword: CrosswordGrid,
    options: CrosswordExportOptions
  ): Promise<void> {
    // Create a temporary container for the crossword grid
    const tempContainer = this.createTempContainer(crossword, options);
    document.body.appendChild(tempContainer);

    // Generate canvas from the temporary container
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: tempContainer.offsetWidth,
      height: tempContainer.offsetHeight,
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Calculate dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const titleHeight = 20;
    const footerHeight = 15;
    const availableWidth = pageWidth - 2 * margin;
    const availableHeight =
      pageHeight - 2 * margin - titleHeight - footerHeight;

    // Calculate image dimensions maintaining aspect ratio
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(
      availableWidth / imgWidth,
      availableHeight / imgHeight
    );

    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // Position the image
    const x = (pageWidth - finalWidth) / 2;
    const y = margin + titleHeight + (availableHeight - finalHeight) / 2;

    // Add title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(crossword.title, pageWidth / 2, margin + 12, { align: 'center' });

    // Add the crossword image
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

    // Add footer
    this.addFooter(pdf);
  }

  private async createDoubleLayoutPdf(
    pdf: jsPDF,
    crossword: CrosswordGrid,
    options: CrosswordExportOptions
  ): Promise<void> {
    // Create two identical grids both respecting the includeAnswers option
    const leftGrid = this.createTempContainer(crossword, options);
    const rightGrid = this.createTempContainer(crossword, options);

    document.body.appendChild(leftGrid);
    document.body.appendChild(rightGrid);

    // Generate canvases for both grids
    const leftCanvas = await html2canvas(leftGrid, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: leftGrid.offsetWidth,
      height: leftGrid.offsetHeight,
    });

    const rightCanvas = await html2canvas(rightGrid, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: rightGrid.offsetWidth,
      height: rightGrid.offsetHeight,
    });

    // Remove temporary containers
    document.body.removeChild(leftGrid);
    document.body.removeChild(rightGrid);

    // Calculate dimensions for landscape A4 with two grids side by side
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const titleHeight = 15;
    const footerHeight = 12;
    const availableWidth = pageWidth - 2 * margin;
    const availableHeight =
      pageHeight - 2 * margin - titleHeight - footerHeight;

    // Each grid gets half the available width minus a small gap
    const gridGap = 8;
    const gridWidth = (availableWidth - gridGap) / 2;

    // Calculate scale to fit both grids
    const imgWidth = leftCanvas.width;
    const imgHeight = leftCanvas.height;
    const ratio = Math.min(gridWidth / imgWidth, availableHeight / imgHeight);

    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // Position grids
    const leftGridX = margin;
    const rightGridX = margin + gridWidth + gridGap;
    const gridY = margin + titleHeight + (availableHeight - finalHeight) / 2;

    // Add titles for each grid
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(crossword.title, leftGridX + finalWidth / 2, margin + 10, {
      align: 'center',
    });
    pdf.text(crossword.title, rightGridX + finalWidth / 2, margin + 10, {
      align: 'center',
    });

    // Add the crossword images
    const leftImgData = leftCanvas.toDataURL('image/png');
    const rightImgData = rightCanvas.toDataURL('image/png');

    pdf.addImage(leftImgData, 'PNG', leftGridX, gridY, finalWidth, finalHeight);
    pdf.addImage(
      rightImgData,
      'PNG',
      rightGridX,
      gridY,
      finalWidth,
      finalHeight
    );

    // Add footers for each grid
    this.addDoubleFooter(pdf, leftGridX, rightGridX, finalWidth);
  }

  private addFooter(pdf: jsPDF): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add footer with "Feito com ❤ por Giuzinho"
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(128, 128, 128); // Gray color

    // Draw "Feito com " first
    const leftText = 'Feito com ';
    const rightText = ' por Giuzinho';
    const textWidth = pdf.getTextWidth(leftText + rightText);
    const startX = (pageWidth - textWidth - 3) / 2; // 3mm for heart width

    pdf.text(leftText, startX, pageHeight - 10);

    // Draw a simple heart shape
    const heartX = startX + pdf.getTextWidth(leftText) + 1;
    const heartY = pageHeight - 12;

    pdf.setFillColor(128, 128, 128);
    pdf.circle(heartX, heartY, 1, 'F');
    pdf.circle(heartX + 1.5, heartY, 1, 'F');
    pdf.triangle(
      heartX - 0.5,
      heartY + 0.5,
      heartX + 2,
      heartY + 0.5,
      heartX + 0.75,
      heartY + 2.5,
      'F'
    );

    // Draw " por Giuzinho"
    pdf.text(rightText, heartX + 3, pageHeight - 10);
  }

  private addDoubleFooter(
    pdf: jsPDF,
    leftGridX: number,
    rightGridX: number,
    gridWidth: number
  ): void {
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add footer with "Feito com ❤ por Giuzinho" for each grid
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(128, 128, 128); // Gray color

    // Draw "Feito com " first
    const leftText = 'Feito com ';
    const rightText = ' por Giuzinho';
    const textWidth = pdf.getTextWidth(leftText + rightText);

    // Left grid footer
    const leftStartX = leftGridX + (gridWidth - textWidth - 3) / 2; // 3mm for heart width
    pdf.text(leftText, leftStartX, pageHeight - 10);

    // Draw a simple heart shape for left grid
    const leftHeartX = leftStartX + pdf.getTextWidth(leftText) + 1;
    const heartY = pageHeight - 12;

    pdf.setFillColor(128, 128, 128);
    pdf.circle(leftHeartX, heartY, 0.8, 'F');
    pdf.circle(leftHeartX + 1.2, heartY, 0.8, 'F');
    pdf.triangle(
      leftHeartX - 0.4,
      heartY + 0.4,
      leftHeartX + 1.6,
      heartY + 0.4,
      leftHeartX + 0.6,
      heartY + 2,
      'F'
    );

    // Draw " por Giuzinho" for left grid
    pdf.text(rightText, leftHeartX + 2.4, pageHeight - 10);

    // Right grid footer
    const rightStartX = rightGridX + (gridWidth - textWidth - 3) / 2; // 3mm for heart width
    pdf.text(leftText, rightStartX, pageHeight - 10);

    // Draw a simple heart shape for right grid
    const rightHeartX = rightStartX + pdf.getTextWidth(leftText) + 1;

    pdf.circle(rightHeartX, heartY, 0.8, 'F');
    pdf.circle(rightHeartX + 1.2, heartY, 0.8, 'F');
    pdf.triangle(
      rightHeartX - 0.4,
      heartY + 0.4,
      rightHeartX + 1.6,
      heartY + 0.4,
      rightHeartX + 0.6,
      heartY + 2,
      'F'
    );

    // Draw " por Giuzinho" for right grid
    pdf.text(rightText, rightHeartX + 2.4, pageHeight - 10);
  }

  private createTempContainer(
    crossword: CrosswordGrid,
    options: CrosswordExportOptions
  ): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';

    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'inline-block';
    gridContainer.style.border = '2px solid #000';
    gridContainer.style.backgroundColor = '#ffffff';

    // Create grid
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${crossword.cols}, 60px)`;
    grid.style.gridTemplateRows = `repeat(${crossword.rows}, 60px)`;
    grid.style.gap = '0';

    // Add cells to grid
    for (let row = 0; row < crossword.rows; row++) {
      for (let col = 0; col < crossword.cols; col++) {
        const cell = crossword.cells[row][col];
        const cellElement = this.createCellElement(cell, options);
        grid.appendChild(cellElement);
      }
    }

    gridContainer.appendChild(grid);
    container.appendChild(gridContainer);

    return container;
  }

  private createCellElement(
    cell: CrosswordCell,
    options: CrosswordExportOptions
  ): HTMLElement {
    const cellDiv = document.createElement('div');
    cellDiv.style.width = '60px';
    cellDiv.style.height = '60px';
    cellDiv.style.border = '1px solid #333';
    cellDiv.style.position = 'relative';
    cellDiv.style.boxSizing = 'border-box';
    // Set background color based on cell type
    cellDiv.style.backgroundColor = this.isClueCell(cell)
      ? '#d0d0d0'
      : '#ffffff';
    cellDiv.style.boxSizing = 'border-box';
    cellDiv.style.display = 'flex';
    cellDiv.style.alignItems = 'center';
    cellDiv.style.justifyContent = 'center';

    if (this.isSplitCell(cell)) {
      this.createSplitCellContent(cellDiv, cell, options);
    } else if (this.isClueCell(cell)) {
      this.createClueCellContent(cellDiv, cell, options);
    } else if (this.isAnswerCell(cell)) {
      // Regular answer cell - don't show letters unless includeAnswers is true
      if (options.includeAnswers && cell.letter) {
        const letterSpan = document.createElement('span');
        letterSpan.textContent = cell.letter.toUpperCase();
        letterSpan.style.fontSize = '20px';
        letterSpan.style.fontWeight = 'bold';
        letterSpan.style.color = '#000';
        cellDiv.appendChild(letterSpan);
      }
    }

    return cellDiv;
  }

  private createSplitCellContent(
    cellDiv: HTMLElement,
    cell: SplitCell,
    options: CrosswordExportOptions
  ): void {
    // Create diagonal line
    const diagonalLine = document.createElement('div');
    diagonalLine.style.position = 'absolute';
    diagonalLine.style.top = '0';
    diagonalLine.style.left = '0';
    diagonalLine.style.width = '100%';
    diagonalLine.style.height = '100%';
    diagonalLine.style.pointerEvents = 'none';

    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.width = '141.42%'; // sqrt(2) * 100%
    line.style.height = '2px';
    line.style.backgroundColor = '#2c3e50';
    line.style.transformOrigin = '0 0';

    if (cell.diagonalDirection === 'anti') {
      line.style.top = '0';
      line.style.right = '0';
      line.style.left = 'auto';
      line.style.transform = 'rotate(-45deg)';
      line.style.transformOrigin = '100% 0';
    } else {
      line.style.top = '0';
      line.style.left = '0';
      line.style.transform = 'rotate(45deg)';
    }

    diagonalLine.appendChild(line);
    cellDiv.appendChild(diagonalLine);

    // Add letters if includeAnswers is true
    if (options.includeAnswers) {
      if (cell.topLetter) {
        const topLetter = document.createElement('span');
        topLetter.textContent = cell.topLetter.toUpperCase();
        topLetter.style.position = 'absolute';
        topLetter.style.fontSize = '20px';
        topLetter.style.fontWeight = 'bold';
        topLetter.style.color = '#000';
        topLetter.style.zIndex = '10';

        if (cell.diagonalDirection === 'anti') {
          topLetter.style.top = '8px';
          topLetter.style.left = '8px';
        } else {
          topLetter.style.top = '8px';
          topLetter.style.right = '8px';
        }

        cellDiv.appendChild(topLetter);
      }

      if (cell.bottomLetter) {
        const bottomLetter = document.createElement('span');
        bottomLetter.textContent = cell.bottomLetter.toUpperCase();
        bottomLetter.style.position = 'absolute';
        bottomLetter.style.fontSize = '20px';
        bottomLetter.style.fontWeight = 'bold';
        bottomLetter.style.color = '#000';
        bottomLetter.style.zIndex = '10';

        if (cell.diagonalDirection === 'anti') {
          bottomLetter.style.bottom = '8px';
          bottomLetter.style.right = '8px';
        } else {
          bottomLetter.style.bottom = '8px';
          bottomLetter.style.left = '8px';
        }

        cellDiv.appendChild(bottomLetter);
      }
    }
  }

  private createClueCellContent(
    cellDiv: HTMLElement,
    cell: ClueCell,
    _options: CrosswordExportOptions
  ): void {
    // Add clue text if it exists
    if (cell.clueText) {
      const clueContent = document.createElement('div');
      clueContent.style.width = '100%';
      clueContent.style.height = '100%';
      clueContent.style.display = 'flex';
      clueContent.style.flexDirection = 'column';
      clueContent.style.justifyContent = 'center';
      clueContent.style.alignItems = 'center';
      clueContent.style.padding = '4px';
      clueContent.style.boxSizing = 'border-box';
      clueContent.style.position = 'relative';

      const clueText = document.createElement('div');
      clueText.textContent = cell.clueText;

      // Set font size based on textSize property
      let fontSize = '9px';
      let lineHeight = '1.1';
      switch (cell.textSize) {
        case 'small':
          fontSize = '7px';
          lineHeight = '1.0';
          break;
        case 'medium':
          fontSize = '9px';
          lineHeight = '1.1';
          break;
        case 'large':
          fontSize = '11px';
          lineHeight = '1.2';
          break;
        default:
          fontSize = '9px';
          lineHeight = '1.1';
      }

      clueText.style.fontSize = fontSize;
      clueText.style.lineHeight = lineHeight;
      clueText.style.textAlign = 'center';
      clueText.style.color = '#000';
      clueText.style.fontWeight = cell.boldClueText ? 'bold' : '500';
      clueText.style.overflowWrap = 'break-word';
      clueText.style.overflow = 'hidden';
      clueText.style.width = '100%';
      clueText.style.display = 'flex';
      clueText.style.alignItems = 'center';
      clueText.style.justifyContent = 'center';
      clueText.style.flex = '1';

      clueContent.appendChild(clueText);

      // Add SVG arrow indicator
      const arrowContainer = document.createElement('div');
      arrowContainer.style.position = 'absolute';
      arrowContainer.style.width = '12px';
      arrowContainer.style.height = '12px';
      arrowContainer.style.zIndex = '10';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '12');
      svg.setAttribute('height', '12');
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.style.color = '#666';

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');

      // Set path data and positioning based on direction (same as editor)
      switch (cell.clueDirection) {
        case 'right':
          path.setAttribute('d', 'M2 8 L12 8 M9 5 L12 8 L9 11');
          arrowContainer.style.top = '50%';
          arrowContainer.style.right = '-16px';
          arrowContainer.style.transform = 'translateY(-50%)';
          break;
        case 'down':
          path.setAttribute('d', 'M8 2 L8 12 M5 9 L8 12 L11 9');
          arrowContainer.style.bottom = '-12px';
          arrowContainer.style.left = '50%';
          arrowContainer.style.transform = 'translateX(-50%)';
          break;
        case 'up':
          path.setAttribute('d', 'M8 14 L8 4 M5 7 L8 4 L11 7');
          arrowContainer.style.top = '-20px';
          arrowContainer.style.left = '50%';
          arrowContainer.style.transform = 'translateX(-50%)';
          break;
        case 'left':
          path.setAttribute('d', 'M14 8 L4 8 M7 5 L4 8 L7 11');
          arrowContainer.style.top = '50%';
          arrowContainer.style.left = '-16px';
          arrowContainer.style.transform = 'translateY(-50%)';
          break;
        case 'right-down':
          path.setAttribute('d', 'M2 8 L8 8 L8 14 M5 11 L8 14 L11 11');
          arrowContainer.style.top = '25%';
          arrowContainer.style.right = '-16px';
          arrowContainer.style.transform = 'none';
          break;
        case 'down-right':
          path.setAttribute('d', 'M8 2 L8 8 L14 8 M11 5 L14 8 L11 11');
          arrowContainer.style.bottom = '-12px';
          arrowContainer.style.left = '25%';
          arrowContainer.style.transform = 'none';
          break;
        case 'left-down':
          path.setAttribute('d', 'M14 8 L8 8 L8 14 M11 11 L8 14 L5 11');
          arrowContainer.style.top = '25%';
          arrowContainer.style.left = '-16px';
          arrowContainer.style.transform = 'none';
          break;
        case 'down-left':
          path.setAttribute('d', 'M8 2 L8 8 L2 8 M5 5 L2 8 L5 11');
          arrowContainer.style.bottom = '-12px';
          arrowContainer.style.right = '25%';
          arrowContainer.style.transform = 'none';
          break;
        case 'right-up':
          path.setAttribute('d', 'M2 8 L8 8 L8 2 M5 5 L8 2 L11 5');
          arrowContainer.style.bottom = '25%';
          arrowContainer.style.right = '-16px';
          arrowContainer.style.transform = 'none';
          break;
        case 'up-right':
          path.setAttribute('d', 'M8 14 L8 8 L14 8 M11 11 L14 8 L11 5');
          arrowContainer.style.top = '-20px';
          arrowContainer.style.left = '25%';
          arrowContainer.style.transform = 'none';
          break;
        case 'left-up':
          path.setAttribute('d', 'M14 8 L8 8 L8 2 M11 5 L8 2 L5 5');
          arrowContainer.style.bottom = '25%';
          arrowContainer.style.left = '-16px';
          arrowContainer.style.transform = 'none';
          break;
        case 'up-left':
          path.setAttribute('d', 'M8 14 L8 8 L2 8 M5 11 L2 8 L5 5');
          arrowContainer.style.top = '-20px';
          arrowContainer.style.right = '25%';
          arrowContainer.style.transform = 'none';
          break;
      }

      svg.appendChild(path);
      arrowContainer.appendChild(svg);
      clueContent.appendChild(arrowContainer);
      cellDiv.appendChild(clueContent);
    }
  }
}
