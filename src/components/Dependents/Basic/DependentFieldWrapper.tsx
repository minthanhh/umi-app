/**
 * DependentFieldWrapper - Render Props Component
 *
 * A headless component that provides dependent field logic via render props.
 * Use this for custom integrations with any form library or UI component.
 *
 * For Ant Design Form, prefer FormDependentSelectField instead.
 * For standalone usage, prefer DependentSelectField instead.
 */

import React, { useMemo } from 'react';

import { useDependentField } from './context';
import type { DependentFieldConfig, FormattedSelectOption, SelectOption } from './types';
import { formatOptionsForSelect } from './utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props passed to the render function.
 * Contains all the state and handlers needed to build a custom select.
 */
export interface DependentFieldRenderProps {
  /** Field name */
  name: string;

  /** Field configuration from provider */
  config: DependentFieldConfig | undefined;

  /** Current value from store */
  storeValue: unknown;

  /** Change handler - updates store (triggers cascade) */
  onStoreChange: (value: unknown) => void;

  /** Options formatted for Ant Design Select */
  formattedOptions: FormattedSelectOption[];

  /** Raw options with all properties (parentValue, custom fields, etc.) */
  rawOptions: SelectOption[];

  /** Whether async options are loading */
  isLoading: boolean;

  /** Whether field is disabled (parent has no value) */
  isDisabledByParent: boolean;
}

/**
 * Props for DependentFieldWrapper component.
 */
export interface DependentFieldWrapperProps {
  /** Field name (must match a config in DependentSelectProvider) */
  name: string;

  /**
   * Render function receiving field props.
   * Return your custom UI using the provided props.
   */
  children: (props: DependentFieldRenderProps) => React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Headless wrapper using render props pattern.
 * Works with ANY form library or custom UI.
 *
 * Benefits:
 * - Complete control over rendering
 * - No Ant Design dependency in your custom component
 * - Easy integration with any form library
 *
 * @param props - Component props
 * @returns Rendered children or null if no config
 *
 * @example React Hook Form integration
 * ```tsx
 * <DependentFieldWrapper name="country">
 *   {({ onStoreChange, formattedOptions, isLoading, config }) => (
 *     <Controller
 *       name="country"
 *       control={control}
 *       render={({ field }) => (
 *         <Select
 *           value={field.value}
 *           onChange={(v) => {
 *             onStoreChange(v);  // Update store (cascade)
 *             field.onChange(v); // Update form
 *           }}
 *           options={formattedOptions}
 *           loading={isLoading}
 *           mode={config?.mode}
 *         />
 *       )}
 *     />
 *   )}
 * </DependentFieldWrapper>
 * ```
 *
 * @example Formik integration
 * ```tsx
 * <DependentFieldWrapper name="country">
 *   {({ onStoreChange, formattedOptions }) => (
 *     <Field name="country">
 *       {({ field, form }) => (
 *         <Select
 *           value={field.value}
 *           onChange={(v) => {
 *             onStoreChange(v);
 *             form.setFieldValue('country', v);
 *           }}
 *           options={formattedOptions}
 *         />
 *       )}
 *     </Field>
 *   )}
 * </DependentFieldWrapper>
 * ```
 *
 * @example Custom UI (no form library)
 * ```tsx
 * <DependentFieldWrapper name="country">
 *   {({ storeValue, onStoreChange, rawOptions, isLoading }) => (
 *     <div>
 *       {isLoading ? (
 *         <Spinner />
 *       ) : (
 *         <ul>
 *           {rawOptions.map((opt) => (
 *             <li
 *               key={opt.value}
 *               onClick={() => onStoreChange(opt.value)}
 *               className={storeValue === opt.value ? 'selected' : ''}
 *             >
 *               {opt.label}
 *             </li>
 *           ))}
 *         </ul>
 *       )}
 *     </div>
 *   )}
 * </DependentFieldWrapper>
 * ```
 */
export function DependentFieldWrapper({
  name,
  children,
}: DependentFieldWrapperProps) {
  // Get field state from store
  const {
    config: fieldConfig,
    options: rawOptions,
    value: storeValue,
    isLoading,
    isDisabledByParent,
    onChange: handleStoreChange,
  } = useDependentField(name);

  // Format options for Ant Design Select (memoized)
  const formattedOptions = useMemo(
    () => formatOptionsForSelect(rawOptions),
    [rawOptions],
  );

  // Warn in development if config not found
  if (!fieldConfig) {
    console.warn(
      `[DependentFieldWrapper] No config found for field "${name}". ` +
        'Make sure the field name matches a config in DependentSelectProvider.',
    );
    return null;
  }

  // Render children with props
  return (
    <>
      {children({
        name,
        config: fieldConfig,
        storeValue,
        onStoreChange: handleStoreChange,
        formattedOptions,
        rawOptions,
        isLoading,
        isDisabledByParent,
      })}
    </>
  );
}
