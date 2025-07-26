import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CrosswordService } from '../../core/services/crossword.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import {
  CrosswordGrid,
  CrosswordCell,
  CrosswordExportOptions,
  ClueDirection,
} from '../../core/models/crossword.model';
import { CrosswordGridComponent, EditorPanelComponent } from './components';
import {
  ActiveTriangle,
  CellClickEvent,
  CellRightClickEvent,
  TriangleClickEvent,
  TriangleKeydownEvent,
  CellCycleState,
} from './types/editor.types';

@Component({
  selector: 'app-crossword-editor',
  imports: [CommonModule, CrosswordGridComponent, EditorPanelComponent],
  templateUrl: './crossword-editor.component.html',
  styleUrl: './crossword-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrosswordEditorComponent implements OnInit {
  private readonly crosswordService = inject(CrosswordService);
  private readonly pdfExportService = inject(PdfExportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly crossword = signal<CrosswordGrid | null>(null);
  readonly isLoading = signal(true);
  readonly selectedCell = signal<CrosswordCell | null>(null);
  readonly editingCell = signal<CrosswordCell | null>(null);
  readonly activeTriangle = signal<ActiveTriangle | null>(null);
  private isInteractingWithEditor = false;

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

  onCellClick(data: CellClickEvent): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    const currentSelected = this.selectedCell();

    // Only update selection if it's a different cell
    if (
      !currentSelected ||
      currentSelected.row !== cell.row ||
      currentSelected.col !== cell.col
    ) {
      this.selectedCell.set(cell);
      // Don't auto-focus on single click for clue cells
    }
    // Don't focus input on single click, even if same cell
  }

  onCellDoubleClick(data: CellClickEvent): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];

    // Select the cell first if not already selected
    this.selectedCell.set(cell);

    // Set editing state and focus clue input if it's a clue cell
    if (cell.isClueCell) {
      this.editingCell.set(cell);
      this.focusClueInput();
    }
  }

  onCellRightClick(data: CellRightClickEvent): void {
    data.event.preventDefault(); // Prevent context menu

    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    this.selectedCell.set(cell);

    // Cycle through cell types: regular -> clue cell -> split cell (main) -> split cell (anti) -> regular
    this.cycleCellType(data.row, data.col);
  }

  // Cell cycle configuration following OCP - extensible without modification
  private readonly cellCycleStates: CellCycleState[] = [
    // Regular cell -> Clue cell
    {
      matches: (cell) => !cell.isClueCell && !cell.isSplitCell,
      action: (row, col) => this.setClueCell(row, col, 'horizontal'),
      description: 'Regular cell -> Clue cell',
    },
    // Clue cell -> Split cell (main diagonal)
    {
      matches: (cell) => cell.isClueCell,
      action: (row, col) => {
        this.clearCell(row, col);
        this.toggleSplitCell(row, col, 'main');
      },
      description: 'Clue cell -> Split cell (main diagonal)',
    },
    // Split cell (main diagonal) -> Split cell (anti diagonal)
    {
      matches: (cell) => cell.isSplitCell && cell.diagonalDirection === 'main',
      action: (row, col) => this.toggleSplitCell(row, col, 'anti'),
      description: 'Split cell (main diagonal) -> Split cell (anti diagonal)',
    },
    // Split cell (anti diagonal) -> Regular cell
    {
      matches: (cell) => cell.isSplitCell && cell.diagonalDirection === 'anti',
      action: (row, col) => this.clearCell(row, col),
      description: 'Split cell (anti diagonal) -> Regular cell',
    },
  ];

  private cycleCellType(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];

    // Find the matching state and execute its action
    const currentState = this.cellCycleStates.find((state) =>
      state.matches(cell)
    );
    if (currentState) {
      currentState.action(row, col);
    } else {
      // Fallback: if no state matches, reset to regular cell
      this.clearCell(row, col);
    }
  }

  // Helper methods for creating common cycle state patterns
  // These methods provide a foundation for future extensions
  private createSplitCellState(
    fromDirection: 'main' | 'anti',
    toDirection: 'main' | 'anti' | null,
    description: string
  ): CellCycleState {
    return {
      matches: (cell) =>
        cell.isSplitCell && cell.diagonalDirection === fromDirection,
      action: (row, col) => {
        if (toDirection === null) {
          this.clearCell(row, col);
        } else {
          this.toggleSplitCell(row, col, toDirection);
        }
      },
      description,
    };
  }

  onCellFocus(data: CellClickEvent): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    this.selectedCell.set(cell);
  }

  private setClueCell(
    row: number,
    col: number,
    direction: ClueDirection
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

  private toggleSplitCell(
    row: number,
    col: number,
    direction: 'main' | 'anti' = 'main'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];

    if (!cell.isSplitCell) {
      // Convert to split cell
      cell.isSplitCell = true;
      cell.isClueCell = false;
      cell.letter = '';
      cell.clueText = '';
      cell.clueDirection = undefined;

      // Initialize with empty letters and set diagonal direction
      cell.topLetter = '';
      cell.bottomLetter = '';
      cell.diagonalDirection = direction;
    } else {
      // Just change the diagonal direction
      cell.diagonalDirection = direction;
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
    cell.diagonalDirection = undefined;

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

  onTriangleClick(data: TriangleClickEvent): void {
    data.event.stopPropagation();

    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    this.selectedCell.set(cell);
    this.activeTriangle.set({
      row: data.row,
      col: data.col,
      triangle: data.triangle,
    });

    // Auto-focus the triangle input field
    this.focusTriangleInput();
  }

  onTriangleKeydown(data: TriangleKeydownEvent): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const { event, row, col, triangle } = data;

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

      // Simple navigation: move to bottom triangle if on top, otherwise stay
      if (triangle === 'top') {
        this.activeTriangle.set({ row, col, triangle: 'bottom' });
        this.focusTriangleInput();
      }
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
      // Simple arrow navigation - just prevent default
      event.preventDefault();
    } else if (event.key === 'Tab') {
      // Tab to next triangle
      event.preventDefault();
      if (triangle === 'top') {
        this.activeTriangle.set({ row, col, triangle: 'bottom' });
        this.focusTriangleInput();
      }
    }
  }

  onTriangleBlur(): void {
    // Clear active triangle when input loses focus
    setTimeout(() => {
      if (!document.activeElement?.classList.contains('triangle-input')) {
        this.activeTriangle.set(null);
        this.selectedCell.set(null);
      }
    }, 100);
  }

  onClueInputBlur(): void {
    // Always clear editing state when input loses focus
    this.editingCell.set(null);

    // Trigger change detection by updating the crossword signal
    this.onCellPropertyChange();

    // Don't deselect if we're interacting with the editor panel
    if (this.isInteractingWithEditor) {
      this.isInteractingWithEditor = false;
      return;
    }

    // Use a timeout to check if focus moved to the editor panel
    setTimeout(() => {
      if (!this.isInteractingWithEditor) {
        this.selectedCell.set(null);
      }
    }, 50);
  }

  // Helper methods
  private focusClueInput(): void {
    setTimeout(() => {
      // Find the clue input in the currently selected cell
      const selectedCell = this.selectedCell();
      if (selectedCell) {
        const cellSelector = `[data-cell="${selectedCell.row}-${selectedCell.col}"] .clue-input`;
        const clueInput = document.querySelector(
          cellSelector
        ) as HTMLInputElement;
        if (clueInput) {
          clueInput.focus();
          clueInput.select();
        }
      }
    }, 10); // Slightly longer delay to ensure DOM updates
  }

  private focusTriangleInput(): void {
    setTimeout(() => {
      const input = document.querySelector(
        '.triangle-input'
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  async onExportToPdf(options: CrosswordExportOptions): Promise<void> {
    const crossword = this.crossword();
    if (!crossword) {
      console.error('No crossword available for export');
      return;
    }

    try {
      await this.pdfExportService.exportCrosswordToPdf(crossword, options);
    } catch (error) {
      console.error('Failed to export crossword to PDF:', error);
      // You could add a toast notification here to inform the user
    }
  }

  onEditorPanelMouseDown(): void {
    this.isInteractingWithEditor = true;
  }

  onEditorPanelMouseUp(): void {
    // Reset the flag after a short delay
    setTimeout(() => {
      this.isInteractingWithEditor = false;
    }, 100);
  }

  onCellPropertyChange(): void {
    // Trigger change detection when cell properties are modified
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
}
