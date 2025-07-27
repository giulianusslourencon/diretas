import { BasicDirection, CompoundDirection } from './crossword.model';

// Position interface for grid coordinates
export interface GridPosition {
  readonly row: number;
  readonly col: number;
}

// Delta interface for directional movement
export interface DirectionDelta {
  readonly deltaRow: number;
  readonly deltaCol: number;
}

// Configuration for compound directions
export interface CompoundDirectionConfig {
  readonly finalDirection: BasicDirection;
  readonly offsetDirection: BasicDirection;
}

// Result of parsing any direction
export interface ParsedDirection {
  readonly finalDirection: BasicDirection;
  readonly startingPosition: GridPosition;
}

// Direction delta mapping - immutable and type-safe
export const DIRECTION_DELTAS: Readonly<Record<BasicDirection, DirectionDelta>> = {
  right: { deltaRow: 0, deltaCol: 1 },
  left: { deltaRow: 0, deltaCol: -1 },
  up: { deltaRow: -1, deltaCol: 0 },
  down: { deltaRow: 1, deltaCol: 0 },
} as const;

// Compound direction configuration mapping - immutable and type-safe
export const COMPOUND_DIRECTION_CONFIG: Readonly<Record<CompoundDirection, CompoundDirectionConfig>> = {
  'right-down': { finalDirection: 'down', offsetDirection: 'right' },
  'right-up': { finalDirection: 'up', offsetDirection: 'right' },
  'left-down': { finalDirection: 'down', offsetDirection: 'left' },
  'left-up': { finalDirection: 'up', offsetDirection: 'left' },
  'down-right': { finalDirection: 'right', offsetDirection: 'down' },
  'down-left': { finalDirection: 'left', offsetDirection: 'down' },
  'up-right': { finalDirection: 'right', offsetDirection: 'up' },
  'up-left': { finalDirection: 'left', offsetDirection: 'up' },
} as const;

// Type-safe helper functions
export const getDirectionDelta = (direction: BasicDirection): DirectionDelta => {
  return DIRECTION_DELTAS[direction];
};

export const getCompoundDirectionConfig = (direction: CompoundDirection): CompoundDirectionConfig => {
  return COMPOUND_DIRECTION_CONFIG[direction];
};

// Utility function to calculate adjacent position
export const calculateAdjacentPosition = (
  position: GridPosition,
  direction: BasicDirection
): GridPosition => {
  const delta = getDirectionDelta(direction);
  return {
    row: position.row + delta.deltaRow,
    col: position.col + delta.deltaCol,
  };
};

// Utility function to check if position is within grid bounds
export const isPositionInBounds = (
  position: GridPosition,
  gridRows: number,
  gridCols: number
): boolean => {
  return (
    position.row >= 0 &&
    position.row < gridRows &&
    position.col >= 0 &&
    position.col < gridCols
  );
};
