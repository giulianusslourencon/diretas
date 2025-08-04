import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-navigation-feedback',
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <div class="navigation-feedback" [class.visible]="isVisible()">
        {{ message() }}
      </div>
    }
  `,
  styles: [`
    .navigation-feedback {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    .navigation-feedback.visible {
      opacity: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationFeedbackComponent {
  private readonly navigationService = inject(NavigationService);
  
  readonly isVisible = signal(false);
  readonly message = signal('');

  showFeedback(): void {
    const message = this.navigationService.getNavigationDirectionMessage();
    this.message.set(message);
    this.isVisible.set(true);

    // Hide after 2 seconds
    setTimeout(() => {
      this.isVisible.set(false);
    }, 2000);
  }
}
