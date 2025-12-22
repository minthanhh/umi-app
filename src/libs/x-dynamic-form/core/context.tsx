/**
 * X-Dynamic-Form Context
 *
 * Provides context for field resolution and form integration.
 * This is framework-agnostic - it just provides a way to pass
 * down the registry and wrapper.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { FormContextValue, FieldRegistry, FormItemWrapper } from './types';

// =============================================================================
// CONTEXT
// =============================================================================

const FormContext = createContext<FormContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export interface FormProviderProps {
  /** Registry of field components */
  registry: FieldRegistry;
  /** Optional form item wrapper component */
  FormItemWrapper?: FormItemWrapper;
  /** Optional getter for field value */
  getValue?: (name: string) => unknown;
  /** Optional setter for field value */
  setValue?: (name: string, value: unknown) => void;
  /** Optional getter for field error */
  getError?: (name: string) => string | undefined;
  /** Children */
  children: ReactNode;
}

/**
 * Form Provider - wraps form content and provides context
 *
 * @example
 * ```tsx
 * const registry = new Map([['input', InputField]]);
 *
 * <FormProvider registry={registry}>
 *   <Field config={{ type: 'input', name: 'email' }} />
 * </FormProvider>
 * ```
 */
export function FormProvider({
  registry,
  FormItemWrapper,
  getValue,
  setValue,
  getError,
  children,
}: FormProviderProps) {
  const value: FormContextValue = {
    registry,
    FormItemWrapper,
    getValue,
    setValue,
    getError,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access form context
 *
 * @throws Error if used outside FormProvider
 */
export function useFormContext(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}

/**
 * Hook to safely access form context (returns null if outside provider)
 */
export function useFormContextSafe(): FormContextValue | null {
  return useContext(FormContext);
}

/**
 * Hook to get a field component from registry
 */
export function useFieldComponent(type: string) {
  const { registry } = useFormContext();
  return registry.get(type);
}

/**
 * Hook to get the form item wrapper
 */
export function useFormItemWrapper() {
  const { FormItemWrapper } = useFormContext();
  return FormItemWrapper;
}
