import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CrosswordGrid,
  CrosswordCell,
} from '../../../../core/models/crossword.model';
import { CrosswordCellComponent } from '../crossword-cell/crossword-cell.component';
import {
  ActiveTriangle,
  CellClickEvent,
  CellRightClickEvent,
  TriangleClickEvent,
  TriangleKeydownEvent,
} from '../../types/editor.types';

@Component({
  selector: 'app-crossword-grid',
  imports: [CommonModule, CrosswordCellComponent],
  templateUrl: './crossword-grid.component.html',
  styleUrl: './crossword-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrosswordGridComponent {
  readonly crossword = input.required<CrosswordGrid>();
  readonly selectedCell = input<CrosswordCell | null>(null);
  readonly editingCell = input<CrosswordCell | null>(null);
  readonly activeTriangle = input<ActiveTriangle | null>(null);
  readonly highlightedCells = input<CrosswordCell[]>([]);

  readonly cellClick = output<CellClickEvent>();
  readonly cellDoubleClick = output<CellClickEvent>();
  readonly cellRightClick = output<CellRightClickEvent>();
  readonly cellFocus = output<CellClickEvent>();
  readonly triangleClick = output<TriangleClickEvent>();
  readonly triangleKeydown = output<TriangleKeydownEvent>();
  readonly triangleBlur = output<void>();
  readonly clueInputBlur = output<void>();
  readonly clueInputChange = output<void>();
  readonly answerLetterChange = output<{
    row: number;
    col: number;
    letter: string;
  }>();

  onCellClick(data: CellClickEvent): void {
    this.cellClick.emit(data);
  }

  onCellDoubleClick(data: CellClickEvent): void {
    this.cellDoubleClick.emit(data);
  }

  onCellRightClick(data: CellRightClickEvent): void {
    this.cellRightClick.emit(data);
  }

  onCellFocus(data: CellClickEvent): void {
    this.cellFocus.emit(data);
  }

  onTriangleClick(data: TriangleClickEvent): void {
    this.triangleClick.emit(data);
  }

  onTriangleKeydown(data: TriangleKeydownEvent): void {
    this.triangleKeydown.emit(data);
  }

  onTriangleBlur(): void {
    this.triangleBlur.emit();
  }

  onClueInputBlur(): void {
    this.clueInputBlur.emit();
  }

  onClueInputChange(): void {
    this.clueInputChange.emit();
  }

  isCellSelected(cell: CrosswordCell): boolean {
    const selected = this.selectedCell();
    return selected === cell;
  }

  isCellEditing(cell: CrosswordCell): boolean {
    const editing = this.editingCell();
    return editing === cell;
  }

  isCellHighlighted(cell: CrosswordCell): boolean {
    const highlighted = this.highlightedCells();
    return highlighted.includes(cell);
  }

  onAnswerLetterChange(data: {
    row: number;
    col: number;
    letter: string;
  }): void {
    this.answerLetterChange.emit(data);
  }
}
