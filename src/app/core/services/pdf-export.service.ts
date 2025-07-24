import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  CrosswordGrid,
  CrosswordExportOptions,
} from '../models/crossword.model';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  async exportCrosswordToPdf(
    crossword: CrosswordGrid,
    options: CrosswordExportOptions = {
      includeAnswers: false,
      includeClues: true,
      paperSize: 'A4',
      orientation: 'portrait',
    }
  ): Promise<void> {
    try {
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

      // Create PDF
      const pdf = new jsPDF({
        orientation: options.orientation,
        unit: 'mm',
        format: options.paperSize.toLowerCase() as 'a4' | 'letter',
      });

      // Calculate dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;

      // Calculate image dimensions maintaining aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(
        availableWidth / imgWidth,
        availableHeight / imgHeight
      );

      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      // Center the image
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(crossword.title, pageWidth / 2, 15, { align: 'center' });

      // Add the crossword image
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

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
    cell: any,
    options: CrosswordExportOptions
  ): HTMLElement {
    const cellDiv = document.createElement('div');
    cellDiv.style.width = '60px';
    cellDiv.style.height = '60px';
    cellDiv.style.border = '1px solid #333';
    cellDiv.style.position = 'relative';
    // Set background color based on cell type
    cellDiv.style.backgroundColor = cell.isClueCell ? '#d0d0d0' : '#ffffff';
    cellDiv.style.boxSizing = 'border-box';
    cellDiv.style.display = 'flex';
    cellDiv.style.alignItems = 'center';
    cellDiv.style.justifyContent = 'center';

    if (cell.isSplitCell) {
      this.createSplitCellContent(cellDiv, cell, options);
    } else if (cell.isClueCell) {
      this.createClueCellContent(cellDiv, cell, options);
    } else {
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
    cell: any,
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
    cell: any,
    options: CrosswordExportOptions
  ): void {
    // Add colored indicator based on clue direction
    const indicator = document.createElement('div');
    indicator.style.position = 'absolute';
    indicator.style.backgroundColor = '#666';
    indicator.style.zIndex = '1';

    switch (cell.clueDirection) {
      case 'horizontal':
        indicator.style.left = '0';
        indicator.style.top = '0';
        indicator.style.width = '2px';
        indicator.style.height = '100%';
        break;
      case 'vertical':
        indicator.style.left = '0';
        indicator.style.top = '0';
        indicator.style.width = '100%';
        indicator.style.height = '2px';
        break;
      case 'up':
        indicator.style.left = '0';
        indicator.style.bottom = '0';
        indicator.style.width = '100%';
        indicator.style.height = '2px';
        break;
      case 'left':
        indicator.style.right = '0';
        indicator.style.top = '0';
        indicator.style.width = '2px';
        indicator.style.height = '100%';
        break;
    }

    cellDiv.appendChild(indicator);

    // Add clue text if includeClues is true
    if (options.includeClues && cell.clueText) {
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
      clueText.style.height = '100%';
      clueText.style.width = '100%';

      clueContent.appendChild(clueText);

      // Add arrow
      const arrow = document.createElement('div');
      arrow.style.position = 'absolute';
      arrow.style.fontSize = '12px';
      arrow.style.fontWeight = 'bold';
      arrow.style.zIndex = '10';
      arrow.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      arrow.style.borderRadius = '2px';
      arrow.style.padding = '1px 2px';
      arrow.style.lineHeight = '1';
      arrow.style.color = '#666';

      switch (cell.clueDirection) {
        case 'horizontal':
          arrow.textContent = '→';
          arrow.style.top = '50%';
          arrow.style.right = '-12px';
          arrow.style.transform = 'translateY(-50%)';
          break;
        case 'vertical':
          arrow.textContent = '↓';
          arrow.style.bottom = '-12px';
          arrow.style.left = '50%';
          arrow.style.transform = 'translateX(-50%)';
          break;
        case 'up':
          arrow.textContent = '↑';
          arrow.style.top = '-12px';
          arrow.style.left = '50%';
          arrow.style.transform = 'translateX(-50%)';
          break;
        case 'left':
          arrow.textContent = '←';
          arrow.style.top = '50%';
          arrow.style.left = '-12px';
          arrow.style.transform = 'translateY(-50%)';
          break;
      }

      clueContent.appendChild(arrow);
      cellDiv.appendChild(clueContent);
    }
  }
}
