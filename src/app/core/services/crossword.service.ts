import { Injectable, signal, computed } from '@angular/core';
import {
  CrosswordGrid,
  CrosswordMetadata,
  CrosswordCell,
  CrosswordWord,
  CrosswordExportOptions,
} from '../models/crossword.model';

@Injectable({
  providedIn: 'root',
})
export class CrosswordService {
  private readonly STORAGE_KEY = 'diretas-crosswords';

  private crosswords = signal<CrosswordGrid[]>([]);

  readonly crosswordList = computed(() =>
    this.crosswords().map(
      (cw) =>
        ({
          id: cw.id,
          title: cw.title,
          description: cw.description,
          rows: cw.rows,
          cols: cw.cols,
          wordCount: cw.words.length,
          createdAt: cw.createdAt,
          updatedAt: cw.updatedAt,
        } as CrosswordMetadata)
    )
  );

  constructor() {
    this.loadFromStorage();
  }

  createNewCrossword(title: string, rows: number, cols: number): CrosswordGrid {
    const id = this.generateId();
    const now = new Date();

    const cells: CrosswordCell[][] = [];
    for (let row = 0; row < rows; row++) {
      cells[row] = [];
      for (let col = 0; col < cols; col++) {
        cells[row][col] = {
          id: `${row}-${col}`,
          row,
          col,
          letter: '',
          isClueCell: false,
          isSplitCell: false,
          clueText: '',
          clueDirection: undefined,
          boldClueText: false,
          textSize: 'medium',
          topLetter: '',
          bottomLetter: '',
          wordId: undefined,
        };
      }
    }

    const crossword: CrosswordGrid = {
      id,
      title,
      rows,
      cols,
      cells,
      words: [],
      createdAt: now,
      updatedAt: now,
    };

    this.crosswords.update((crosswords) => [...crosswords, crossword]);
    this.saveToStorage();

    return crossword;
  }

  getCrosswordById(id: string): CrosswordGrid | undefined {
    return this.crosswords().find((cw) => cw.id === id);
  }

  updateCrossword(crossword: CrosswordGrid): void {
    crossword.updatedAt = new Date();

    this.crosswords.update((crosswords) =>
      crosswords.map((cw) => (cw.id === crossword.id ? crossword : cw))
    );

    this.saveToStorage();
  }

  deleteCrossword(id: string): void {
    this.crosswords.update((crosswords) =>
      crosswords.filter((cw) => cw.id !== id)
    );

    this.saveToStorage();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const crosswords = JSON.parse(stored).map((cw: any) => ({
          ...cw,
          createdAt: new Date(cw.createdAt),
          updatedAt: new Date(cw.updatedAt),
        }));
        this.crosswords.set(crosswords);
      }
    } catch (error) {
      console.error('Error loading crosswords from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.crosswords()));
    } catch (error) {
      console.error('Error saving crosswords to storage:', error);
    }
  }
}
