/**
 * DependentSelectField Wrappers
 *
 * Headless/Renderless pattern - tách logic khỏi UI
 *
 * Architecture:
 * - Form (Ant Design) is the SOURCE OF TRUTH for values
 * - Store provides: options, loading states, disabled states, cascade logic
 * - When user changes value → update both Form and Store
 * - When Store cascade-deletes → sync back to Form
 *
 * Components:
 * 1. DependentFieldWrapper - Render props pattern, works with any UI
 * 2. FormDependentSelectField - Ant Design Form + Select (convenience)
 * 3. useDependentFieldProps - Hook for custom implementations
 */

import type { FormItemProps, SelectProps } from 'antd';
import { Form, Select, Spin } from 'antd';
import { useCallback, useEffect, useMemo } from 'react';

import { useDependentField } from './context';
import type { DependentFieldConfig, SelectOption } from './types';

// ============================================================================
// Types for Wrapper
// ============================================================================

/** Props passed to render function */
export interface DependentFieldRenderProps {
  /** Current value from Store (use for reference, Form.Item manages actual value) */
  storeValue: any;
  /** Change handler - updates Store (Form.Item handles its own onChange) */
  onStoreChange: (value: any) => void;
  /** Options in standard format */
  options: Array<{ label: string; value: string | number; disabled?: boolean }>;
  /** Raw options from config */
  rawOptions: SelectOption[];
  /** Field config */
  config: DependentFieldConfig | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Disabled because parent has no value */
  isDisabledByParent: boolean;
  /** Field name */
  name: string;
}

/** Props for DependentFieldWrapper */
export interface DependentFieldWrapperProps {
  /** Field name matching config */
  name: string;
  /** Override disabled state */
  disabled?: boolean;
  /** Render function receiving field props */
  children: (props: DependentFieldRenderProps) => React.ReactNode;
}

// ============================================================================
// Hook - For fully custom implementations
// ============================================================================

/**
 * Hook to get all props needed for a dependent field.
 * Use this when you need full control.
 *
 * NOTE: Form library should be source of truth for values.
 * Store provides: options, loading, disabled states, cascade logic.
 *
 * @example
 * ```tsx
 * function MyCustomField({ name }) {
 *   const { options, isLoading, isDisabledByParent, onStoreChange } = useDependentFieldProps(name);
 *
 *   return (
 *     <MyFormLibrary.Field name={name}>
 *       {({ value, onChange }) => (
 *         <MySelect
 *           value={value}
 *           onChange={(v) => { onStoreChange(v); onChange(v); }}
 *           options={options}
 *           loading={isLoading}
 *           disabled={isDisabledByParent}
 *         />
 *       )}
 *     </MyFormLibrary.Field>
 *   );
 * }
 * ```
 */
export function useDependentFieldProps(
  name: string,
): DependentFieldRenderProps {
  const {
    config,
    options,
    value: storeValue,
    isLoading,
    isDisabledByParent,
    onChange: onStoreChange,
  } = useDependentField(name);

  const formattedOptions = useMemo(
    () =>
      options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        disabled: opt.disabled,
      })),
    [options],
  );

  const handleStoreChange = useCallback(
    (newValue: any) => {
      onStoreChange(newValue);
    },
    [onStoreChange],
  );

  return {
    storeValue,
    onStoreChange: handleStoreChange,
    options: formattedOptions,
    rawOptions: options,
    config,
    isLoading,
    isDisabledByParent,
    name,
  };
}

// ============================================================================
// Wrapper Component - Render Props Pattern
// ============================================================================

/**
 * Headless wrapper component using render props pattern.
 * Works with ANY form library or custom UI.
 *
 * IMPORTANT: Form library should be source of truth for values.
 * Store provides: options, loading, disabled states, cascade logic.
 * When user changes value → call onStoreChange AND form's onChange.
 *
 * @example Ant Design Form (recommended: use FormDependentSelectField instead)
 * ```tsx
 * <DependentFieldWrapper name="country">
 *   {({ onStoreChange, options, isLoading, config }) => (
 *     <Form.Item name="country" label="Country">
 *       <Select
 *         onChange={(v) => onStoreChange(v)} // Form.Item handles value
 *         options={options}
 *         loading={isLoading}
 *         mode={config?.mode}
 *       />
 *     </Form.Item>
 *   )}
 * </DependentFieldWrapper>
 * ```
 *
 * @example React Hook Form
 * ```tsx
 * <DependentFieldWrapper name="country">
 *   {({ onStoreChange, options, isLoading }) => (
 *     <Controller
 *       name="country"
 *       control={control}
 *       render={({ field }) => (
 *         <Select
 *           {...field}
 *           onChange={(v) => { onStoreChange(v); field.onChange(v); }}
 *           options={options}
 *           loading={isLoading}
 *         />
 *       )}
 *     />
 *   )}
 * </DependentFieldWrapper>
 * ```
 *
 * @example Formik
 * ```tsx
 * <DependentFieldWrapper name="country">
 *   {({ onStoreChange, options }) => (
 *     <Field name="country">
 *       {({ field, form }) => (
 *         <Select
 *           value={field.value}
 *           onChange={(v) => { onStoreChange(v); form.setFieldValue('country', v); }}
 *           options={options}
 *         />
 *       )}
 *     </Field>
 *   )}
 * </DependentFieldWrapper>
 * ```
 */
export function DependentFieldWrapper({
  name,
  children,
}: DependentFieldWrapperProps) {
  const props = useDependentFieldProps(name);

  if (!props.config) {
    console.warn(`DependentFieldWrapper: No config found for field "${name}"`);
    return null;
  }

  return <>{children(props)}</>;
}

// ============================================================================
// Ant Design Convenience Component
// ============================================================================

export interface FormDependentSelectFieldProps {
  /** Field name matching config */
  name: string;
  /** Form.Item label */
  label?: React.ReactNode;
  /** Form.Item rules */
  rules?: FormItemProps['rules'];
  /** Override disabled state */
  disabled?: boolean;
  /** Additional Form.Item props */
  formItemProps?: Omit<FormItemProps, 'name' | 'label' | 'rules'>;
  /** Additional Select props */
  selectProps?: Omit<
    SelectProps,
    'value' | 'onChange' | 'options' | 'mode' | 'loading' | 'disabled'
  >;
}

/**
 * Inner Select component that syncs Form ↔ Store
 *
 * Flow:
 * 1. Form.Item injects value/onChange to this component
 * 2. When user selects → update Store via onStoreChange
 * 3. When Store cascade-deletes → sync back to Form via form.setFieldValue
 */
interface SyncedSelectProps extends Omit<SelectProps, 'value' | 'onChange'> {
  value?: any;
  onChange?: (value: any) => void;
  storeValue: any;
  onStoreChange: (value: any) => void;
  name: string;
}

function SyncedSelect({
  value,
  onChange,
  storeValue,
  onStoreChange,
  name,
  ...rest
}: SyncedSelectProps) {
  const form = Form.useFormInstance();

  // Sync Store → Form when store value changes (e.g., cascade delete)
  useEffect(() => {
    // Only sync if store value is different from form value
    // This handles cascade delete scenarios
    if (storeValue !== value) {
      form.setFieldValue(name, storeValue);
    }
  }, [storeValue, form, name, value]);

  // Handle user selection - update both Form and Store
  const handleChange = useCallback(
    (newValue: any) => {
      // Update Store (triggers cascade logic)
      onStoreChange(newValue);
      // Update Form (Form.Item's onChange)
      onChange?.(newValue);
    },
    [onChange, onStoreChange],
  );

  return <Select value={value} onChange={handleChange} {...rest} />;
}

/**
 * Convenience component for Ant Design Form + Select.
 *
 * Architecture:
 * - Form.Item is the source of truth for the value
 * - Store provides options, loading, disabled states
 * - Changes sync bidirectionally:
 *   - User selects → Store (cascade logic) → Form
 *   - Store cascade-deletes → Form
 *
 * For other form libraries, use DependentFieldWrapper or useDependentFieldProps.
 */
export function FormDependentSelectField({
  name,
  label,
  rules,
  disabled,
  formItemProps,
  selectProps,
}: FormDependentSelectFieldProps) {
  return (
    <DependentFieldWrapper name={name}>
      {({ storeValue, onStoreChange, options, isLoading, isDisabledByParent, config }) => (
        <Form.Item name={name} label={label} rules={rules} {...formItemProps}>
          <SyncedSelect
            storeValue={storeValue}
            onStoreChange={onStoreChange}
            name={name}
            options={options}
            mode={config?.mode}
            placeholder={config?.placeholder}
            disabled={disabled || isDisabledByParent}
            loading={isLoading}
            allowClear
            showSearch
            optionFilterProp="label"
            notFoundContent={isLoading ? <Spin size="small" /> : undefined}
            style={{ minWidth: 200 }}
            {...config?.selectProps}
            {...selectProps}
          />
        </Form.Item>
      )}
    </DependentFieldWrapper>
  );
}

export default FormDependentSelectField;
