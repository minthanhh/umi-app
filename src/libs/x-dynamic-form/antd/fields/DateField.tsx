/**
 * Antd Date Fields
 */

import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import type { FieldComponentProps } from '../../core';
import type { DateFieldConfig, DateRangeFieldConfig } from '../types';

const { RangePicker } = DatePicker;

/**
 * Single Date Picker Field
 */
export function DateField({
  config,
  value,
  onChange,
  onBlur,
  disabled,
  error,
}: FieldComponentProps<DateFieldConfig, Dayjs | null>) {
  return (
    <DatePicker
      value={value}
      onChange={(v) => onChange?.(v)}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={config.placeholder}
      picker={config.picker}
      format={config.format}
      showTime={config.showTime}
      status={error ? 'error' : undefined}
      style={{ width: '100%' }}
    />
  );
}

/**
 * Date Range Picker Field
 */
export function DateRangeField({
  config,
  value,
  onChange,
  onBlur,
  disabled,
  error,
}: FieldComponentProps<DateRangeFieldConfig, [Dayjs | null, Dayjs | null] | null>) {
  return (
    <RangePicker
      value={value}
      onChange={(v) => onChange?.(v)}
      onBlur={onBlur}
      disabled={disabled}
      picker={config.picker}
      format={config.format}
      showTime={config.showTime}
      status={error ? 'error' : undefined}
      style={{ width: '100%' }}
    />
  );
}
