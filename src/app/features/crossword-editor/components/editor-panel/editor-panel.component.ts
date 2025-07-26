import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CrosswordCell,
  CrosswordExportOptions,
} from '../../../../core/models/crossword.model';

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
  readonly exportToPdf = output<CrosswordExportOptions>();
  readonly editorMouseDown = output<void>();
  readonly editorMouseUp = output<void>();
  readonly cellPropertyChange = output<void>();

  readonly exportOptions = signal<CrosswordExportOptions>({
    includeAnswers: false,
  });

  onClearCell(): void {
    this.clearCell.emit();
  }

  onSaveChanges(): void {
    this.saveChanges.emit();
  }

  onExportToPdf(): void {
    this.exportToPdf.emit(this.exportOptions());
  }

  updateExportOption(option: keyof CrosswordExportOptions, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentOptions = this.exportOptions();

    if (option === 'includeAnswers') {
      this.exportOptions.set({
        ...currentOptions,
        [option]: target.checked,
      });
    }
  }

  onEditorMouseDown(): void {
    this.editorMouseDown.emit();
  }

  onEditorMouseUp(): void {
    this.editorMouseUp.emit();
  }

  onCellPropertyChange(): void {
    this.cellPropertyChange.emit();
  }
}
