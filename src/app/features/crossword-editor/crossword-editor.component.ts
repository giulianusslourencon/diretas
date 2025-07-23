import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordService } from '../../core/services/crossword.service';
import {
  CrosswordGrid,
  CrosswordCell,
} from '../../core/models/crossword.model';

type CellType = 'regular' | 'clue-horizontal' | 'clue-vertical' | 'split-cell';

@Component({
  selector: 'app-crossword-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-editor.component.html',
  styleUrl: './crossword-editor.component.scss',
})
export class CrosswordEditorComponent implements OnInit {
  private readonly crosswordService = inject(CrosswordService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly crossword = signal<CrosswordGrid | null>(null);
  readonly isLoading = signal(true);
  readonly selectedCell = signal<CrosswordCell | null>(null);
  readonly activeTriangle = signal<{
    row: number;
    col: number;
    triangle: 'top' | 'bottom';
  } | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      const crossword = this.crosswordService.getCrosswordById(id);
      if (crossword) {
        this.crossword.set(crossword);
      } else {
        this.router.navigate(['/crosswords']);
        return;
      }
    } else {
      // For new crosswords, we'll create a default one
      const newCrossword = this.crosswordService.createNewCrossword(
        'Nova Palavra Cruzada',
        15,
        15
      );
      this.crossword.set(newCrossword);
    }

    this.isLoading.set(false);
  }

  onCellClick(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    this.selectedCell.set(cell);
  }

  onCellRightClick(event: MouseEvent, row: number, col: number): void {
    event.preventDefault(); // Prevent context menu

    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    this.selectedCell.set(cell);

    // Cycle through cell types: regular -> horizontal clue -> vertical clue -> split cell -> regular
    this.cycleCellType(row, col);
  }

  private cycleCellType(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];

    if (!cell.isClueCell && !cell.isSplitCell) {
      // Regular cell -> Horizontal clue
      this.setClueCell(row, col, 'horizontal');
    } else if (cell.isClueCell && cell.clueDirection === 'horizontal') {
      // Horizontal clue -> Vertical clue
      this.setClueCell(row, col, 'vertical');
    } else if (cell.isClueCell && cell.clueDirection === 'vertical') {
      // Vertical clue -> Split cell
      this.clearCell(row, col);
      this.toggleSplitCell(row, col);
    } else if (cell.isSplitCell) {
      // Split cell -> Regular cell
      this.clearCell(row, col);
    }
  }

  onCellFocus(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    this.selectedCell.set(cell);
  }

  private setClueCell(
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];

    cell.isClueCell = true;
    cell.clueDirection = direction;
    cell.letter = '';

    if (!cell.clueText) {
      cell.clueText = 'Digite a dica aqui';
    }

    this.crossword.set({ ...crossword });
  }

  private toggleSplitCell(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    cell.isSplitCell = !cell.isSplitCell;

    if (cell.isSplitCell) {
      // Initialize split cell for two letters
      cell.isClueCell = false;
      cell.letter = '';
      cell.clueText = '';
      cell.clueDirection = undefined;

      // Initialize with empty letters
      cell.topLetter = '';
      cell.bottomLetter = '';
    } else {
      // Clear split cell data
      cell.topLetter = '';
      cell.bottomLetter = '';
    }

    this.crossword.set({ ...crossword });
  }

  private clearCell(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    cell.isClueCell = false;
    cell.isSplitCell = false;
    cell.letter = '';
    cell.clueText = '';
    cell.clueDirection = undefined;
    cell.topLetter = '';
    cell.bottomLetter = '';

    this.crossword.set({ ...crossword });
  }

  clearSelectedCell(): void {
    const selected = this.selectedCell();
    if (!selected) return;

    this.clearCell(selected.row, selected.col);
    this.selectedCell.set(null);
  }

  saveChanges(): void {
    const current = this.crossword();
    if (current) {
      this.crosswordService.updateCrossword(current);
    }
  }

  goBack(): void {
    this.router.navigate(['/crosswords']);
  }

  saveCrossword(): void {
    this.saveChanges();
  }

  focusTriangle(
    row: number,
    col: number,
    triangle: 'top' | 'bottom',
    event: Event
  ): void {
    event.stopPropagation();

    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    this.selectedCell.set(cell);
    this.activeTriangle.set({ row, col, triangle });

    // Focus the appropriate hidden input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.hidden-input');
      const targetInput =
        triangle === 'top'
          ? (inputs[0] as HTMLInputElement)
          : (inputs[1] as HTMLInputElement);
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }, 0);
  }

  onTriangleKeydown(
    event: KeyboardEvent,
    row: number,
    col: number,
    triangle: 'top' | 'bottom'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
      // Letter input
      const cell = crossword.cells[row][col];
      const letter = event.key.toUpperCase();

      if (triangle === 'top') {
        cell.topLetter = letter;
      } else {
        cell.bottomLetter = letter;
      }

      this.crossword.set({ ...crossword });
      event.preventDefault();

      // Move to next triangle or cell
      this.moveToNextTriangle(row, col, triangle);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      // Clear current triangle
      const cell = crossword.cells[row][col];

      if (triangle === 'top') {
        cell.topLetter = '';
      } else {
        cell.bottomLetter = '';
      }

      this.crossword.set({ ...crossword });
      event.preventDefault();
    } else if (
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'
    ) {
      // Navigation
      this.handleTriangleNavigation(event, row, col, triangle);
    } else if (event.key === 'Tab') {
      // Tab to next triangle
      event.preventDefault();
      this.moveToNextTriangle(row, col, triangle);
    }
  }

  private moveToNextTriangle(
    row: number,
    col: number,
    currentTriangle: 'top' | 'bottom'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    if (currentTriangle === 'top') {
      // Move to bottom triangle of same cell
      this.focusTriangleByPosition(row, col, 'bottom');
    } else {
      // Move to next split cell or create new one
      this.findNextSplitCell(row, col);
    }
  }

  private handleTriangleNavigation(
    event: KeyboardEvent,
    row: number,
    col: number,
    triangle: 'top' | 'bottom'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    let newRow = row;
    let newCol = col;
    let newTriangle = triangle;

    switch (event.key) {
      case 'ArrowUp':
        if (triangle === 'bottom') {
          newTriangle = 'top';
        } else {
          newRow = Math.max(0, row - 1);
        }
        break;
      case 'ArrowDown':
        if (triangle === 'top') {
          newTriangle = 'bottom';
        } else {
          newRow = Math.min(crossword.rows - 1, row + 1);
        }
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(crossword.cols - 1, col + 1);
        break;
    }

    event.preventDefault();

    // If moving to a different cell, check if it's a split cell
    if (newRow !== row || newCol !== col) {
      const targetCell = crossword.cells[newRow][newCol];
      if (targetCell.isSplitCell) {
        this.focusTriangleByPosition(newRow, newCol, newTriangle);
      } else {
        // Focus regular cell
        this.onCellFocus(newRow, newCol);
      }
    } else {
      // Same cell, different triangle
      this.focusTriangleByPosition(newRow, newCol, newTriangle);
    }
  }

  private focusTriangleByPosition(
    row: number,
    col: number,
    triangle: 'top' | 'bottom'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    this.selectedCell.set(cell);
    this.activeTriangle.set({ row, col, triangle });

    // Focus the appropriate input
    setTimeout(() => {
      const cellElement = document.querySelector(`[data-cell="${row}-${col}"]`);
      if (cellElement) {
        const inputs = cellElement.querySelectorAll('.hidden-input');
        const targetInput =
          triangle === 'top'
            ? (inputs[0] as HTMLInputElement)
            : (inputs[1] as HTMLInputElement);
        if (targetInput) {
          targetInput.focus();
          targetInput.select();
        }
      }
    }, 0);
  }

  private findNextSplitCell(startRow: number, startCol: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    // Look for next split cell in reading order
    for (let row = startRow; row < crossword.rows; row++) {
      const startColForRow = row === startRow ? startCol + 1 : 0;
      for (let col = startColForRow; col < crossword.cols; col++) {
        const cell = crossword.cells[row][col];
        if (cell.isSplitCell) {
          this.focusTriangleByPosition(row, col, 'top');
          return;
        }
      }
    }

    // If no split cell found, focus first regular cell
    this.onCellFocus(0, 0);
  }

  onTriangleBlur(): void {
    // Keep the active triangle for a short time to allow for navigation
    setTimeout(() => {
      if (!document.activeElement?.classList.contains('hidden-input')) {
        this.activeTriangle.set(null);
      }
    }, 100);
  }
}
