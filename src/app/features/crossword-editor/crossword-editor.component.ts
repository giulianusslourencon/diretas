import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ClueDirection,
  CrosswordExportOptions,
} from '../../core/models/crossword.model';
import { CrosswordService } from '../../core/services/crossword.service';
import { CrosswordGridComponent } from './components/crossword-grid/crossword-grid.component';
import { EditorPanelComponent } from './components/editor-panel/editor-panel.component';
import {
  CellClickEvent,
  CellRightClickEvent,
  TriangleClickEvent,
  TriangleKeydownEvent,
} from './types/editor.types';
import { NavigationService } from './services/navigation.service';

import { EditorStateService } from './services/editor-state.service';
import { KeyboardHandlerService } from './services/keyboard-handler.service';
import { FocusManagerService } from './services/focus-manager.service';
import { FileOperationsService } from './services/file-operations.service';
import { CellEventHandlerService } from './services/cell-event-handler.service';
import { TitleEditorService } from './services/title-editor.service';

@Component({
  selector: 'app-crossword-editor',
  imports: [CommonModule, CrosswordGridComponent, EditorPanelComponent],
  templateUrl: './crossword-editor.component.html',
  styleUrl: './crossword-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrosswordEditorComponent implements OnInit, OnDestroy {
  private readonly crosswordService = inject(CrosswordService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);
  private readonly editorStateService = inject(EditorStateService);
  private readonly keyboardHandlerService = inject(KeyboardHandlerService);
  private readonly focusManagerService = inject(FocusManagerService);
  private readonly fileOperationsService = inject(FileOperationsService);
  private readonly cellEventHandlerService = inject(CellEventHandlerService);
  private readonly titleEditorService = inject(TitleEditorService);

  // Expose state service signals
  readonly crossword = this.editorStateService.crossword;
  readonly isLoading = this.editorStateService.isLoading;
  readonly selectedCell = this.editorStateService.selectedCell;
  readonly editingCell = this.editorStateService.editingCell;
  readonly activeTriangle = this.editorStateService.activeTriangle;
  readonly saveStatus = this.editorStateService.saveStatus;
  readonly isEditingTitle = this.editorStateService.isEditingTitle;
  readonly titleInputValue = this.editorStateService.titleInputValue;
  readonly navigationDirection = this.navigationService.navigationDirection;

  private isInteractingWithEditor = false;
  private keydownListener?: (event: KeyboardEvent) => void;

  // Computed signal for highlighted cells when a clue cell is selected
  readonly highlightedCells = computed(() => {
    const selectedCell = this.selectedCell();
    const crossword = this.crossword();

    if (
      !selectedCell ||
      !crossword ||
      !this.crosswordService.isClueCell(selectedCell)
    ) {
      return [];
    }

    return this.crosswordService.getHighlightedCells(selectedCell, crossword);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      const crossword = this.crosswordService.getCrosswordById(id);
      if (crossword) {
        this.editorStateService.setCrossword(crossword);
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
      this.editorStateService.setCrossword(newCrossword);
    }

    this.editorStateService.setLoading(false);

    // Initialize cell event handler
    this.cellEventHandlerService.initializeCellCycleStates(
      (row, col, direction) => this.setClueCell(row, col, direction),
      (row, col) => this.clearCell(row, col),
      (row, col, direction) => this.toggleSplitCell(row, col, direction)
    );

    // Add keyboard event listener
    this.keydownListener = (event: KeyboardEvent) => this.onKeyDown(event);
    document.addEventListener('keydown', this.keydownListener);
  }

  ngOnDestroy(): void {
    // Remove keyboard event listener
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
  }

  onCellClick(data: CellClickEvent): void {
    this.cellEventHandlerService.handleCellClick(data);
  }

  onCellDoubleClick(data: CellClickEvent): void {
    this.cellEventHandlerService.handleCellDoubleClick(data);
  }

  onCellRightClick(data: CellRightClickEvent): void {
    this.cellEventHandlerService.handleCellRightClick(data);
  }

  onCellFocus(data: CellClickEvent): void {
    this.cellEventHandlerService.handleCellFocus(data);
  }

  private setClueCell(
    row: number,
    col: number,
    direction: ClueDirection
  ): void {
    // This method is kept for the cell cycle states initialization
    // but delegates to the service
    const crossword = this.crossword();
    if (!crossword) return;

    const newCell = this.cellEventHandlerService[
      'cellEditingService'
    ].setClueCell(row, col, direction, crossword);
    this.editorStateService.updateCrosswordCell(row, col, newCell);
    this.editorStateService.setSelectedCell(newCell);
  }

  private toggleSplitCell(
    row: number,
    col: number,
    direction: 'main' | 'anti' = 'main'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const newCell = this.cellEventHandlerService[
      'cellEditingService'
    ].toggleSplitCell(row, col, direction, crossword);
    this.editorStateService.updateCrosswordCell(row, col, newCell);
  }

  private clearCell(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const newCell = this.cellEventHandlerService[
      'cellEditingService'
    ].clearCell(row, col, crossword);
    this.editorStateService.updateCrosswordCell(row, col, newCell);
  }

  clearSelectedCell(): void {
    const selected = this.selectedCell();
    if (!selected) return;

    this.clearCell(selected.row, selected.col);
    this.editorStateService.setSelectedCell(null);
  }

  saveChanges(): void {
    this.fileOperationsService.saveChanges();
  }

  onKeyDown(event: KeyboardEvent): void {
    this.keyboardHandlerService.handleKeyDown(
      event,
      () => this.fileOperationsService.saveChanges(),
      () => this.showNavigationDirectionFeedback(),
      (key) => this.handleArrowKeyNavigation(key)
    );
  }

  private showNavigationDirectionFeedback(): void {
    // Simple console log for now - could be enhanced with a toast component
    const direction = this.navigationDirection();
    const messages = {
      right: 'Navegação: Direita (→)',
      down: 'Navegação: Baixo (↓)',
      left: 'Navegação: Esquerda (←)',
      up: 'Navegação: Cima (↑)',
    };
    console.log(messages[direction]);
  }

  private handleArrowKeyNavigation(key: string): void {
    const crossword = this.crossword();
    const currentSelected = this.selectedCell();

    if (!crossword) return;

    const newCell = this.navigationService.handleArrowKeyNavigation(
      key,
      currentSelected,
      crossword
    );
    if (newCell && newCell !== currentSelected) {
      this.editorStateService.setSelectedCell(newCell);
      this.editorStateService.setEditingCell(null);
      this.editorStateService.setActiveTriangle(null);
      this.focusManagerService.focusCellIfNeeded(newCell);
    }
  }

  goBack(): void {
    this.router.navigate(['/crosswords']);
  }

  onTriangleClick(data: TriangleClickEvent): void {
    this.cellEventHandlerService.handleTriangleClick(data);
  }

  onTriangleKeydown(data: TriangleKeydownEvent): void {
    this.cellEventHandlerService.handleTriangleKeydown(data);
  }

  onTriangleBlur(): void {
    this.cellEventHandlerService.handleTriangleBlur();
  }

  onClueInputBlur(): void {
    this.cellEventHandlerService.handleClueInputBlur(
      this.isInteractingWithEditor
    );
    if (this.isInteractingWithEditor) {
      this.isInteractingWithEditor = false;
    }
  }

  async onExportToPdf(options: CrosswordExportOptions): Promise<void> {
    await this.fileOperationsService.exportToPdf(options);
  }

  onSaveToFile(): void {
    this.fileOperationsService.saveToFile();
  }

  onEditorPanelMouseDown(): void {
    this.isInteractingWithEditor = true;
  }

  onEditorPanelMouseUp(): void {
    // Reset the flag after a short delay
    setTimeout(() => {
      this.isInteractingWithEditor = false;
    }, 100);
  }

  onCellPropertyChange(): void {
    this.editorStateService.triggerChangeDetection();
  }

  // Methods to update cell properties from editor panel - delegate to services
  updateClueText(text: string): void {
    const selectedCell = this.selectedCell();
    if (!selectedCell) return;

    const newCell = this.cellEventHandlerService[
      'cellEditingService'
    ].updateClueText(selectedCell, text);
    if (newCell) {
      this.editorStateService.updateCrosswordCell(
        selectedCell.row,
        selectedCell.col,
        newCell
      );
    }
  }

  updateClueDirection(direction: ClueDirection): void {
    const selectedCell = this.selectedCell();
    if (!selectedCell) return;

    const newCell = this.cellEventHandlerService[
      'cellEditingService'
    ].updateClueDirection(selectedCell, direction);
    if (newCell) {
      this.editorStateService.updateCrosswordCell(
        selectedCell.row,
        selectedCell.col,
        newCell
      );
    }
  }

  updateTextSize(size: 'small' | 'medium' | 'large'): void {
    const selectedCell = this.selectedCell();
    if (!selectedCell) return;

    const newCell = this.cellEventHandlerService[
      'cellEditingService'
    ].updateTextSize(selectedCell, size);
    if (newCell) {
      this.editorStateService.updateCrosswordCell(
        selectedCell.row,
        selectedCell.col,
        newCell
      );
    }
  }

  updateBoldText(bold: boolean): void {
    const selectedCell = this.selectedCell();
    if (!selectedCell) return;

    const newCell = this.cellEventHandlerService[
      'cellEditingService'
    ].updateBoldText(selectedCell, bold);
    if (newCell) {
      this.editorStateService.updateCrosswordCell(
        selectedCell.row,
        selectedCell.col,
        newCell
      );
    }
  }

  // Title editing methods - delegate to service
  startEditingTitle(): void {
    this.titleEditorService.startEditingTitle();
  }

  cancelTitleEdit(): void {
    this.titleEditorService.cancelTitleEdit();
  }

  saveTitleEdit(): void {
    this.titleEditorService.saveTitleEdit();
  }

  onTitleInputChange(event: Event): void {
    this.titleEditorService.onTitleInputChange(event);
  }

  onTitleInputKeydown(event: KeyboardEvent): void {
    this.keyboardHandlerService.handleTitleKeydown(
      event,
      () => this.titleEditorService.saveTitleEdit(),
      () => this.titleEditorService.cancelTitleEdit()
    );
  }

  onTitleInputBlur(): void {
    this.titleEditorService.onTitleInputBlur();
  }

  onAnswerLetterChange(data: {
    row: number;
    col: number;
    letter: string;
  }): void {
    this.cellEventHandlerService.handleAnswerLetterChange(data);
  }

  onAnswerKeydown(data: {
    event: KeyboardEvent;
    row: number;
    col: number;
  }): void {
    this.keyboardHandlerService.handleAnswerKeydown(
      data.event,
      data.row,
      data.col,
      (row, col) => this.moveToNextCell(row, col),
      (row, col) => this.moveToPreviousCell(row, col)
    );
  }

  private moveToNextCell(currentRow: number, currentCol: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const nextPosition = this.navigationService.moveToNextCell(
      currentRow,
      currentCol,
      crossword
    );
    if (nextPosition) {
      const nextCell = crossword.cells[nextPosition.row][nextPosition.col];
      this.editorStateService.setSelectedCell(nextCell);
      this.focusManagerService.focusCellIfNeeded(nextCell);
    }
  }

  private moveToPreviousCell(currentRow: number, currentCol: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const prevPosition = this.navigationService.moveToPreviousCell(
      currentRow,
      currentCol,
      crossword
    );
    if (prevPosition) {
      const prevCell = crossword.cells[prevPosition.row][prevPosition.col];
      this.editorStateService.setSelectedCell(prevCell);
      this.focusManagerService.focusCellIfNeeded(prevCell);
      // Clear the previous cell
      this.clearCell(prevPosition.row, prevPosition.col);
    }
  }
}
