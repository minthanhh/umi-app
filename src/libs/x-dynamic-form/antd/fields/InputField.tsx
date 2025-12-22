/**
 * Antd Input Field
 */

import { Input } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { InputFieldConfig } from '../types';

export function InputField({
  config,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  error,
}: FieldComponentProps<InputFieldConfig, string>) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  if (config.inputType === 'password') {
    return (
      <Input.Password
        value={value ?? ''}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={config.placeholder}
        maxLength={config.maxLength}
        prefix={config.prefix}
        status={error ? 'error' : undefined}
        allowClear={config.allowClear}
      />
    );
  }

  return (
    <Input
      type={config.inputType ?? 'text'}
      value={value ?? ''}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={config.placeholder}
      maxLength={config.maxLength}
      prefix={config.prefix}
      suffix={config.suffix}
      status={error ? 'error' : undefined}
      allowClear={config.allowClear}
    />
  );
}
