/**
 * Antd Textarea Field
 */

import { Input } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { TextareaFieldConfig } from '../types';

export function TextareaField({
  config,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  error,
}: FieldComponentProps<TextareaFieldConfig, string>) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <Input.TextArea
      value={value ?? ''}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={config.placeholder}
      rows={config.rows ?? 4}
      maxLength={config.maxLength}
      showCount={config.showCount}
      autoSize={config.autoSize}
      status={error ? 'error' : undefined}
    />
  );
}
