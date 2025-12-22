/**
 * Antd Rate Field
 */

import { Rate } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { RateFieldConfig } from '../types';

export function RateField({
  config,
  value,
  onChange,
  disabled,
}: FieldComponentProps<RateFieldConfig, number>) {
  return (
    <Rate
      value={value}
      onChange={(v) => onChange?.(v)}
      disabled={disabled}
      count={config.count}
      allowHalf={config.allowHalf}
      character={config.character}
    />
  );
}
