import { Injectable, signal, computed, inject } from '@angular/core';
import {
  CrosswordGrid,
  CrosswordCell,
  AnswerCell,
  ClueCell,
  SplitCell,
  ClueDirection,
  BasicDirection,
} from '../models/crossword.model';
import { GridPosition, ParsedDirection } from '../models/direction.model';
import { DirectionService } from './direction.service';

@Injectable({
  providedIn: 'root',
})
export class CrosswordService {
  private readonly STORAGE_KEY = 'diretas-crosswords';
  private readonly directionService = inject(DirectionService);

  private crosswords = signal<CrosswordGrid[]>([]);
  readonly crosswordList = computed(() => this.crosswords());

  constructor() {
    this.loadFromStorage();
  }

  createNewCrossword(title: string, rows: number, cols: number): CrosswordGrid {
    const id = this.generateId();
    const now = new Date();

    const cells: CrosswordCell[][] = [];
    for (let row = 0; row < rows; row++) {
      cells[row] = [];
      for (let col = 0; col < cols; col++) {
        cells[row][col] = {
          type: 'answer',
          id: `${row}-${col}`,
          row,
          col,
          letter: '',
        };
      }
    }

    const crossword: CrosswordGrid = {
      id,
      title,
      rows,
      cols,
      cells,
      createdAt: now,
      updatedAt: now,
    };

    this.crosswords.update((crosswords) => [...crosswords, crossword]);
    this.saveToStorage();

    return crossword;
  }

  getCrosswordById(id: string): CrosswordGrid | undefined {
    return this.crosswords().find((cw) => cw.id === id);
  }

  updateCrossword(crossword: CrosswordGrid): void {
    crossword.updatedAt = new Date();

    this.crosswords.update((crosswords) =>
      crosswords.map((cw) => (cw.id === crossword.id ? crossword : cw))
    );

    this.saveToStorage();
  }

  deleteCrossword(id: string): void {
    this.crosswords.update((crosswords) =>
      crosswords.filter((cw) => cw.id !== id)
    );

    this.saveToStorage();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper functions for cell type management
  createAnswerCell(
    id: string,
    row: number,
    col: number,
    letter: string = ''
  ): AnswerCell {
    return { type: 'answer', id, row, col, letter };
  }

  createClueCell(
    id: string,
    row: number,
    col: number,
    clueText: string = '',
    clueDirection: ClueDirection = 'right'
  ): ClueCell {
    return {
      type: 'clue',
      id,
      row,
      col,
      clueText,
      clueDirection,
      boldClueText: false,
      textSize: 'medium',
    };
  }

  createSplitCell(
    id: string,
    row: number,
    col: number,
    topLetter: string = '',
    bottomLetter: string = '',
    diagonalDirection: 'main' | 'anti' = 'main'
  ): SplitCell {
    return {
      type: 'split',
      id,
      row,
      col,
      topLetter,
      bottomLetter,
      diagonalDirection,
    };
  }

  // Type guards
  isAnswerCell(cell: CrosswordCell): cell is AnswerCell {
    return cell.type === 'answer';
  }

  isClueCell(cell: CrosswordCell): cell is ClueCell {
    return cell.type === 'clue';
  }

  isSplitCell(cell: CrosswordCell): cell is SplitCell {
    return cell.type === 'split';
  }

  // Get cells that should be highlighted when a clue cell is selected
  getHighlightedCells(
    clueCell: ClueCell,
    grid: CrosswordGrid
  ): CrosswordCell[] {
    return this.getHighlightedCellsForDirection(
      clueCell.row,
      clueCell.col,
      clueCell.clueDirection,
      grid
    );
  }

  private getHighlightedCellsForDirection(
    startRow: number,
    startCol: number,
    direction: ClueDirection,
    grid: CrosswordGrid
  ): CrosswordCell[] {
    // Parse the direction to get the final direction and starting position
    const { finalDirection, startingPosition } = this.parseDirection(
      direction,
      startRow,
      startCol
    );

    // Traverse in the final direction from the calculated starting position
    return this.traverseInDirection(
      startingPosition.row,
      startingPosition.col,
      finalDirection,
      grid
    );
  }

  private parseDirection(
    direction: ClueDirection,
    startRow: number,
    startCol: number
  ): ParsedDirection {
    const startingPosition: GridPosition = { row: startRow, col: startCol };
    return this.directionService.parseClueDirection(
      direction,
      startingPosition
    );
  }

  private traverseInDirection(
    startRow: number,
    startCol: number,
    direction: BasicDirection,
    grid: CrosswordGrid
  ): CrosswordCell[] {
    const cells: CrosswordCell[] = [];
    const { rows, cols, cells: gridCells } = grid;

    // Start from the given position (already offset for compound directions)
    let currentPosition: GridPosition = { row: startRow, col: startCol };

    while (this.directionService.isValidPosition(currentPosition, rows, cols)) {
      const cell = gridCells[currentPosition.row][currentPosition.col];

      // Stop if we hit another clue cell
      if (this.isClueCell(cell)) {
        break;
      }

      // Add answer and split cells to highlight
      if (this.isAnswerCell(cell) || this.isSplitCell(cell)) {
        cells.push(cell);
      }

      // Move to next position
      currentPosition = this.directionService.getNextPosition(
        currentPosition,
        direction
      );
    }

    return cells;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const crosswords = JSON.parse(stored).map((cw: any) => ({
          ...cw,
          createdAt: new Date(cw.createdAt),
          updatedAt: new Date(cw.updatedAt),
        }));
        this.crosswords.set(crosswords);
      }
    } catch (error) {
      console.error('Error loading crosswords from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.crosswords()));
    } catch (error) {
      console.error('Error saving crosswords to storage:', error);
    }
  }
}
