import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  ClueDirection,
  BasicDirection,
  CompoundDirection,
  isBasicDirection,
  isCompoundDirection,
} from '../../../../core/models/crossword.model';

@Component({
  selector: 'app-clue-arrow',
  templateUrl: './clue-arrow.component.html',
  styleUrls: ['./clue-arrow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClueArrowComponent {
  readonly direction = input.required<ClueDirection>();

  // Type-safe helper methods for template
  protected isBasicDirection(): boolean {
    return isBasicDirection(this.direction());
  }

  protected isCompoundDirection(): boolean {
    return isCompoundDirection(this.direction());
  }

  protected getDirectionType(): 'basic' | 'compound' {
    return this.isBasicDirection() ? 'basic' : 'compound';
  }
}
