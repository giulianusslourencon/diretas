import { Injectable } from '@angular/core';

export interface KeyboardEventConfig {
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Service for keyboard event utilities and common patterns
 */
@Injectable({
  providedIn: 'root',
})
export class KeyboardUtilsService {
  /**
   * Check if the event is a save command (Ctrl+S or Cmd+S)
   * @param event The keyboard event
   * @returns True if it's a save command
   */
  isSaveCommand(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && event.key === 's';
  }

  /**
   * Check if the event has modifier keys pressed
   * @param event The keyboard event
   * @returns True if any modifier key is pressed
   */
  hasModifierKeys(event: KeyboardEvent): boolean {
    return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
  }

  /**
   * Check if the event is an arrow key
   * @param key The key string
   * @returns True if it's an arrow key
   */
  isArrowKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
  }

  /**
   * Check if the event is a navigation key (arrows, tab, enter, escape)
   * @param key The key string
   * @returns True if it's a navigation key
   */
  isNavigationKey(key: string): boolean {
    return this.isArrowKey(key) || ['Tab', 'Enter', 'Escape'].includes(key);
  }

  /**
   * Check if the event is a letter key
   * @param key The key string
   * @returns True if it's a single letter
   */
  isLetterKey(key: string): boolean {
    return key.length === 1 && key.match(/[a-zA-Z]/) !== null;
  }

  /**
   * Check if the event is a number key
   * @param key The key string
   * @returns True if it's a single number
   */
  isNumberKey(key: string): boolean {
    return key.length === 1 && key.match(/[0-9]/) !== null;
  }

  /**
   * Check if the event is an alphanumeric key
   * @param key The key string
   * @returns True if it's a letter or number
   */
  isAlphanumericKey(key: string): boolean {
    return this.isLetterKey(key) || this.isNumberKey(key);
  }

  /**
   * Handle keyboard event with common patterns
   * @param event The keyboard event
   * @param config Configuration for event handling
   * @returns The processed event
   */
  handleKeyboardEvent(
    event: KeyboardEvent,
    config: KeyboardEventConfig = {}
  ): KeyboardEvent {
    const { preventDefault = false, stopPropagation = false } = config;

    if (preventDefault) {
      event.preventDefault();
    }

    if (stopPropagation) {
      event.stopPropagation();
    }

    return event;
  }

  /**
   * Check if the current focus is on an input element (excluding specific classes)
   * @param excludeClasses Classes to exclude from the check
   * @returns True if focus is on an input element
   */
  isFocusOnInput(excludeClasses: string[] = []): boolean {
    const activeElement = document.activeElement;
    
    if (!activeElement) {
      return false;
    }

    // Check if it's an input element
    const isInput = 
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true';

    if (!isInput) {
      return false;
    }

    // Check if any excluded classes are present
    if (excludeClasses.length > 0) {
      return !excludeClasses.some(className => 
        activeElement.classList.contains(className)
      );
    }

    return true;
  }

  /**
   * Check if the current focus is on a specific type of input
   * @param inputClasses Classes that identify the input type
   * @returns True if focus is on the specified input type
   */
  isFocusOnSpecificInput(inputClasses: string[]): boolean {
    const activeElement = document.activeElement;
    
    if (!activeElement) {
      return false;
    }

    return inputClasses.some(className => 
      activeElement.classList.contains(className)
    );
  }

  /**
   * Get the direction from arrow key
   * @param key The arrow key string
   * @returns The direction string or null
   */
  getDirectionFromArrowKey(key: string): 'up' | 'down' | 'left' | 'right' | null {
    switch (key) {
      case 'ArrowUp':
        return 'up';
      case 'ArrowDown':
        return 'down';
      case 'ArrowLeft':
        return 'left';
      case 'ArrowRight':
        return 'right';
      default:
        return null;
    }
  }
}
