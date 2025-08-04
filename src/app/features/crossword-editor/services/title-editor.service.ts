import { Injectable, inject } from '@angular/core';
import { CrosswordService } from '../../../core/services/crossword.service';
import { EditorStateService } from './editor-state.service';
import { FocusManagerService } from './focus-manager.service';

@Injectable({
  providedIn: 'root'
})
export class TitleEditorService {
  private readonly crosswordService = inject(CrosswordService);
  private readonly editorStateService = inject(EditorStateService);
  private readonly focusManagerService = inject(FocusManagerService);

  startEditingTitle(): void {
    const crossword = this.editorStateService.crossword();
    if (crossword) {
      this.editorStateService.setTitleInputValue(crossword.title);
      this.editorStateService.setEditingTitle(true);
      // Focus the input after the view updates
      this.focusManagerService.focusTitleInput();
    }
  }

  cancelTitleEdit(): void {
    this.editorStateService.setEditingTitle(false);
    this.editorStateService.setTitleInputValue('');
  }

  saveTitleEdit(): void {
    const crossword = this.editorStateService.crossword();
    const newTitle = this.editorStateService.titleInputValue().trim();

    if (crossword && newTitle && newTitle !== crossword.title) {
      this.editorStateService.updateCrosswordTitle(newTitle);
      this.crosswordService.updateCrossword({ ...crossword, title: newTitle });
    }

    this.editorStateService.setEditingTitle(false);
    this.editorStateService.setTitleInputValue('');
  }

  onTitleInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.editorStateService.setTitleInputValue(target.value);
  }

  onTitleInputBlur(): void {
    // Save the title when the input loses focus
    this.saveTitleEdit();
  }
}
