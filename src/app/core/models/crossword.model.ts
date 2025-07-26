export type ClueDirection =
  | 'right'
  | 'down'
  | 'up'
  | 'left'
  | 'right-down'
  | 'down-right'
  | 'left-down'
  | 'down-left'
  | 'right-up'
  | 'up-right'
  | 'left-up'
  | 'up-left';

// Base interface for all cell types
export interface BaseCrosswordCell {
  id: string;
  row: number;
  col: number;
}

// Regular answer cell
export interface AnswerCell extends BaseCrosswordCell {
  type: 'answer';
  letter: string;
}

// Clue cell with text and direction
export interface ClueCell extends BaseCrosswordCell {
  type: 'clue';
  clueText: string;
  clueDirection: ClueDirection;
  boldClueText: boolean;
  textSize: 'small' | 'medium' | 'large';
}

// Split cell with two letters in diagonal triangles
export interface SplitCell extends BaseCrosswordCell {
  type: 'split';
  topLetter: string;
  bottomLetter: string;
  diagonalDirection: 'main' | 'anti'; // main: top-left to bottom-right, anti: top-right to bottom-left
}

// Union type for all cell types
export type CrosswordCell = AnswerCell | ClueCell | SplitCell;

export interface CrosswordGrid {
  id: string;
  title: string;
  description?: string;
  rows: number;
  cols: number;
  cells: CrosswordCell[][];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrosswordExportOptions {
  includeAnswers: boolean;
}
