export interface ActiveTriangle {
  row: number;
  col: number;
  triangle: 'top' | 'bottom';
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellClickEvent extends CellPosition {}

export interface CellRightClickEvent extends CellPosition {
  event: MouseEvent;
}

export interface TriangleClickEvent extends CellPosition {
  triangle: 'top' | 'bottom';
  event: Event;
}

export interface TriangleKeydownEvent extends CellPosition {
  event: KeyboardEvent;
  triangle: 'top' | 'bottom';
}
