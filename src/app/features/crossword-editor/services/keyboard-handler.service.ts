import { Injectable, inject } from '@angular/core';
import { KeyboardUtilsService } from '../../../core/services/keyboard-utils.service';
import { NavigationService } from './navigation.service';
import { EditorStateService } from './editor-state.service';

@Injectable({
  providedIn: 'root',
})
export class KeyboardHandlerService {
  private readonly keyboardUtilsService = inject(KeyboardUtilsService);
  private readonly navigationService = inject(NavigationService);
  private readonly editorStateService = inject(EditorStateService);

  handleKeyDown(
    event: KeyboardEvent,
    onSave: () => void,
    onShowNavigationFeedback: () => void,
    onHandleArrowNavigation: (key: string) => void
  ): void {
    // Handle Ctrl+S (or Cmd+S on Mac) to save
    if (this.keyboardUtilsService.isSaveCommand(event)) {
      event.preventDefault();
      onSave();
      return;
    }

    // Handle Space to toggle navigation direction
    if (
      event.key === ' ' &&
      !this.isEditingInputExceptAnswerCells() &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      this.navigationService.toggleNavigationDirection();
      onShowNavigationFeedback();
      return;
    }

    // Handle arrow key navigation
    if (this.keyboardUtilsService.isArrowKey(event.key)) {
      if (
        this.isEditingInputExceptAnswerCells() ||
        this.keyboardUtilsService.hasModifierKeys(event)
      ) {
        return;
      }

      event.preventDefault();
      onHandleArrowNavigation(event.key);
    }
  }

  handleAnswerKeydown(
    event: KeyboardEvent,
    row: number,
    col: number,
    onMoveToNext: (row: number, col: number) => void,
    onMoveToPrevious: (row: number, col: number) => void
  ): void {
    // Don't handle arrow keys here - let the global handler do it
    if (this.keyboardUtilsService.isArrowKey(event.key)) {
      return;
    }

    // Handle letter input - automatically move to next cell after typing
    if (this.keyboardUtilsService.isLetterKey(event.key)) {
      setTimeout(() => {
        onMoveToNext(row, col);
      }, 0);
    }
    // Handle backspace - move to previous cell if current cell is empty
    else if (event.key === 'Backspace') {
      const crossword = this.editorStateService.crossword();
      if (crossword) {
        const cell = crossword.cells[row][col];
        // Check if cell is empty (assuming isAnswerCell method exists)
        if (cell && 'letter' in cell && !cell.letter) {
          event.preventDefault();
          onMoveToPrevious(row, col);
        }
      }
    }
  }

  handleTitleKeydown(
    event: KeyboardEvent,
    onSave: () => void,
    onCancel: () => void
  ): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  private isEditingInputExceptAnswerCells(): boolean {
    return (
      this.keyboardUtilsService.isFocusOnSpecificInput([
        'clue-input',
        'triangle-input',
        'title-input',
      ]) || this.keyboardUtilsService.isFocusOnInput(['cell-input'])
    );
  }
}
