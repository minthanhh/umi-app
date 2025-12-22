/**
 * X-Dynamic-Form Core
 *
 * Framework-agnostic core for building dynamic forms.
 * This package contains:
 * - Type definitions
 * - Context provider
 * - Field component
 * - Registry utilities
 *
 * To use with a specific UI framework, import the adapter:
 * - x-dynamic-form/antd
 * - x-dynamic-form/mui (coming soon)
 */

// Types
export type {
  BaseFieldConfig,
  FieldConfig,
  FieldComponentProps,
  FieldComponent,
  FormItemWrapperProps,
  FormItemWrapper,
  FieldRegistry,
  FormContextValue,
  ExtractConfig,
  ExtractValue,
  FormSchema,
  FormSection,
} from './types';

// Context
export { FormProvider, useFormContext, useFormContextSafe, useFieldComponent, useFormItemWrapper } from './context';
export type { FormProviderProps } from './context';

// Field
export { Field, FieldList } from './Field';
export type { FieldProps, FieldListProps } from './Field';

// Registry utilities
export { createRegistry, mergeRegistries, extendRegistry, getRegisteredTypes, hasFieldType } from './registry';
