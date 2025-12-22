/**
 * Antd Select Field
 */

import { Select } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { SelectFieldConfig } from '../types';

export function SelectField({
  config,
  value,
  onChange,
  onBlur,
  disabled,
  error,
}: FieldComponentProps<SelectFieldConfig, unknown>) {
  return (
    <Select
      value={value}
      onChange={(v) => onChange?.(v)}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={config.placeholder}
      options={config.options}
      mode={config.mode}
      showSearch={config.showSearch}
      allowClear={config.allowClear}
      loading={config.loading}
      filterOption={config.filterOption}
      status={error ? 'error' : undefined}
      style={{ width: '100%' }}
    />
  );
}
