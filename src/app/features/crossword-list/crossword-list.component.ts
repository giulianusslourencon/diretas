import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordService } from '../../core/services/crossword.service';
import { CrosswordMetadata } from '../../core/models/crossword.model';

@Component({
  selector: 'app-crossword-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-list.component.html',
  styleUrl: './crossword-list.component.scss'
})
export class CrosswordListComponent {
  private readonly crosswordService = inject(CrosswordService);
  private readonly router = inject(Router);

  readonly crosswords = this.crosswordService.crosswordList;
  readonly showNewCrosswordDialog = signal(false);
  readonly newCrosswordTitle = signal('');
  readonly newCrosswordRows = signal(15);
  readonly newCrosswordCols = signal(15);

  openNewCrosswordDialog(): void {
    this.showNewCrosswordDialog.set(true);
    this.newCrosswordTitle.set('');
    this.newCrosswordRows.set(15);
    this.newCrosswordCols.set(15);
  }

  closeNewCrosswordDialog(): void {
    this.showNewCrosswordDialog.set(false);
  }

  createNewCrossword(): void {
    const title = this.newCrosswordTitle().trim();
    if (!title) {
      return;
    }

    const crossword = this.crosswordService.createNewCrossword(
      title,
      this.newCrosswordRows(),
      this.newCrosswordCols()
    );

    this.closeNewCrosswordDialog();
    this.router.navigate(['/crosswords', crossword.id]);
  }

  editCrossword(crossword: CrosswordMetadata): void {
    this.router.navigate(['/crosswords', crossword.id]);
  }

  deleteCrossword(crossword: CrosswordMetadata): void {
    if (confirm(`Tem certeza que deseja excluir "${crossword.title}"?`)) {
      this.crosswordService.deleteCrossword(crossword.id);
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
