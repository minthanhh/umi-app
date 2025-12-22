/**
 * Antd Field Registry
 *
 * Pre-configured registry with all Ant Design field components.
 */

import { createRegistry, type FieldRegistry } from '../core';
import {
  InputField,
  TextareaField,
  NumberField,
  SelectField,
  CheckboxField,
  CheckboxGroupField,
  RadioField,
  SwitchField,
  DateField,
  DateRangeField,
  SliderField,
  RateField,
  XSelectField,
} from './fields';

/**
 * Default Antd field registry
 * Contains all built-in Antd field components
 *
 * @example
 * ```tsx
 * import { antdRegistry } from 'x-dynamic-form/antd';
 *
 * <FormProvider registry={antdRegistry}>
 *   <Field config={{ type: 'input', name: 'email' }} />
 * </FormProvider>
 * ```
 */
export const antdRegistry: FieldRegistry = createRegistry({
  input: InputField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  checkbox: CheckboxField,
  'checkbox-group': CheckboxGroupField,
  radio: RadioField,
  switch: SwitchField,
  date: DateField,
  'date-range': DateRangeField,
  slider: SliderField,
  rate: RateField,
  'x-select': XSelectField,
});

/**
 * Create a new registry that extends the default antd registry
 *
 * @example
 * ```tsx
 * const customRegistry = createAntdRegistry({
 *   'custom-input': CustomInputField,
 * });
 * ```
 */
export function createAntdRegistry(
  customComponents?: Record<string, React.ComponentType<any>>,
): FieldRegistry {
  if (!customComponents) {
    return new Map(antdRegistry);
  }

  const registry = new Map(antdRegistry);
  for (const [key, component] of Object.entries(customComponents)) {
    registry.set(key, component);
  }
  return registry;
}
