import { Injectable, inject } from '@angular/core';
import { ClueDirection, CrosswordCell, CrosswordGrid } from '../../../core/models/crossword.model';
import { CrosswordService } from '../../../core/services/crossword.service';

export interface CellCycleState {
  matches: (cell: CrosswordCell) => boolean;
  action: (row: number, col: number) => void;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CellEditingService {
  private readonly crosswordService = inject(CrosswordService);

  createCellCycleStates(
    setClueCell: (row: number, col: number, direction: ClueDirection) => void,
    clearCell: (row: number, col: number) => void,
    toggleSplitCell: (row: number, col: number, direction: 'main' | 'anti') => void
  ): CellCycleState[] {
    return [
      // Regular cell -> Clue cell
      {
        matches: (cell) => this.crosswordService.isAnswerCell(cell),
        action: (row, col) => setClueCell(row, col, 'right'),
        description: 'Regular cell -> Clue cell',
      },
      // Clue cell -> Split cell (main diagonal)
      {
        matches: (cell) => this.crosswordService.isClueCell(cell),
        action: (row, col) => {
          clearCell(row, col);
          toggleSplitCell(row, col, 'main');
        },
        description: 'Clue cell -> Split cell (main diagonal)',
      },
      // Split cell (main diagonal) -> Split cell (anti diagonal)
      {
        matches: (cell) =>
          this.crosswordService.isSplitCell(cell) &&
          cell.diagonalDirection === 'main',
        action: (row, col) => toggleSplitCell(row, col, 'anti'),
        description: 'Split cell (main diagonal) -> Split cell (anti diagonal)',
      },
      // Split cell (anti diagonal) -> Regular cell
      {
        matches: (cell) =>
          this.crosswordService.isSplitCell(cell) &&
          cell.diagonalDirection === 'anti',
        action: (row, col) => clearCell(row, col),
        description: 'Split cell (anti diagonal) -> Regular cell',
      },
    ];
  }

  cycleCellType(
    row: number, 
    col: number, 
    crossword: CrosswordGrid,
    cellCycleStates: CellCycleState[]
  ): void {
    const cell = crossword.cells[row][col];

    // Find the matching state and execute its action
    const currentState = cellCycleStates.find((state) => state.matches(cell));
    if (currentState) {
      currentState.action(row, col);
    } else {
      // Fallback: if no state matches, reset to regular cell
      const clearAction = cellCycleStates.find(state => 
        state.description.includes('Regular cell')
      );
      if (clearAction) {
        clearAction.action(row, col);
      }
    }
  }

  setClueCell(
    row: number,
    col: number,
    direction: ClueDirection,
    crossword: CrosswordGrid
  ): CrosswordCell {
    const currentCell = crossword.cells[row][col];
    const clueText = this.crosswordService.isClueCell(currentCell)
      ? currentCell.clueText
      : 'Digite a dica aqui';

    return this.crosswordService.createClueCell(
      currentCell.id,
      row,
      col,
      clueText,
      direction
    );
  }

  toggleSplitCell(
    row: number,
    col: number,
    direction: 'main' | 'anti',
    crossword: CrosswordGrid
  ): CrosswordCell {
    const currentCell = crossword.cells[row][col];
    let topLetter = '';
    let bottomLetter = '';

    // Preserve letters if already a split cell
    if (this.crosswordService.isSplitCell(currentCell)) {
      topLetter = currentCell.topLetter;
      bottomLetter = currentCell.bottomLetter;
    }

    return this.crosswordService.createSplitCell(
      currentCell.id,
      row,
      col,
      topLetter,
      bottomLetter,
      direction
    );
  }

  clearCell(row: number, col: number, crossword: CrosswordGrid): CrosswordCell {
    const currentCell = crossword.cells[row][col];
    return this.crosswordService.createAnswerCell(
      currentCell.id,
      row,
      col,
      ''
    );
  }

  updateClueText(
    cell: CrosswordCell,
    text: string
  ): CrosswordCell | null {
    if (!this.crosswordService.isClueCell(cell)) return null;

    const newCell = this.crosswordService.createClueCell(
      cell.id,
      cell.row,
      cell.col,
      text,
      cell.clueDirection
    );
    newCell.boldClueText = cell.boldClueText;
    newCell.textSize = cell.textSize;
    return newCell;
  }

  updateClueDirection(
    cell: CrosswordCell,
    direction: ClueDirection
  ): CrosswordCell | null {
    if (!this.crosswordService.isClueCell(cell)) return null;

    const newCell = this.crosswordService.createClueCell(
      cell.id,
      cell.row,
      cell.col,
      cell.clueText,
      direction
    );
    newCell.boldClueText = cell.boldClueText;
    newCell.textSize = cell.textSize;
    return newCell;
  }

  updateTextSize(
    cell: CrosswordCell,
    size: 'small' | 'medium' | 'large'
  ): CrosswordCell | null {
    if (!this.crosswordService.isClueCell(cell)) return null;

    const newCell = this.crosswordService.createClueCell(
      cell.id,
      cell.row,
      cell.col,
      cell.clueText,
      cell.clueDirection
    );
    newCell.boldClueText = cell.boldClueText;
    newCell.textSize = size;
    return newCell;
  }

  updateBoldText(
    cell: CrosswordCell,
    bold: boolean
  ): CrosswordCell | null {
    if (!this.crosswordService.isClueCell(cell)) return null;

    const newCell = this.crosswordService.createClueCell(
      cell.id,
      cell.row,
      cell.col,
      cell.clueText,
      cell.clueDirection
    );
    newCell.boldClueText = bold;
    newCell.textSize = cell.textSize;
    return newCell;
  }

  updateAnswerLetter(
    cell: CrosswordCell,
    letter: string
  ): CrosswordCell | null {
    if (!this.crosswordService.isAnswerCell(cell)) return null;

    return this.crosswordService.createAnswerCell(
      cell.id,
      cell.row,
      cell.col,
      letter
    );
  }

  updateSplitCellLetter(
    cell: CrosswordCell,
    triangle: 'top' | 'bottom',
    letter: string
  ): CrosswordCell | null {
    if (!this.crosswordService.isSplitCell(cell)) return null;

    const newTopLetter = triangle === 'top' ? letter : cell.topLetter;
    const newBottomLetter = triangle === 'bottom' ? letter : cell.bottomLetter;

    return this.crosswordService.createSplitCell(
      cell.id,
      cell.row,
      cell.col,
      newTopLetter,
      newBottomLetter,
      cell.diagonalDirection
    );
  }

  clearSplitCellTriangle(
    cell: CrosswordCell,
    triangle: 'top' | 'bottom'
  ): CrosswordCell | null {
    if (!this.crosswordService.isSplitCell(cell)) return null;

    const newTopLetter = triangle === 'top' ? '' : cell.topLetter;
    const newBottomLetter = triangle === 'bottom' ? '' : cell.bottomLetter;

    return this.crosswordService.createSplitCell(
      cell.id,
      cell.row,
      cell.col,
      newTopLetter,
      newBottomLetter,
      cell.diagonalDirection
    );
  }
}
