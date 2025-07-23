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
import {
  CrosswordGrid,
  CrosswordCell,
} from '../../core/models/crossword.model';
import { CrosswordGridComponent, EditorPanelComponent } from './components';
import {
  ActiveTriangle,
  CellClickEvent,
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
export class CrosswordEditorComponent implements OnInit {
  private readonly crosswordService = inject(CrosswordService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly crossword = signal<CrosswordGrid | null>(null);
  readonly isLoading = signal(true);
  readonly selectedCell = signal<CrosswordCell | null>(null);
  readonly activeTriangle = signal<ActiveTriangle | null>(null);

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
    this.selectedCell.set(cell);

    // Auto-focus clue input if it's a clue cell
    if (cell.isClueCell) {
      this.focusClueInput();
    }
  }

  onCellRightClick(data: CellRightClickEvent): void {
    data.event.preventDefault(); // Prevent context menu

    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[data.row][data.col];
    this.selectedCell.set(cell);

    // Cycle through cell types: regular -> horizontal clue -> vertical clue -> up clue -> left clue -> split cell -> regular
    this.cycleCellType(data.row, data.col);
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
      // Vertical clue -> Up clue
      this.setClueCell(row, col, 'up');
    } else if (cell.isClueCell && cell.clueDirection === 'up') {
      // Up clue -> Left clue
      this.setClueCell(row, col, 'left');
    } else if (cell.isClueCell && cell.clueDirection === 'left') {
      // Left clue -> Split cell (main diagonal)
      this.clearCell(row, col);
      this.toggleSplitCell(row, col, 'main');
    } else if (cell.isSplitCell && cell.diagonalDirection === 'main') {
      // Split cell (main diagonal) -> Split cell (anti diagonal)
      this.toggleSplitCell(row, col, 'anti');
    } else if (cell.isSplitCell && cell.diagonalDirection === 'anti') {
      // Split cell (anti diagonal) -> Regular cell
      this.clearCell(row, col);
    }
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
    direction: 'horizontal' | 'vertical' | 'up' | 'left'
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
    // Simply deselect the cell when input loses focus
    this.selectedCell.set(null);
  }

  // Helper methods
  private focusClueInput(): void {
    setTimeout(() => {
      const clueInput = document.querySelector(
        '.clue-input'
      ) as HTMLInputElement;
      if (clueInput) {
        clueInput.focus();
        clueInput.select();
      }
    }, 0);
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
}
