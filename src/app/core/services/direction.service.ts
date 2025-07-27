import { Injectable } from '@angular/core';
import {
  ClueDirection,
  BasicDirection,
  CompoundDirection,
  isBasicDirection,
  isCompoundDirection,
} from '../models/crossword.model';
import {
  GridPosition,
  ParsedDirection,
  DirectionDelta,
  CompoundDirectionConfig,
  getDirectionDelta,
  getCompoundDirectionConfig,
  calculateAdjacentPosition,
  isPositionInBounds,
  DIRECTION_DELTAS,
  COMPOUND_DIRECTION_CONFIG,
} from '../models/direction.model';

/**
 * Service for handling direction-related operations with full type safety
 */
@Injectable({
  providedIn: 'root',
})
export class DirectionService {
  /**
   * Parse any clue direction into its final direction and starting position
   */
  parseClueDirection(
    direction: ClueDirection,
    startPosition: GridPosition
  ): ParsedDirection {
    if (isBasicDirection(direction)) {
      return this.parseBasicDirection(direction, startPosition);
    }

    if (isCompoundDirection(direction)) {
      return this.parseCompoundDirection(direction, startPosition);
    }

    // TypeScript exhaustiveness check - this should never be reached
    throw new Error(`Unknown direction: ${direction satisfies never}`);
  }

  /**
   * Parse a basic direction (no offset needed)
   */
  private parseBasicDirection(
    direction: BasicDirection,
    startPosition: GridPosition
  ): ParsedDirection {
    return {
      finalDirection: direction,
      startingPosition: calculateAdjacentPosition(startPosition, direction),
    };
  }

  /**
   * Parse a compound direction (with offset calculation)
   */
  private parseCompoundDirection(
    direction: CompoundDirection,
    startPosition: GridPosition
  ): ParsedDirection {
    const config = getCompoundDirectionConfig(direction);
    const offsetPosition = calculateAdjacentPosition(
      startPosition,
      config.offsetDirection
    );

    return {
      finalDirection: config.finalDirection,
      startingPosition: offsetPosition,
    };
  }

  /**
   * Get the delta for a basic direction
   */
  getDirectionDelta(direction: BasicDirection): DirectionDelta {
    return getDirectionDelta(direction);
  }

  /**
   * Calculate the next position in a given direction
   */
  getNextPosition(
    currentPosition: GridPosition,
    direction: BasicDirection
  ): GridPosition {
    return calculateAdjacentPosition(currentPosition, direction);
  }

  /**
   * Check if a position is within grid bounds
   */
  isValidPosition(
    position: GridPosition,
    gridRows: number,
    gridCols: number
  ): boolean {
    return isPositionInBounds(position, gridRows, gridCols);
  }

  /**
   * Get all available basic directions
   */
  getBasicDirections(): readonly BasicDirection[] {
    return Object.keys(DIRECTION_DELTAS) as BasicDirection[];
  }

  /**
   * Get all available compound directions
   */
  getCompoundDirections(): readonly CompoundDirection[] {
    return Object.keys(COMPOUND_DIRECTION_CONFIG) as CompoundDirection[];
  }

  /**
   * Get all available directions
   */
  getAllDirections(): readonly ClueDirection[] {
    return [...this.getBasicDirections(), ...this.getCompoundDirections()];
  }

  /**
   * Get configuration for a compound direction
   */
  getCompoundConfig(direction: CompoundDirection): CompoundDirectionConfig {
    return getCompoundDirectionConfig(direction);
  }

  /**
   * Type guard to check if direction is basic
   */
  isBasicDirection(direction: ClueDirection): direction is BasicDirection {
    return isBasicDirection(direction);
  }

  /**
   * Type guard to check if direction is compound
   */
  isCompoundDirection(
    direction: ClueDirection
  ): direction is CompoundDirection {
    return isCompoundDirection(direction);
  }

  /**
   * Get human-readable description of a direction
   */
  getDirectionDescription(direction: ClueDirection): string {
    const descriptions: Record<ClueDirection, string> = {
      right: 'Right',
      left: 'Left',
      up: 'Up',
      down: 'Down',
      'right-down': 'Right then Down',
      'right-up': 'Right then Up',
      'left-down': 'Left then Down',
      'left-up': 'Left then Up',
      'down-right': 'Down then Right',
      'down-left': 'Down then Left',
      'up-right': 'Up then Right',
      'up-left': 'Up then Left',
    };

    return descriptions[direction];
  }
}
