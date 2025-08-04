import { Injectable } from '@angular/core';

export interface StatusResetConfig {
  successDelay?: number;
  errorDelay?: number;
  idleStatus?: string;
}

/**
 * Service for managing status reset operations with setTimeout patterns
 */
@Injectable({
  providedIn: 'root',
})
export class StatusResetService {
  private readonly DEFAULT_SUCCESS_DELAY = 2000;
  private readonly DEFAULT_ERROR_DELAY = 3000;
  private readonly DEFAULT_IDLE_STATUS = 'idle';

  private timeouts = new Map<string, number>();

  /**
   * Sets a status and schedules a reset to idle after a delay
   * @param statusSetter Function to set the status
   * @param status The status to set
   * @param config Configuration for delays and idle status
   * @param key Unique key to identify this status operation (for cancellation)
   */
  setStatusWithReset(
    statusSetter: (status: string) => void,
    status: 'saved' | 'error' | string,
    config: StatusResetConfig = {},
    key?: string
  ): void {
    const {
      successDelay = this.DEFAULT_SUCCESS_DELAY,
      errorDelay = this.DEFAULT_ERROR_DELAY,
      idleStatus = this.DEFAULT_IDLE_STATUS,
    } = config;

    // Cancel any existing timeout for this key
    if (key && this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }

    // Set the status
    statusSetter(status);

    // Determine delay based on status
    const delay = status === 'error' ? errorDelay : successDelay;

    // Schedule reset
    const timeout = setTimeout(() => {
      statusSetter(idleStatus);
      if (key) {
        this.timeouts.delete(key);
      }
    }, delay) as unknown as number;

    // Store timeout if key provided
    if (key) {
      this.timeouts.set(key, timeout);
    }
  }

  /**
   * Sets a status with additional error message and schedules reset
   * @param statusSetter Function to set the status
   * @param errorSetter Function to set the error message
   * @param status The status to set
   * @param errorMessage The error message to set
   * @param config Configuration for delays and idle status
   * @param key Unique key to identify this status operation
   */
  setStatusWithErrorReset(
    statusSetter: (status: string) => void,
    errorSetter: (error: string) => void,
    status: string,
    errorMessage: string,
    config: StatusResetConfig = {},
    key?: string
  ): void {
    const {
      errorDelay = this.DEFAULT_ERROR_DELAY,
      idleStatus = this.DEFAULT_IDLE_STATUS,
    } = config;

    // Cancel any existing timeout for this key
    if (key && this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }

    // Set status and error
    statusSetter(status);
    errorSetter(errorMessage);

    // Schedule reset
    const timeout = setTimeout(() => {
      statusSetter(idleStatus);
      errorSetter('');
      if (key) {
        this.timeouts.delete(key);
      }
    }, errorDelay) as unknown as number;

    // Store timeout if key provided
    if (key) {
      this.timeouts.set(key, timeout);
    }
  }

  /**
   * Cancels a scheduled status reset
   * @param key The key of the status operation to cancel
   */
  cancelStatusReset(key: string): void {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }
  }

  /**
   * Cancels all scheduled status resets
   */
  cancelAllStatusResets(): void {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * Cleanup method to be called when service is destroyed
   */
  ngOnDestroy(): void {
    this.cancelAllStatusResets();
  }
}
