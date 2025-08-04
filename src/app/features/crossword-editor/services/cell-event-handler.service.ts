import { Injectable, inject } from '@angular/core';
import { CrosswordService } from '../../../core/services/crossword.service';
import { EditorStateService } from './editor-state.service';
import { CellEditingService } from './cell-editing.service';
import { FocusManagerService } from './focus-manager.service';
import {
  CellClickEvent,
  CellRightClickEvent,
  TriangleClickEvent,
  TriangleKeydownEvent,
} from '../types/editor.types';

@Injectable({
  providedIn: 'root'
})
export class CellEventHandlerService {
  private readonly crosswordService = inject(CrosswordService);
  private readonly editorStateService = inject(EditorStateService);
  private readonly cellEditingService = inject(CellEditingService);
  private readonly focusManagerService = inject(FocusManagerService);

  private cellCycleStates: any[] = [];

  initializeCellCycleStates(
    setClueCell: (row: number, col: number, direction: any) => void,
    clearCell: (row: number, col: number) => void,
    toggleSplitCell: (row: number, col: number, direction: 'main' | 'anti') => void
  ): void {
    this.cellCycleStates = this.cellEditingService.createCellCycleStates(
      setClueCell,
      clearCell,
      toggleSplitCell
    );
  }

  handleCellClick(data: CellClickEvent): void {
    const crossword = this.editorStateService.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    const currentSelected = this.editorStateService.selectedCell();

    // Only update selection if it's a different cell
    if (
      !currentSelected ||
      currentSelected.row !== cell.row ||
      currentSelected.col !== cell.col
    ) {
      this.editorStateService.setSelectedCell(cell);
    }
  }

  handleCellDoubleClick(data: CellClickEvent): void {
    const crossword = this.editorStateService.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];

    // Select the cell first if not already selected
    this.editorStateService.setSelectedCell(cell);

    // Set editing state and focus clue input if it's a clue cell
    if (this.crosswordService.isClueCell(cell)) {
      this.editorStateService.setEditingCell(cell);
      this.focusManagerService.focusClueInput(cell.row, cell.col);
    }
  }

  handleCellRightClick(data: CellRightClickEvent): void {
    data.event.preventDefault(); // Prevent context menu

    const crossword = this.editorStateService.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    this.editorStateService.setSelectedCell(cell);

    // Cycle through cell types
    this.cycleCellType(data.row, data.col);
  }

  handleCellFocus(data: CellClickEvent): void {
    const crossword = this.editorStateService.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    this.editorStateService.setSelectedCell(cell);
  }

  handleTriangleClick(data: TriangleClickEvent): void {
    data.event.stopPropagation();

    const crossword = this.editorStateService.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    this.editorStateService.setSelectedCell(cell);
    this.editorStateService.setActiveTriangle({
      row: data.row,
      col: data.col,
      triangle: data.triangle,
    });

    // Auto-focus the triangle input field
    this.focusManagerService.focusTriangleInput();
  }

  handleTriangleKeydown(data: TriangleKeydownEvent): void {
    const crossword = this.editorStateService.crossword();
    if (!crossword) return;

    const { event, row, col, triangle } = data;

    if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
      // Letter input
      const cell = crossword.cells[row][col];
      if (!this.crosswordService.isSplitCell(cell)) return;

      const letter = event.key.toUpperCase();
      const newCell = this.cellEditingService.updateSplitCellLetter(cell, triangle, letter);
      
      if (newCell) {
        this.editorStateService.updateCrosswordCell(row, col, newCell);
        event.preventDefault();

        // Simple navigation: move to bottom triangle if on top, otherwise stay
        if (triangle === 'top') {
          this.editorStateService.setActiveTriangle({ row, col, triangle: 'bottom' });
          this.focusManagerService.focusTriangleInput();
        }
      }
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      // Clear current triangle
      const cell = crossword.cells[row][col];
      if (!this.crosswordService.isSplitCell(cell)) return;

      const newCell = this.cellEditingService.clearSplitCellTriangle(cell, triangle);
      if (newCell) {
        this.editorStateService.updateCrosswordCell(row, col, newCell);
        event.preventDefault();
      }
    } else if (
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'
    ) {
      // Simple arrow navigation - just prevent default
      event.preventDefault();
    } else if (event.key === 'Tab') {
      // Tab to next triangle
      event.preventDefault();
      if (triangle === 'top') {
        this.editorStateService.setActiveTriangle({ row, col, triangle: 'bottom' });
        this.focusManagerService.focusTriangleInput();
      }
    }
  }

  handleTriangleBlur(): void {
    // Clear active triangle when input loses focus
    setTimeout(() => {
      if (!document.activeElement?.classList.contains('triangle-input')) {
        this.editorStateService.setActiveTriangle(null);
        this.editorStateService.setSelectedCell(null);
      }
    }, 100);
  }

  handleClueInputBlur(isInteractingWithEditor: boolean): void {
    // Always clear editing state when input loses focus
    this.editorStateService.setEditingCell(null);

    // Trigger change detection
    this.editorStateService.triggerChangeDetection();

    // Don't deselect if we're interacting with the editor panel
    if (isInteractingWithEditor) {
      return;
    }

    // Use a timeout to check if focus moved to the editor panel
    setTimeout(() => {
      if (!isInteractingWithEditor) {
        this.editorStateService.setSelectedCell(null);
      }
    }, 50);
  }

  handleAnswerLetterChange(data: { row: number; col: number; letter: string }): void {
    const crossword = this.editorStateService.crossword();
    if (!crossword) return;

    const { row, col, letter } = data;
    const cell = crossword.cells[row][col];

    const newCell = this.cellEditingService.updateAnswerLetter(cell, letter);
    if (newCell) {
      this.editorStateService.updateCrosswordCell(row, col, newCell);
    }
  }

  private cycleCellType(row: number, col: number): void {
    const crossword = this.editorStateService.crossword();
    if (!crossword) return;

    this.cellEditingService.cycleCellType(row, col, crossword, this.cellCycleStates);
  }
}
