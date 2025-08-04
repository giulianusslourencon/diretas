import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ClueDirection,
  CrosswordCell,
  CrosswordExportOptions,
  CrosswordGrid,
} from '../../core/models/crossword.model';
import { CrosswordService } from '../../core/services/crossword.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { FileManagerService } from '../../core/services/file-manager.service';
import { CrosswordGridComponent, EditorPanelComponent } from './components';
import {
  ActiveTriangle,
  CellClickEvent,
  CellCycleState,
  CellRightClickEvent,
  TriangleClickEvent,
  TriangleKeydownEvent,
} from './types/editor.types';

@Component({
  selector: 'app-crossword-editor',
  imports: [CommonModule, CrosswordGridComponent, EditorPanelComponent],
  templateUrl: './crossword-editor.component.html',
  styleUrl: './crossword-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrosswordEditorComponent implements OnInit, OnDestroy {
  private readonly crosswordService = inject(CrosswordService);
  private readonly pdfExportService = inject(PdfExportService);
  private readonly fileManagerService = inject(FileManagerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly crossword = signal<CrosswordGrid | null>(null);
  readonly isLoading = signal(true);
  readonly selectedCell = signal<CrosswordCell | null>(null);
  readonly editingCell = signal<CrosswordCell | null>(null);
  readonly activeTriangle = signal<ActiveTriangle | null>(null);
  readonly saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  readonly isEditingTitle = signal(false);
  readonly titleInputValue = signal('');
  private isInteractingWithEditor = false;
  private keydownListener?: (event: KeyboardEvent) => void;

  // Computed signal for highlighted cells when a clue cell is selected
  readonly highlightedCells = computed(() => {
    const selectedCell = this.selectedCell();
    const crossword = this.crossword();

    if (
      !selectedCell ||
      !crossword ||
      !this.crosswordService.isClueCell(selectedCell)
    ) {
      return [];
    }

    return this.crosswordService.getHighlightedCells(selectedCell, crossword);
  });

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

    // Add keyboard event listener
    this.keydownListener = (event: KeyboardEvent) => this.onKeyDown(event);
    document.addEventListener('keydown', this.keydownListener);
  }

  ngOnDestroy(): void {
    // Remove keyboard event listener
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
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
    if (this.crosswordService.isClueCell(cell)) {
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
      matches: (cell) => this.crosswordService.isAnswerCell(cell),
      action: (row, col) => this.setClueCell(row, col, 'right'),
      description: 'Regular cell -> Clue cell',
    },
    // Clue cell -> Split cell (main diagonal)
    {
      matches: (cell) => this.crosswordService.isClueCell(cell),
      action: (row, col) => {
        this.clearCell(row, col);
        this.toggleSplitCell(row, col, 'main');
      },
      description: 'Clue cell -> Split cell (main diagonal)',
    },
    // Split cell (main diagonal) -> Split cell (anti diagonal)
    {
      matches: (cell) =>
        this.crosswordService.isSplitCell(cell) &&
        cell.diagonalDirection === 'main',
      action: (row, col) => this.toggleSplitCell(row, col, 'anti'),
      description: 'Split cell (main diagonal) -> Split cell (anti diagonal)',
    },
    // Split cell (anti diagonal) -> Regular cell
    {
      matches: (cell) =>
        this.crosswordService.isSplitCell(cell) &&
        cell.diagonalDirection === 'anti',
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
        this.crosswordService.isSplitCell(cell) &&
        cell.diagonalDirection === fromDirection,
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

    const currentCell = crossword.cells[row][col];
    const clueText = this.crosswordService.isClueCell(currentCell)
      ? currentCell.clueText
      : 'Digite a dica aqui';

    const newCell = this.crosswordService.createClueCell(
      currentCell.id,
      row,
      col,
      clueText,
      direction
    );

    crossword.cells[row][col] = newCell;
    this.crossword.set({ ...crossword });
    this.selectedCell.set(newCell);
  }

  private toggleSplitCell(
    row: number,
    col: number,
    direction: 'main' | 'anti' = 'main'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const currentCell = crossword.cells[row][col];
    let topLetter = '';
    let bottomLetter = '';

    // Preserve letters if already a split cell
    if (this.crosswordService.isSplitCell(currentCell)) {
      topLetter = currentCell.topLetter;
      bottomLetter = currentCell.bottomLetter;
    }

    const newCell = this.crosswordService.createSplitCell(
      currentCell.id,
      row,
      col,
      topLetter,
      bottomLetter,
      direction
    );

    crossword.cells[row][col] = newCell;
    this.crossword.set({ ...crossword });
  }

  private clearCell(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const currentCell = crossword.cells[row][col];
    const newCell = this.crosswordService.createAnswerCell(
      currentCell.id,
      row,
      col,
      ''
    );

    crossword.cells[row][col] = newCell;
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
      this.saveStatus.set('saving');
      try {
        this.crosswordService.updateCrossword(current);
        this.saveStatus.set('saved');

        // Reset status after 2 seconds
        setTimeout(() => {
          this.saveStatus.set('idle');
        }, 2000);
      } catch (error) {
        console.error('Failed to save crossword:', error);
        this.saveStatus.set('error');

        // Reset status after 3 seconds for error
        setTimeout(() => {
          this.saveStatus.set('idle');
        }, 3000);
      }
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle Ctrl+S (or Cmd+S on Mac) to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); // Prevent browser's default save dialog
      this.saveChanges();
      return;
    }

    // Handle arrow key navigation
    if (this.isArrowKey(event.key)) {
      // Don't handle arrow keys if user is editing a clue input or triangle input
      // But DO handle them for answer cell inputs (cell-input)
      const activeElement = document.activeElement;
      if (
        activeElement?.classList.contains('clue-input') ||
        activeElement?.classList.contains('triangle-input')
      ) {
        return;
      }

      event.preventDefault();
      this.handleArrowKeyNavigation(event.key);
    }
  }

  private isArrowKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
  }

  private handleArrowKeyNavigation(key: string): void {
    const crossword = this.crossword();
    const currentSelected = this.selectedCell();

    if (!crossword || !currentSelected) {
      // If no cell is selected, select the first cell (0,0)
      if (crossword) {
        const firstCell = crossword.cells[0][0];
        this.selectedCell.set(firstCell);
        this.focusCellIfNeeded(firstCell);
      }
      return;
    }

    const { row, col } = currentSelected;
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
      const newCell = crossword.cells[newRow][newCol];
      this.selectedCell.set(newCell);

      // Clear any active editing states when navigating
      this.editingCell.set(null);
      this.activeTriangle.set(null);

      // Focus the new cell if it's an answer cell
      this.focusCellIfNeeded(newCell);
    }
  }

  private focusCellIfNeeded(cell: CrosswordCell): void {
    // Only auto-focus answer cells for immediate typing
    if (this.crosswordService.isAnswerCell(cell)) {
      setTimeout(() => {
        const cellSelector = `[data-cell="${cell.row}-${cell.col}"] .cell-input`;
        const input = document.querySelector(cellSelector) as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 10);
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
      if (!this.crosswordService.isSplitCell(cell)) return;

      const letter = event.key.toUpperCase();
      const newTopLetter = triangle === 'top' ? letter : cell.topLetter;
      const newBottomLetter =
        triangle === 'bottom' ? letter : cell.bottomLetter;

      const newCell = this.crosswordService.createSplitCell(
        cell.id,
        row,
        col,
        newTopLetter,
        newBottomLetter,
        cell.diagonalDirection
      );

      crossword.cells[row][col] = newCell;
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
      if (!this.crosswordService.isSplitCell(cell)) return;

      const newTopLetter = triangle === 'top' ? '' : cell.topLetter;
      const newBottomLetter = triangle === 'bottom' ? '' : cell.bottomLetter;

      const newCell = this.crosswordService.createSplitCell(
        cell.id,
        row,
        col,
        newTopLetter,
        newBottomLetter,
        cell.diagonalDirection
      );

      crossword.cells[row][col] = newCell;
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

  onSaveToFile(): void {
    const crossword = this.crossword();
    if (!crossword) {
      console.error('No crossword available for file export');
      return;
    }

    try {
      this.fileManagerService.saveToFile(crossword);
    } catch (error) {
      console.error('Failed to save crossword to file:', error);
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

  // Methods to update cell properties from editor panel
  updateClueText(text: string): void {
    const crossword = this.crossword();
    const selectedCell = this.selectedCell();
    if (
      !crossword ||
      !selectedCell ||
      !this.crosswordService.isClueCell(selectedCell)
    )
      return;

    const newCell = this.crosswordService.createClueCell(
      selectedCell.id,
      selectedCell.row,
      selectedCell.col,
      text,
      selectedCell.clueDirection
    );
    newCell.boldClueText = selectedCell.boldClueText;
    newCell.textSize = selectedCell.textSize;

    crossword.cells[selectedCell.row][selectedCell.col] = newCell;
    this.crossword.set({ ...crossword });
    this.selectedCell.set(newCell);
  }

  updateClueDirection(direction: ClueDirection): void {
    const crossword = this.crossword();
    const selectedCell = this.selectedCell();
    if (
      !crossword ||
      !selectedCell ||
      !this.crosswordService.isClueCell(selectedCell)
    )
      return;

    const newCell = this.crosswordService.createClueCell(
      selectedCell.id,
      selectedCell.row,
      selectedCell.col,
      selectedCell.clueText,
      direction
    );
    newCell.boldClueText = selectedCell.boldClueText;
    newCell.textSize = selectedCell.textSize;

    crossword.cells[selectedCell.row][selectedCell.col] = newCell;
    this.crossword.set({ ...crossword });
    this.selectedCell.set(newCell);
  }

  updateTextSize(size: 'small' | 'medium' | 'large'): void {
    const crossword = this.crossword();
    const selectedCell = this.selectedCell();
    if (
      !crossword ||
      !selectedCell ||
      !this.crosswordService.isClueCell(selectedCell)
    )
      return;

    const newCell = this.crosswordService.createClueCell(
      selectedCell.id,
      selectedCell.row,
      selectedCell.col,
      selectedCell.clueText,
      selectedCell.clueDirection
    );
    newCell.boldClueText = selectedCell.boldClueText;
    newCell.textSize = size;

    crossword.cells[selectedCell.row][selectedCell.col] = newCell;
    this.crossword.set({ ...crossword });
    this.selectedCell.set(newCell);
  }

  updateBoldText(bold: boolean): void {
    const crossword = this.crossword();
    const selectedCell = this.selectedCell();
    if (
      !crossword ||
      !selectedCell ||
      !this.crosswordService.isClueCell(selectedCell)
    )
      return;

    const newCell = this.crosswordService.createClueCell(
      selectedCell.id,
      selectedCell.row,
      selectedCell.col,
      selectedCell.clueText,
      selectedCell.clueDirection
    );
    newCell.boldClueText = bold;
    newCell.textSize = selectedCell.textSize;

    crossword.cells[selectedCell.row][selectedCell.col] = newCell;
    this.crossword.set({ ...crossword });
    this.selectedCell.set(newCell);
  }

  // Title editing methods
  startEditingTitle(): void {
    const crossword = this.crossword();
    if (crossword) {
      this.titleInputValue.set(crossword.title);
      this.isEditingTitle.set(true);
      // Focus the input after the view updates
      setTimeout(() => {
        const input = document.getElementById(
          'title-input'
        ) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    }
  }

  cancelTitleEdit(): void {
    this.isEditingTitle.set(false);
    this.titleInputValue.set('');
  }

  saveTitleEdit(): void {
    const crossword = this.crossword();
    const newTitle = this.titleInputValue().trim();

    if (crossword && newTitle && newTitle !== crossword.title) {
      const updatedCrossword = { ...crossword, title: newTitle };
      this.crossword.set(updatedCrossword);
      this.crosswordService.updateCrossword(updatedCrossword);
    }

    this.isEditingTitle.set(false);
    this.titleInputValue.set('');
  }

  onTitleInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.titleInputValue.set(target.value);
  }

  onTitleInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveTitleEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelTitleEdit();
    }
  }

  onTitleInputBlur(): void {
    // Save the title when the input loses focus
    this.saveTitleEdit();
  }

  onAnswerLetterChange(data: {
    row: number;
    col: number;
    letter: string;
  }): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const { row, col, letter } = data;
    const cell = crossword.cells[row][col];

    if (!this.crosswordService.isAnswerCell(cell)) return;

    const newCell = this.crosswordService.createAnswerCell(
      cell.id,
      row,
      col,
      letter
    );

    crossword.cells[row][col] = newCell;
    this.crossword.set({ ...crossword });

    // Update selected cell if it's the same cell
    const selectedCell = this.selectedCell();
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      this.selectedCell.set(newCell);
    }
  }

  onAnswerKeydown(data: {
    event: KeyboardEvent;
    row: number;
    col: number;
  }): void {
    const { event, row, col } = data;
    const crossword = this.crossword();
    if (!crossword) return;

    // Don't handle arrow keys here - let the global handler do it
    // This prevents double navigation
    if (this.isArrowKey(event.key)) {
      return; // Let the global @HostListener handle arrow keys
    }

    // Handle letter input - automatically move to next cell after typing
    if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
      // Let the input event handle the letter change first
      setTimeout(() => {
        // Move to the next logical cell (right, then down to next row)
        const newCol = col + 1;
        if (newCol < crossword.cols) {
          // Move right
          const nextCell = crossword.cells[row][newCol];
          this.selectedCell.set(nextCell);
          this.focusCellIfNeeded(nextCell);
        } else if (row + 1 < crossword.rows) {
          // Move to beginning of next row
          const nextCell = crossword.cells[row + 1][0];
          this.selectedCell.set(nextCell);
          this.focusCellIfNeeded(nextCell);
        }
      }, 0);
    }
    // Handle backspace - move to previous cell if current cell is empty
    else if (event.key === 'Backspace') {
      const cell = crossword.cells[row][col];
      if (this.crosswordService.isAnswerCell(cell) && !cell.letter) {
        event.preventDefault();
        // Move to previous cell
        const newCol = col - 1;
        if (newCol >= 0) {
          // Move left
          const prevCell = crossword.cells[row][newCol];
          this.selectedCell.set(prevCell);
          this.focusCellIfNeeded(prevCell);
          // Clear the previous cell
          this.clearCell(row, newCol);
        } else if (row - 1 >= 0) {
          // Move to end of previous row
          const prevCell = crossword.cells[row - 1][crossword.cols - 1];
          this.selectedCell.set(prevCell);
          this.focusCellIfNeeded(prevCell);
          // Clear the previous cell
          this.clearCell(row - 1, crossword.cols - 1);
        }
      }
    }
  }
}
