import { Directive, ElementRef, inject, input, effect } from '@angular/core';
import { FocusManagerService } from '../services/focus-manager.service';

@Directive({
  selector: '[appAutoFocus]',
})
export class AutoFocusDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly focusManagerService = inject(FocusManagerService);

  readonly trigger = input<boolean>(false, { alias: 'appAutoFocus' });
  readonly selectText = input<boolean>(false);
  readonly delay = input<number>(10);

  constructor() {
    // Watch for trigger changes using effect
    effect(() => {
      const shouldFocus = this.trigger();
      if (shouldFocus) {
        this.focusElement();
      }
    });
  }

  private focusElement(): void {
    setTimeout(() => {
      const element = this.elementRef.nativeElement as HTMLElement;
      if (element && typeof element.focus === 'function') {
        element.focus();

        // Select text if it's an input element and selectText is true
        if (
          this.selectText() &&
          'select' in element &&
          typeof element.select === 'function'
        ) {
          (element as HTMLInputElement).select();
        }
      }
    }, this.delay());
  }

  /**
   * Focus a cell input - delegates to FocusManagerService
   * @param row Cell row
   * @param col Cell column
   */
  focusCell(row: number, col: number): void {
    // Create a temporary cell object for the FocusManagerService
    const tempCell = { row, col, type: 'answer' as const };
    this.focusManagerService.focusCellIfNeeded(tempCell as any);
  }

  /**
   * Focus a clue input - delegates to FocusManagerService
   * @param row Cell row
   * @param col Cell column
   */
  focusClueInput(row: number, col: number): void {
    this.focusManagerService.focusClueInput(row, col);
  }

  /**
   * Focus triangle input - delegates to FocusManagerService
   */
  focusTriangleInput(): void {
    this.focusManagerService.focusTriangleInput();
  }

  /**
   * Focus title input - delegates to FocusManagerService
   */
  focusTitleInput(): void {
    this.focusManagerService.focusTitleInput();
  }
}
