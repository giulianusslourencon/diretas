import { Injectable, signal, inject } from '@angular/core';
import {
  CrosswordCell,
  CrosswordGrid,
} from '../../../core/models/crossword.model';
import { KeyboardUtilsService } from '../../../core/services/keyboard-utils.service';

export type NavigationDirection = 'right' | 'down' | 'left' | 'up';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly keyboardUtilsService = inject(KeyboardUtilsService);
  readonly navigationDirection = signal<NavigationDirection>('right');

  toggleNavigationDirection(): void {
    const current = this.navigationDirection();
    const directions: NavigationDirection[] = ['right', 'down', 'left', 'up'];
    const currentIndex = directions.indexOf(current);
    const nextIndex = (currentIndex + 1) % directions.length;
    this.navigationDirection.set(directions[nextIndex]);
  }

  getNavigationDirectionMessage(): string {
    const direction = this.navigationDirection();
    const messages = {
      right: 'Navegação: Direita (→)',
      down: 'Navegação: Baixo (↓)',
      left: 'Navegação: Esquerda (←)',
      up: 'Navegação: Cima (↑)',
    };
    return messages[direction];
  }

  moveToNextCell(
    currentRow: number,
    currentCol: number,
    crossword: CrosswordGrid
  ): { row: number; col: number } | null {
    const direction = this.navigationDirection();
    let nextRow = currentRow;
    let nextCol = currentCol;

    switch (direction) {
      case 'right':
        nextCol = currentCol + 1;
        if (nextCol >= crossword.cols) {
          nextRow = currentRow + 1;
          nextCol = 0;
        }
        break;
      case 'down':
        nextRow = currentRow + 1;
        if (nextRow >= crossword.rows) {
          nextCol = currentCol + 1;
          nextRow = 0;
        }
        break;
      case 'left':
        nextCol = currentCol - 1;
        if (nextCol < 0) {
          nextRow = currentRow + 1;
          nextCol = crossword.cols - 1;
        }
        break;
      case 'up':
        nextRow = currentRow - 1;
        if (nextRow < 0) {
          nextCol = currentCol + 1;
          nextRow = crossword.rows - 1;
        }
        break;
    }

    // Check if the new position is valid
    if (
      nextRow < crossword.rows &&
      nextCol < crossword.cols &&
      nextRow >= 0 &&
      nextCol >= 0
    ) {
      return { row: nextRow, col: nextCol };
    }

    return null;
  }

  moveToPreviousCell(
    currentRow: number,
    currentCol: number,
    crossword: CrosswordGrid
  ): { row: number; col: number } | null {
    const direction = this.navigationDirection();
    let prevRow = currentRow;
    let prevCol = currentCol;

    switch (direction) {
      case 'right':
        prevCol = currentCol - 1;
        if (prevCol < 0) {
          prevRow = currentRow - 1;
          prevCol = crossword.cols - 1;
        }
        break;
      case 'down':
        prevRow = currentRow - 1;
        if (prevRow < 0) {
          prevCol = currentCol - 1;
          prevRow = crossword.rows - 1;
        }
        break;
      case 'left':
        prevCol = currentCol + 1;
        if (prevCol >= crossword.cols) {
          prevRow = currentRow - 1;
          prevCol = 0;
        }
        break;
      case 'up':
        prevRow = currentRow + 1;
        if (prevRow >= crossword.rows) {
          prevCol = currentCol - 1;
          prevRow = 0;
        }
        break;
    }

    // Check if the new position is valid
    if (
      prevRow >= 0 &&
      prevCol >= 0 &&
      prevRow < crossword.rows &&
      prevCol < crossword.cols
    ) {
      return { row: prevRow, col: prevCol };
    }

    return null;
  }

  handleArrowKeyNavigation(
    key: string,
    currentCell: CrosswordCell | null,
    crossword: CrosswordGrid
  ): CrosswordCell | null {
    if (!currentCell) {
      // If no cell is selected, select the first cell (0,0)
      return crossword.cells[0][0];
    }

    const { row, col } = currentCell;
    let newRow = row;
    let newCol = col;

    // Calculate new position based on arrow key
    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(crossword.rows - 1, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(crossword.cols - 1, col + 1);
        break;
    }

    // Only move if the position actually changed
    if (newRow !== row || newCol !== col) {
      return crossword.cells[newRow][newCol];
    }

    return currentCell;
  }

  isArrowKey(key: string): boolean {
    return this.keyboardUtilsService.isArrowKey(key);
  }
}
