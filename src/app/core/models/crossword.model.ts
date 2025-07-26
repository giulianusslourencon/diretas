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

export interface CrosswordCell {
  id: string;
  row: number;
  col: number;
  letter: string;
  isClueCell: boolean;
  isSplitCell: boolean;
  clueText?: string;
  clueDirection?: ClueDirection;
  boldClueText?: boolean; // Whether clue text should be bold
  textSize?: 'small' | 'medium' | 'large'; // Text size for clue text
  // For split cells - two letters in diagonal triangles
  topLetter?: string; // Letter in top triangle
  bottomLetter?: string; // Letter in bottom triangle
  diagonalDirection?: 'main' | 'anti'; // main: top-left to bottom-right, anti: top-right to bottom-left
}

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
