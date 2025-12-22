/**
 * X-Dynamic-Form Field Component
 *
 * The core Field component that resolves and renders field components
 * based on config type. This is framework-agnostic.
 */

import type { ReactElement } from 'react';
import { useFormContext } from './context';
import type { BaseFieldConfig, FieldConfig, FieldComponentProps } from './types';

// =============================================================================
// FIELD PROPS
// =============================================================================

export interface FieldProps<TConfig extends BaseFieldConfig = FieldConfig> {
  /** Field configuration */
  config: TConfig;
  /** Current value (controlled) */
  value?: unknown;
  /** Callback when value changes (controlled) */
  onChange?: (value: unknown) => void;
  /** Callback when field loses focus */
  onBlur?: () => void;
  /** Error message */
  error?: string;
  /** Override disabled state */
  disabled?: boolean;
  /** Override read-only state */
  readOnly?: boolean;
}

// =============================================================================
// FIELD COMPONENT
// =============================================================================

/**
 * Field - Resolves and renders a field component based on config.type
 *
 * This component is the bridge between your field config and the actual
 * field component. It looks up the component from the registry and passes
 * all necessary props.
 *
 * @example
 * ```tsx
 * // Basic usage with controlled value
 * <Field
 *   config={{ type: 'input', name: 'email', label: 'Email' }}
 *   value={email}
 *   onChange={setEmail}
 * />
 *
 * // Usage with FormProvider context (for getValue/setValue)
 * <FormProvider registry={registry} getValue={getValue} setValue={setValue}>
 *   <Field config={{ type: 'input', name: 'email' }} />
 * </FormProvider>
 * ```
 */
export function Field<TConfig extends FieldConfig>({
  config,
  value: controlledValue,
  onChange: controlledOnChange,
  onBlur,
  error: controlledError,
  disabled: disabledOverride,
  readOnly: readOnlyOverride,
}: FieldProps<TConfig>): ReactElement | null {
  const { registry, FormItemWrapper, getValue, setValue, getError } = useFormContext();

  // Resolve the component from registry
  const Component = registry.get(config.type);

  if (!Component) {
    console.warn(`[x-dynamic-form] No component registered for type: "${config.type}"`);
    return null;
  }

  // Determine disabled/readOnly state
  const disabled = disabledOverride ?? config.disabled ?? false;
  const readOnly = readOnlyOverride ?? config.readOnly ?? false;

  // When using FormItemWrapper (like Antd Form.Item with name), the wrapper
  // will inject value/onChange into the children. In this case, we should NOT
  // pass value/onChange from context to avoid conflicts.
  // The field component will receive value/onChange from Form.Item's cloneElement.
  if (FormItemWrapper) {
    // Only use controlled props or let Form.Item handle it
    const error = controlledError ?? getError?.(config.name);

    // Build minimal props - Form.Item will inject value/onChange
    const fieldProps: FieldComponentProps<TConfig> = {
      config,
      // Only pass controlled value/onChange if explicitly provided
      // Otherwise, Form.Item will inject these via cloneElement
      ...(controlledValue !== undefined && { value: controlledValue }),
      ...(controlledOnChange && { onChange: controlledOnChange }),
      onBlur,
      disabled,
      readOnly,
      error,
      name: config.name,
    };

    const fieldElement = <Component {...fieldProps} />;

    return (
      <FormItemWrapper config={config} error={error}>
        {fieldElement}
      </FormItemWrapper>
    );
  }

  // Without FormItemWrapper, use context-based value management
  const value = controlledValue !== undefined ? controlledValue : getValue?.(config.name);
  const onChange = controlledOnChange ?? ((newValue: unknown) => setValue?.(config.name, newValue));
  const error = controlledError ?? getError?.(config.name);

  const fieldProps: FieldComponentProps<TConfig> = {
    config,
    value,
    onChange,
    onBlur,
    disabled,
    readOnly,
    error,
    name: config.name,
  };

  return <Component {...fieldProps} />;
}

// =============================================================================
// FIELD LIST
// =============================================================================

export interface FieldListProps {
  /** Array of field configurations */
  configs: FieldConfig[];
  /** Shared props to pass to all fields */
  sharedProps?: Partial<FieldProps>;
  /** Render prop for custom layout */
  renderField?: (field: ReactElement, config: FieldConfig, index: number) => ReactElement;
}

/**
 * FieldList - Renders multiple fields from an array of configs
 *
 * @example
 * ```tsx
 * const schema = [
 *   { type: 'input', name: 'firstName', label: 'First Name' },
 *   { type: 'input', name: 'lastName', label: 'Last Name' },
 * ];
 *
 * <FieldList configs={schema} />
 *
 * // With custom layout
 * <FieldList
 *   configs={schema}
 *   renderField={(field, config, index) => (
 *     <Col key={config.name} span={12}>{field}</Col>
 *   )}
 * />
 * ```
 */
export function FieldList({ configs, sharedProps, renderField }: FieldListProps): ReactElement {
  return (
    <>
      {configs.map((config, index) => {
        const field = <Field key={config.name} config={config} {...sharedProps} />;

        if (renderField) {
          return renderField(field, config, index);
        }

        return field;
      })}
    </>
  );
}
