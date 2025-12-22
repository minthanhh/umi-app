/**
 * Antd Number Field
 */

import { InputNumber } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { NumberFieldConfig } from '../types';

export function NumberField({
  config,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  error,
}: FieldComponentProps<NumberFieldConfig, number | null>) {
  return (
    <InputNumber
      value={value}
      onChange={(v) => onChange?.(v)}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={config.placeholder}
      min={config.min}
      max={config.max}
      step={config.step}
      precision={config.precision}
      prefix={config.prefix}
      suffix={config.suffix}
      status={error ? 'error' : undefined}
      style={{ width: '100%' }}
    />
  );
}
