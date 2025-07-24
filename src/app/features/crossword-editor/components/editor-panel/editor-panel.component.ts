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

  readonly exportOptions = signal<CrosswordExportOptions>({
    includeAnswers: false,
    includeClues: true,
    paperSize: 'A4',
    orientation: 'portrait',
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

    if (option === 'includeAnswers' || option === 'includeClues') {
      this.exportOptions.set({
        ...currentOptions,
        [option]: target.checked,
      });
    }
  }
}
