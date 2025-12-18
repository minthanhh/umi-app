/**
 * XSelect - Async State Types
 *
 * Discriminated unions for async state modeling.
 * Provides type-safe state handling for loading, success, and error states.
 */

import type { XSelectOption } from './core';

// ============================================================================
// DISCRIMINATED UNIONS - Async State
// ============================================================================

/**
 * Base state interface with discriminator.
 */
interface BaseAsyncState {
  readonly status: 'idle' | 'loading' | 'success' | 'error';
}

/**
 * Idle state - no operation has started.
 */
export interface IdleState extends BaseAsyncState {
  readonly status: 'idle';
  readonly data?: undefined;
  readonly error?: undefined;
}

/**
 * Loading state - operation in progress.
 */
export interface LoadingState extends BaseAsyncState {
  readonly status: 'loading';
  readonly data?: undefined;
  readonly error?: undefined;
}

/**
 * Success state - operation completed successfully.
 */
export interface SuccessState<TData> extends BaseAsyncState {
  readonly status: 'success';
  readonly data: TData;
  readonly error?: undefined;
}

/**
 * Error state - operation failed.
 */
export interface ErrorState extends BaseAsyncState {
  readonly status: 'error';
  readonly data?: undefined;
  readonly error: Error;
}

/**
 * Discriminated union for async state.
 *
 * @example
 * ```ts
 * const state: AsyncState<XSelectOption[]> = { status: 'success', data: options };
 *
 * if (state.status === 'success') {
 *   console.log(state.data); // data is XSelectOption[]
 * }
 * ```
 */
export type AsyncState<TData> =
  | IdleState
  | LoadingState
  | SuccessState<TData>
  | ErrorState;

/**
 * Options loading state using discriminated union.
 */
export type OptionsAsyncState = AsyncState<XSelectOption[]>;

// ============================================================================
// ASYNC STATE HELPERS
// ============================================================================

/**
 * Helper functions for creating and checking async states.
 */
export const AsyncStateHelpers = {
  // Creators
  idle: (): IdleState => ({ status: 'idle' }),
  loading: (): LoadingState => ({ status: 'loading' }),
  success: <TData>(data: TData): SuccessState<TData> => ({ status: 'success', data }),
  error: (error: Error): ErrorState => ({ status: 'error', error }),

  // Type guards
  isIdle: (state: AsyncState<unknown>): state is IdleState => state.status === 'idle',
  isLoading: (state: AsyncState<unknown>): state is LoadingState => state.status === 'loading',
  isSuccess: <TData>(state: AsyncState<TData>): state is SuccessState<TData> => state.status === 'success',
  isError: (state: AsyncState<unknown>): state is ErrorState => state.status === 'error',
} as const;

// ============================================================================
// STORE EVENTS
// ============================================================================

/**
 * Store event types.
 */
export type StoreEventType =
  | 'value:change'
  | 'options:change'
  | 'loading:start'
  | 'loading:end'
  | 'cascade:delete'
  | 'sync:controlled';

/**
 * Field-specific event type.
 */
export type FieldEvent<
  TFieldName extends string,
  TEvent extends StoreEventType,
> = `${TFieldName}:${TEvent}`;

/**
 * All possible events for field names.
 */
export type AllFieldEvents<TFieldNames extends string> = FieldEvent<
  TFieldNames,
  StoreEventType
>;

/**
 * Event payload map.
 */
export interface StoreEventPayloadMap<TValue = unknown> {
  'value:change': { previousValue: TValue; newValue: TValue };
  'options:change': { options: XSelectOption[] };
  'loading:start': { fieldName: string };
  'loading:end': { fieldName: string; success: boolean };
  'cascade:delete': { affectedFields: string[]; deletedValues: Record<string, unknown> };
  'sync:controlled': { values: Record<string, unknown> };
}

/**
 * Type-safe event listener.
 */
export type StoreEventListener<TEvent extends StoreEventType> = (
  payload: StoreEventPayloadMap[TEvent],
) => void;