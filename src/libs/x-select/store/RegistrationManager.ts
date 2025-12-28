/**
 * RegistrationManager - Batched Field Registration
 *
 * Manages field registration/unregistration with automatic batching.
 * Uses queueMicrotask to batch multiple registrations in the same tick.
 *
 * Design Principles:
 * - Single Responsibility: Only handles registration batching
 * - Open/Closed: Extensible via callbacks, closed for modification
 * - Dependency Inversion: Depends on abstractions (callbacks), not concrete implementations
 *
 * @example
 * ```ts
 * const manager = new RegistrationManager({
 *   onFlush: (added, removed) => {
 *     // Handle batched changes
 *   },
 * });
 *
 * // Multiple registrations in same tick = 1 flush
 * manager.register({ name: 'country', ... });
 * manager.register({ name: 'province', ... });
 * manager.register({ name: 'city', ... });
 * // → onFlush called once with all 3 configs
 * ```
 */

import type { FieldConfig } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Callback when registrations are flushed.
 */
export type OnFlushCallback = (
  added: ReadonlyMap<string, FieldConfig>,
  removed: ReadonlySet<string>,
) => void;

/**
 * Options for RegistrationManager.
 */
export interface RegistrationManagerOptions {
  /** Callback when pending changes are flushed */
  onFlush: OnFlushCallback;

  /** Optional: Custom scheduler (default: queueMicrotask) */
  scheduler?: (callback: () => void) => void;
}

/**
 * Result of registration operation.
 */
export interface RegistrationResult {
  /** Whether the registration was accepted */
  accepted: boolean;

  /** Reason if not accepted */
  reason?: string;
}

// ============================================================================
// REGISTRATION MANAGER
// ============================================================================

/**
 * Manages batched field registration/unregistration.
 *
 * Features:
 * - Batches multiple register/unregister calls in same tick
 * - Deduplicates registrations (last write wins)
 * - Handles concurrent add/remove of same field
 * - Provides flush control for testing
 */
export class RegistrationManager {
  // Pending operations
  private pendingRegistrations = new Map<string, FieldConfig>();
  private pendingUnregistrations = new Set<string>();

  // State
  private isFlushScheduled = false;
  private isDestroyed = false;

  // Callbacks & config
  private readonly onFlush: OnFlushCallback;
  private readonly scheduler: (callback: () => void) => void;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(options: RegistrationManagerOptions) {
    this.onFlush = options.onFlush;
    // Wrap queueMicrotask to preserve correct context (avoid "Illegal invocation")
    this.scheduler = options.scheduler ?? ((cb) => queueMicrotask(cb));
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Register a field configuration.
   * Will be batched with other registrations in same tick.
   */
  register(config: FieldConfig): RegistrationResult {
    if (this.isDestroyed) {
      return { accepted: false, reason: 'Manager is destroyed' };
    }

    if (!config.name) {
      return { accepted: false, reason: 'Field name is required' };
    }

    // If same field was pending unregistration, cancel it
    this.pendingUnregistrations.delete(config.name);

    // Add to pending registrations (last write wins)
    this.pendingRegistrations.set(config.name, config);

    this.scheduleFlush();

    return { accepted: true };
  }

  /**
   * Unregister a field by name.
   * Will be batched with other operations in same tick.
   */
  unregister(fieldName: string): RegistrationResult {
    if (this.isDestroyed) {
      return { accepted: false, reason: 'Manager is destroyed' };
    }

    if (!fieldName) {
      return { accepted: false, reason: 'Field name is required' };
    }

    // If same field was pending registration, cancel it
    this.pendingRegistrations.delete(fieldName);

    // Add to pending unregistrations
    this.pendingUnregistrations.add(fieldName);

    this.scheduleFlush();

    return { accepted: true };
  }

  /**
   * Update an existing field's configuration.
   * Equivalent to register with updated config.
   */
  update(config: FieldConfig): RegistrationResult {
    return this.register(config);
  }

  /**
   * Force flush pending operations immediately.
   * Useful for testing or when immediate effect is needed.
   */
  flushSync(): void {
    if (this.isDestroyed) return;

    this.flush();
  }

  /**
   * Check if there are pending operations.
   */
  hasPending(): boolean {
    return this.pendingRegistrations.size > 0 || this.pendingUnregistrations.size > 0;
  }

  /**
   * Get count of pending operations.
   */
  getPendingCount(): { registrations: number; unregistrations: number } {
    return {
      registrations: this.pendingRegistrations.size,
      unregistrations: this.pendingUnregistrations.size,
    };
  }

  /**
   * Destroy the manager and cancel pending operations.
   */
  destroy(): void {
    this.isDestroyed = true;
    this.pendingRegistrations.clear();
    this.pendingUnregistrations.clear();
    this.isFlushScheduled = false;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Schedule a flush via microtask.
   * Only schedules once per tick.
   */
  private scheduleFlush(): void {
    if (this.isFlushScheduled || this.isDestroyed) return;

    this.isFlushScheduled = true;

    this.scheduler(() => {
      if (this.isDestroyed) return;
      this.flush();
    });
  }

  /**
   * Execute the flush - process all pending operations.
   */
  private flush(): void {
    // Early exit if nothing to do
    if (this.pendingRegistrations.size === 0 && this.pendingUnregistrations.size === 0) {
      this.isFlushScheduled = false;
      return;
    }

    // Capture current pending state
    const added = new Map(this.pendingRegistrations);
    const removed = new Set(this.pendingUnregistrations);

    // Clear pending state BEFORE callback (in case callback triggers more registrations)
    this.pendingRegistrations.clear();
    this.pendingUnregistrations.clear();
    this.isFlushScheduled = false;

    // Execute callback
    this.onFlush(added, removed);
  }
}
