import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordCell } from '../../../../core/models/crossword.model';

@Component({
  selector: 'app-editor-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './editor-panel.component.html',
  styleUrl: './editor-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorPanelComponent {
  readonly selectedCell = input<CrosswordCell | null>(null);

  readonly clearCell = output<void>();
  readonly saveChanges = output<void>();

  onClearCell(): void {
    this.clearCell.emit();
  }

  onSaveChanges(): void {
    this.saveChanges.emit();
  }
}
