import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordService } from '../../core/services/crossword.service';
import {
  CrosswordGrid,
  CrosswordCell,
} from '../../core/models/crossword.model';

type Tool = 'clue-horizontal' | 'clue-vertical' | 'clear';

@Component({
  selector: 'app-crossword-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-editor.component.html',
  styleUrl: './crossword-editor.component.scss',
})
export class CrosswordEditorComponent implements OnInit {
  private readonly crosswordService = inject(CrosswordService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly crossword = signal<CrosswordGrid | null>(null);
  readonly isLoading = signal(true);
  readonly currentTool = signal<Tool>('clue-horizontal');
  readonly selectedCell = signal<CrosswordCell | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      const crossword = this.crosswordService.getCrosswordById(id);
      if (crossword) {
        this.crossword.set(crossword);
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
      this.crossword.set(newCrossword);
    }

    this.isLoading.set(false);
  }

  setTool(tool: Tool): void {
    this.currentTool.set(tool);
  }

  onCellClick(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    this.selectedCell.set(cell);

    const tool = this.currentTool();

    switch (tool) {
      case 'clue-horizontal':
        this.setClueCell(row, col, 'horizontal');
        break;
      case 'clue-vertical':
        this.setClueCell(row, col, 'vertical');
        break;
      case 'clear':
        this.clearCell(row, col);
        break;
    }
  }

  onCellFocus(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    this.selectedCell.set(cell);
  }

  private setClueCell(
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical'
  ): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];

    cell.isClueCell = true;
    cell.clueDirection = direction;
    cell.letter = '';

    if (!cell.clueText) {
      cell.clueText = 'Digite a dica aqui';
    }

    this.crossword.set({ ...crossword });
  }

  private clearCell(row: number, col: number): void {
    const crossword = this.crossword();
    if (!crossword) return;

    const cell = crossword.cells[row][col];
    cell.isClueCell = false;
    cell.letter = '';
    cell.clueText = '';
    cell.clueDirection = undefined;

    this.crossword.set({ ...crossword });
  }

  clearSelectedCell(): void {
    const selected = this.selectedCell();
    if (!selected) return;

    this.clearCell(selected.row, selected.col);
    this.selectedCell.set(null);
  }

  saveChanges(): void {
    const current = this.crossword();
    if (current) {
      this.crosswordService.updateCrossword(current);
    }
  }

  goBack(): void {
    this.router.navigate(['/crosswords']);
  }

  saveCrossword(): void {
    this.saveChanges();
  }
}
