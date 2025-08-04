import { Injectable, inject } from '@angular/core';
import { CrosswordCell } from '../../../core/models/crossword.model';
import { CrosswordService } from '../../../core/services/crossword.service';

export interface FocusOptions {
  delay?: number;
  select?: boolean;
}

/**
 * Service for managing focus operations with consistent patterns
 */
@Injectable({
  providedIn: 'root',
})
export class FocusManagerService {
  private readonly crosswordService = inject(CrosswordService);

  /**
   * Generic method to focus an element with consistent timeout and options
   * @param selector CSS selector or element ID
   * @param options Focus options
   */
  private focusElement(selector: string, options: FocusOptions = {}): void {
    const { delay = 10, select = false } = options;

    setTimeout(() => {
      const element = selector.startsWith('#')
        ? document.getElementById(selector.substring(1))
        : document.querySelector(selector);

      const input = element as HTMLInputElement;
      if (input) {
        input.focus();
        if (select) {
          input.select();
        }
      }
    }, delay);
  }

  /**
   * Focus a cell input if it's an answer cell
   * @param cell The cell to potentially focus
   */
  focusCellIfNeeded(cell: CrosswordCell): void {
    // Only auto-focus answer cells for immediate typing
    if (this.crosswordService.isAnswerCell(cell)) {
      const selector = `[data-cell="${cell.row}-${cell.col}"] .cell-input`;
      this.focusElement(selector);
    }
  }

  /**
   * Focus a clue input for a specific cell
   * @param row Cell row
   * @param col Cell column
   */
  focusClueInput(row: number, col: number): void {
    const selector = `[data-cell="${row}-${col}"] .clue-input`;
    this.focusElement(selector, { select: true });
  }

  /**
   * Focus the triangle input
   */
  focusTriangleInput(): void {
    this.focusElement('.triangle-input', { delay: 0, select: true });
  }

  /**
   * Focus the title input
   */
  focusTitleInput(): void {
    this.focusElement('#title-input', { delay: 0, select: true });
  }
}
