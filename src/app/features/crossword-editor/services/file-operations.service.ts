import { Injectable, inject } from '@angular/core';
import {
  CrosswordExportOptions,
  CrosswordGrid,
} from '../../../core/models/crossword.model';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { FileManagerService } from '../../../core/services/file-manager.service';
import { CrosswordService } from '../../../core/services/crossword.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { StatusResetService } from '../../../core/services/status-reset.service';
import { EditorStateService } from './editor-state.service';

@Injectable({
  providedIn: 'root',
})
export class FileOperationsService {
  private readonly pdfExportService = inject(PdfExportService);
  private readonly fileManagerService = inject(FileManagerService);
  private readonly crosswordService = inject(CrosswordService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly statusResetService = inject(StatusResetService);
  private readonly editorStateService = inject(EditorStateService);

  async exportToPdf(options: CrosswordExportOptions): Promise<void> {
    await this.errorHandlerService.handleResourceOperation(
      this.editorStateService.crossword(),
      'crossword',
      (crossword) =>
        this.pdfExportService.exportCrosswordToPdf(crossword, options),
      'Failed to export crossword to PDF'
    );
  }

  saveToFile(): void {
    this.errorHandlerService.handleResourceOperation(
      this.editorStateService.crossword(),
      'crossword',
      (crossword) => this.fileManagerService.saveToFile(crossword),
      'Failed to save crossword to file'
    );
  }

  saveChanges(): void {
    const current = this.editorStateService.crossword();
    if (!current) return;

    this.editorStateService.setSaveStatus('saving');

    try {
      this.crosswordService.updateCrossword(current);

      // Use StatusResetService for consistent status management
      this.statusResetService.setStatusWithReset(
        (status) => this.editorStateService.setSaveStatus(status as any),
        'saved',
        { successDelay: 2000 },
        'save-operation'
      );
    } catch (error) {
      this.errorHandlerService.handleError(error, 'Failed to save crossword', {
        rethrow: false,
      });

      // Use StatusResetService for error status management
      this.statusResetService.setStatusWithReset(
        (status) => this.editorStateService.setSaveStatus(status as any),
        'error',
        { errorDelay: 3000 },
        'save-operation'
      );
    }
  }
}
