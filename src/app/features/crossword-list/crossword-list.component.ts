import {
  Component,
  inject,
  signal,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordService } from '../../core/services/crossword.service';
import { FileManagerService } from '../../core/services/file-manager.service';
import { CrosswordGrid } from '../../core/models/crossword.model';

@Component({
  selector: 'app-crossword-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-list.component.html',
  styleUrl: './crossword-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrosswordListComponent {
  private readonly crosswordService = inject(CrosswordService);
  private readonly fileManagerService = inject(FileManagerService);
  private readonly router = inject(Router);

  readonly fileInput =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  readonly crosswords = this.crosswordService.crosswordList;
  readonly showNewCrosswordDialog = signal(false);
  readonly newCrosswordTitle = signal('');
  readonly newCrosswordRows = signal(16);
  readonly newCrosswordCols = signal(11);
  readonly importStatus = signal<'idle' | 'importing' | 'success' | 'error'>(
    'idle'
  );
  readonly importError = signal<string>('');

  openNewCrosswordDialog(): void {
    this.showNewCrosswordDialog.set(true);
    this.newCrosswordTitle.set('');
    this.newCrosswordRows.set(16);
    this.newCrosswordCols.set(11);
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

  editCrossword(crossword: CrosswordGrid): void {
    this.router.navigate(['/crosswords', crossword.id]);
  }

  deleteCrossword(crossword: CrosswordGrid): void {
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
      minute: '2-digit',
    }).format(date);
  }

  onImportFromFile(): void {
    this.fileInput().nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.importStatus.set('importing');
    this.importError.set('');

    try {
      const importedCrossword = await this.fileManagerService.importFromFile(
        file
      );

      // Gerar novo ID para evitar conflitos
      const newId =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      const crosswordToSave: CrosswordGrid = {
        ...importedCrossword,
        id: newId,
        title: `${importedCrossword.title} (Importado)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Adicionar a palavra cruzada importada à lista
      this.crosswordService.addCrossword(crosswordToSave);

      this.importStatus.set('success');

      // Limpar o input
      input.value = '';

      // Resetar status após 3 segundos
      setTimeout(() => {
        this.importStatus.set('idle');
      }, 3000);
    } catch (error) {
      this.importStatus.set('error');
      this.importError.set(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );

      // Limpar o input
      input.value = '';

      // Resetar status após 5 segundos
      setTimeout(() => {
        this.importStatus.set('idle');
        this.importError.set('');
      }, 5000);
    }
  }
}
