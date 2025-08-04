import { Injectable } from '@angular/core';

export interface ErrorHandlerOptions {
  logError?: boolean;
  rethrow?: boolean;
  customMessage?: string;
}

/**
 * Service for standardized error handling across the application
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  /**
   * Handles errors with consistent logging and optional rethrowing
   * @param error The error to handle
   * @param context Context information for the error
   * @param options Options for error handling
   */
  handleError(
    error: unknown,
    context: string,
    options: ErrorHandlerOptions = {}
  ): void {
    const {
      logError = true,
      rethrow = true,
      customMessage
    } = options;

    const errorMessage = customMessage || this.getErrorMessage(error);
    const fullMessage = `${context}: ${errorMessage}`;

    if (logError) {
      console.error(fullMessage, error);
    }

    if (rethrow) {
      throw new Error(fullMessage);
    }
  }

  /**
   * Handles async operations with standardized error handling
   * @param operation The async operation to execute
   * @param context Context information for the operation
   * @param options Options for error handling
   */
  async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context: string,
    options: ErrorHandlerOptions = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context, options);
      throw error; // This will never be reached if rethrow is true, but TypeScript needs it
    }
  }

  /**
   * Handles operations that require a resource check
   * @param resource The resource to check
   * @param resourceName Name of the resource for error messages
   * @param operation The operation to execute if resource exists
   * @param context Context information for the operation
   */
  async handleResourceOperation<T, R>(
    resource: R | null | undefined,
    resourceName: string,
    operation: (resource: R) => Promise<T> | T,
    context: string
  ): Promise<T | void> {
    if (!resource) {
      this.handleError(
        new Error(`No ${resourceName} available`),
        context,
        { rethrow: false }
      );
      return;
    }

    try {
      return await operation(resource);
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }

  /**
   * Extracts a meaningful error message from various error types
   * @param error The error to extract message from
   * @returns A string representation of the error
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    
    return 'Unknown error occurred';
  }
}
