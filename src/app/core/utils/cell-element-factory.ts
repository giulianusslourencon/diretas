import {
  CrosswordCell,
  CrosswordExportOptions,
  ClueCell,
  SplitCell,
  AnswerCell,
} from '../models/crossword.model';
import { PdfConfig } from '../config/pdf-config';
import { SvgArrowFactory } from './svg-arrow-factory';

export class CellElementFactory {
  // Type guards
  private static isAnswerCell(cell: CrosswordCell): cell is AnswerCell {
    return cell.type === 'answer';
  }

  private static isClueCell(cell: CrosswordCell): cell is ClueCell {
    return cell.type === 'clue';
  }

  private static isSplitCell(cell: CrosswordCell): cell is SplitCell {
    return cell.type === 'split';
  }

  static createCellElement(
    cell: CrosswordCell,
    options: CrosswordExportOptions
  ): HTMLElement {
    const cellDiv = this.createBaseCellElement(cell);

    if (this.isSplitCell(cell)) {
      this.addSplitCellContent(cellDiv, cell, options);
    } else if (this.isClueCell(cell)) {
      this.addClueCellContent(cellDiv, cell);
    } else if (this.isAnswerCell(cell)) {
      this.addAnswerCellContent(cellDiv, cell, options);
    }

    return cellDiv;
  }

  private static createBaseCellElement(cell: CrosswordCell): HTMLElement {
    const cellDiv = document.createElement('div');
    const cellConfig = PdfConfig.CELL;
    const colors = PdfConfig.COLORS;

    cellDiv.style.width = `${cellConfig.width}px`;
    cellDiv.style.height = `${cellConfig.height}px`;
    cellDiv.style.border = `${cellConfig.borderWidth}px solid ${colors.border}`;
    cellDiv.style.position = 'relative';
    cellDiv.style.boxSizing = 'border-box';
    cellDiv.style.display = 'flex';
    cellDiv.style.alignItems = 'center';
    cellDiv.style.justifyContent = 'center';
    
    // Set background color based on cell type
    cellDiv.style.backgroundColor = this.isClueCell(cell)
      ? colors.clueBackground
      : colors.background;

    return cellDiv;
  }

  private static addAnswerCellContent(
    cellDiv: HTMLElement,
    cell: AnswerCell,
    options: CrosswordExportOptions
  ): void {
    if (options.includeAnswers && cell.letter) {
      const letterSpan = document.createElement('span');
      letterSpan.textContent = cell.letter.toUpperCase();
      letterSpan.style.fontSize = '20px';
      letterSpan.style.fontWeight = 'bold';
      letterSpan.style.color = PdfConfig.COLORS.text;
      cellDiv.appendChild(letterSpan);
    }
  }

  private static addSplitCellContent(
    cellDiv: HTMLElement,
    cell: SplitCell,
    options: CrosswordExportOptions
  ): void {
    // Add diagonal line
    this.addDiagonalLine(cellDiv, cell.diagonalDirection);

    // Add letters if includeAnswers is true
    if (options.includeAnswers) {
      if (cell.topLetter) {
        this.addSplitLetter(cellDiv, cell.topLetter, 'top', cell.diagonalDirection);
      }
      if (cell.bottomLetter) {
        this.addSplitLetter(cellDiv, cell.bottomLetter, 'bottom', cell.diagonalDirection);
      }
    }
  }

  private static addDiagonalLine(
    cellDiv: HTMLElement,
    direction: 'main' | 'anti'
  ): void {
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
    line.style.backgroundColor = PdfConfig.COLORS.diagonalLine;
    line.style.transformOrigin = '0 0';

    if (direction === 'anti') {
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
  }

  private static addSplitLetter(
    cellDiv: HTMLElement,
    letter: string,
    position: 'top' | 'bottom',
    direction: 'main' | 'anti'
  ): void {
    const letterElement = document.createElement('span');
    letterElement.textContent = letter.toUpperCase();
    letterElement.style.position = 'absolute';
    letterElement.style.fontSize = '20px';
    letterElement.style.fontWeight = 'bold';
    letterElement.style.color = PdfConfig.COLORS.text;
    letterElement.style.zIndex = '10';

    // Position based on diagonal direction and letter position
    if (position === 'top') {
      letterElement.style.top = '8px';
      if (direction === 'anti') {
        letterElement.style.left = '8px';
      } else {
        letterElement.style.right = '8px';
      }
    } else {
      letterElement.style.bottom = '8px';
      if (direction === 'anti') {
        letterElement.style.right = '8px';
      } else {
        letterElement.style.left = '8px';
      }
    }

    cellDiv.appendChild(letterElement);
  }

  private static addClueCellContent(cellDiv: HTMLElement, cell: ClueCell): void {
    if (!cell.clueText) return;

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

    // Add clue text
    const clueText = this.createClueTextElement(cell);
    clueContent.appendChild(clueText);

    // Add arrow indicator
    if (cell.clueDirection) {
      const arrow = SvgArrowFactory.createArrowElement(cell.clueDirection);
      clueContent.appendChild(arrow);
    }

    cellDiv.appendChild(clueContent);
  }

  private static createClueTextElement(cell: ClueCell): HTMLElement {
    const clueText = document.createElement('div');
    const fonts = PdfConfig.FONTS;
    const colors = PdfConfig.COLORS;

    clueText.textContent = cell.clueText!;

    // Set font size and line height based on textSize property
    const fontSize = fonts.cellSizes[cell.textSize || 'medium'];
    const lineHeight = fonts.lineHeights[cell.textSize || 'medium'];

    clueText.style.fontSize = fontSize;
    clueText.style.lineHeight = lineHeight;
    clueText.style.textAlign = 'center';
    clueText.style.color = colors.text;
    clueText.style.fontWeight = cell.boldClueText ? 'bold' : '500';
    clueText.style.overflowWrap = 'break-word';
    clueText.style.overflow = 'hidden';
    clueText.style.width = '100%';
    clueText.style.display = 'flex';
    clueText.style.alignItems = 'center';
    clueText.style.justifyContent = 'center';
    clueText.style.flex = '1';

    return clueText;
  }
}
