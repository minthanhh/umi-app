/**
 * Antd Checkbox Fields
 */

import { Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { FieldComponentProps } from '../../core';
import type { CheckboxFieldConfig, CheckboxGroupFieldConfig } from '../types';

/**
 * Single Checkbox Field
 */
export function CheckboxField({
  config,
  value,
  onChange,
  disabled,
}: FieldComponentProps<CheckboxFieldConfig, boolean>) {
  const handleChange = (e: CheckboxChangeEvent) => {
    onChange?.(e.target.checked);
  };

  return (
    <Checkbox checked={value ?? false} onChange={handleChange} disabled={disabled}>
      {config.checkboxLabel}
    </Checkbox>
  );
}

/**
 * Checkbox Group Field
 */
export function CheckboxGroupField({
  config,
  value,
  onChange,
  disabled,
}: FieldComponentProps<CheckboxGroupFieldConfig, unknown[]>) {
  return (
    <Checkbox.Group value={value ?? []} onChange={(v) => onChange?.(v)} disabled={disabled} options={config.options} />
  );
}
