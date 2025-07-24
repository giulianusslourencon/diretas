import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordCell } from '../../../../core/models/crossword.model';
import { ActiveTriangle } from '../../types/editor.types';

@Component({
  selector: 'app-crossword-cell',
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-cell.component.html',
  styleUrl: './crossword-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrosswordCellComponent {
  readonly cell = input.required<CrosswordCell>();
  readonly rowIndex = input.required<number>();
  readonly colIndex = input.required<number>();
  readonly isSelected = input<boolean>(false);
  readonly isEditing = input<boolean>(false);
  readonly activeTriangle = input<ActiveTriangle | null>(null);

  readonly cellClick = output<{ row: number; col: number }>();
  readonly cellDoubleClick = output<{ row: number; col: number }>();
  readonly cellRightClick = output<{
    event: MouseEvent;
    row: number;
    col: number;
  }>();
  readonly cellFocus = output<{ row: number; col: number }>();
  readonly triangleClick = output<{
    row: number;
    col: number;
    triangle: 'top' | 'bottom';
    event: Event;
  }>();
  readonly triangleKeydown = output<{
    event: KeyboardEvent;
    row: number;
    col: number;
    triangle: 'top' | 'bottom';
  }>();
  readonly triangleBlur = output<void>();
  readonly clueInputBlur = output<void>();
  readonly clueInputChange = output<void>();

  onCellClick(): void {
    this.cellClick.emit({ row: this.rowIndex(), col: this.colIndex() });
  }

  onCellDoubleClick(): void {
    this.cellDoubleClick.emit({ row: this.rowIndex(), col: this.colIndex() });
  }

  onCellRightClick(event: MouseEvent): void {
    this.cellRightClick.emit({
      event,
      row: this.rowIndex(),
      col: this.colIndex(),
    });
  }

  onCellFocus(): void {
    this.cellFocus.emit({ row: this.rowIndex(), col: this.colIndex() });
  }

  onTriangleClick(triangle: 'top' | 'bottom', event: Event): void {
    this.triangleClick.emit({
      row: this.rowIndex(),
      col: this.colIndex(),
      triangle,
      event,
    });
  }

  onTriangleKeydown(event: KeyboardEvent, triangle: 'top' | 'bottom'): void {
    this.triangleKeydown.emit({
      event,
      row: this.rowIndex(),
      col: this.colIndex(),
      triangle,
    });
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

  isTriangleActive(triangle: 'top' | 'bottom'): boolean {
    const active = this.activeTriangle();
    return (
      active?.row === this.rowIndex() &&
      active?.col === this.colIndex() &&
      active?.triangle === triangle
    );
  }

  isActiveTriangleCell(): boolean {
    const active = this.activeTriangle();
    return active?.row === this.rowIndex() && active?.col === this.colIndex();
  }
}
