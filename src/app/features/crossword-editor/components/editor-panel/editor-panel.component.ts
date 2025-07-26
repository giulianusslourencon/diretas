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
  ClueCell,
  SplitCell,
  ClueDirection,
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
  readonly clueTextChange = output<string>();
  readonly clueDirectionChange = output<ClueDirection>();
  readonly textSizeChange = output<'small' | 'medium' | 'large'>();
  readonly boldTextChange = output<boolean>();

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

  // Helper methods for type checking
  isClueCell(cell: CrosswordCell): boolean {
    return cell.type === 'clue';
  }

  isSplitCell(cell: CrosswordCell): boolean {
    return cell.type === 'split';
  }

  getClueCell(cell: CrosswordCell): ClueCell | null {
    return this.isClueCell(cell) ? (cell as ClueCell) : null;
  }

  getSplitCell(cell: CrosswordCell): SplitCell | null {
    return this.isSplitCell(cell) ? (cell as SplitCell) : null;
  }

  // Methods to handle form changes
  onClueTextChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.clueTextChange.emit(target.value);
  }

  onClueDirectionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.clueDirectionChange.emit(target.value as ClueDirection);
  }

  onTextSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.textSizeChange.emit(target.value as 'small' | 'medium' | 'large');
  }

  onBoldTextChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.boldTextChange.emit(target.checked);
  }
}
