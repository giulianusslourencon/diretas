import { Injectable, signal, computed } from '@angular/core';
import {
  CrosswordCell,
  CrosswordGrid,
} from '../../../core/models/crossword.model';
import { ActiveTriangle } from '../types/editor.types';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  readonly crossword = signal<CrosswordGrid | null>(null);
  readonly isLoading = signal(true);
  readonly selectedCell = signal<CrosswordCell | null>(null);
  readonly editingCell = signal<CrosswordCell | null>(null);
  readonly activeTriangle = signal<ActiveTriangle | null>(null);
  readonly saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  readonly isEditingTitle = signal(false);
  readonly titleInputValue = signal('');

  // Computed signal for highlighted cells when a clue cell is selected
  readonly highlightedCells = computed(() => {
    const selectedCell = this.selectedCell();
    const crossword = this.crossword();

    if (!selectedCell || !crossword) {
      return [];
    }

    // This will need to be injected or passed from the component
    // For now, return empty array - will be handled in component
    return [];
  });

  /**
   * Generic setter method for signals
   * @param signal The signal to update
   * @param value The new value
   */
  private setSignalValue<T>(signal: any, value: T): void {
    signal.set(value);
  }

  setCrossword(crossword: CrosswordGrid | null): void {
    this.setSignalValue(this.crossword, crossword);
  }

  setLoading(loading: boolean): void {
    this.setSignalValue(this.isLoading, loading);
  }

  setSelectedCell(cell: CrosswordCell | null): void {
    this.setSignalValue(this.selectedCell, cell);
  }

  setEditingCell(cell: CrosswordCell | null): void {
    this.setSignalValue(this.editingCell, cell);
  }

  setActiveTriangle(triangle: ActiveTriangle | null): void {
    this.setSignalValue(this.activeTriangle, triangle);
  }

  setSaveStatus(status: 'idle' | 'saving' | 'saved' | 'error'): void {
    this.setSignalValue(this.saveStatus, status);
  }

  setEditingTitle(editing: boolean): void {
    this.setSignalValue(this.isEditingTitle, editing);
  }

  setTitleInputValue(value: string): void {
    this.setSignalValue(this.titleInputValue, value);
  }

  updateCrosswordCell(row: number, col: number, newCell: CrosswordCell): void {
    const crossword = this.crossword();
    if (!crossword) return;

    crossword.cells[row][col] = newCell;
    this.crossword.set({ ...crossword });

    // Update selected cell if it's the same cell
    const selectedCell = this.selectedCell();
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      this.selectedCell.set(newCell);
    }
  }

  updateCrosswordTitle(title: string): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const updatedCrossword = { ...crossword, title };
    this.crossword.set(updatedCrossword);
  }

  triggerChangeDetection(): void {
    const crossword = this.crossword();
    if (crossword) {
      // Create a deep copy of the crossword with new cell references
      const newCrossword = {
        ...crossword,
        cells: crossword.cells.map((row) => row.map((cell) => ({ ...cell }))),
      };
      this.crossword.set(newCrossword);

      // Also update the selected cell reference
      const selectedCell = this.selectedCell();
      if (selectedCell) {
        const newSelectedCell =
          newCrossword.cells[selectedCell.row][selectedCell.col];
        this.selectedCell.set(newSelectedCell);
      }
    }
  }

  clearSelection(): void {
    this.selectedCell.set(null);
    this.editingCell.set(null);
    this.activeTriangle.set(null);
  }

  reset(): void {
    this.crossword.set(null);
    this.isLoading.set(true);
    this.selectedCell.set(null);
    this.editingCell.set(null);
    this.activeTriangle.set(null);
    this.saveStatus.set('idle');
    this.isEditingTitle.set(false);
    this.titleInputValue.set('');
  }
}
