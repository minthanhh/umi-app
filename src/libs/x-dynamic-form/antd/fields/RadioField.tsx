/**
 * Antd Radio Field
 */

import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { RadioFieldConfig } from '../types';

export function RadioField({
  config,
  value,
  onChange,
  disabled,
}: FieldComponentProps<RadioFieldConfig, unknown>) {
  const handleChange = (e: RadioChangeEvent) => {
    onChange?.(e.target.value);
  };

  return (
    <Radio.Group
      value={value}
      onChange={handleChange}
      disabled={disabled}
      options={config.options}
      optionType={config.optionType}
      buttonStyle={config.buttonStyle}
    />
  );
}
