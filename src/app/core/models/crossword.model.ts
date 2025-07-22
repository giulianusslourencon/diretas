export interface CrosswordCell {
  id: string;
  row: number;
  col: number;
  letter: string;
  isBlocked: boolean;
  number?: number;
  isStartOfWord: boolean;
  clueHorizontal?: string;
  clueVertical?: string;
}

export interface CrosswordWord {
  id: string;
  startRow: number;
  startCol: number;
  length: number;
  direction: 'horizontal' | 'vertical';
  answer: string;
  clue: string;
  number: number;
}

export interface CrosswordGrid {
  id: string;
  title: string;
  description?: string;
  rows: number;
  cols: number;
  cells: CrosswordCell[][];
  words: CrosswordWord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrosswordMetadata {
  id: string;
  title: string;
  description?: string;
  rows: number;
  cols: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrosswordExportOptions {
  includeAnswers: boolean;
  includeClues: boolean;
  paperSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}
