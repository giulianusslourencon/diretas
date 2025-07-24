export interface CrosswordCell {
  id: string;
  row: number;
  col: number;
  letter: string;
  isClueCell: boolean;
  isSplitCell: boolean;
  clueText?: string;
  clueDirection?: 'horizontal' | 'vertical' | 'up' | 'left';
  boldClueText?: boolean; // Whether clue text should be bold
  textSize?: 'small' | 'medium' | 'large'; // Text size for clue text
  // For split cells - two letters in diagonal triangles
  topLetter?: string; // Letter in top triangle
  bottomLetter?: string; // Letter in bottom triangle
  diagonalDirection?: 'main' | 'anti'; // main: top-left to bottom-right, anti: top-right to bottom-left
  wordId?: string;
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
