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
  readonly activeTriangle = input<ActiveTriangle | null>(null);

  readonly cellClick = output<CellClickEvent>();
  readonly cellRightClick = output<CellRightClickEvent>();
  readonly cellFocus = output<CellClickEvent>();
  readonly triangleClick = output<TriangleClickEvent>();
  readonly triangleKeydown = output<TriangleKeydownEvent>();
  readonly triangleBlur = output<void>();
  readonly clueInputBlur = output<void>();

  onCellClick(data: CellClickEvent): void {
    this.cellClick.emit(data);
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

  isCellSelected(cell: CrosswordCell): boolean {
    const selected = this.selectedCell();
    return selected === cell;
  }
}
