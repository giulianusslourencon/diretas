import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ClueDirection } from '../../../../core/models/crossword.model';

@Component({
  selector: 'app-clue-arrow',
  templateUrl: './clue-arrow.component.html',
  styleUrls: ['./clue-arrow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClueArrowComponent {
  direction = input.required<ClueDirection>();
}
