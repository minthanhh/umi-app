/**
 * Antd Switch Field
 */

import { Switch } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { SwitchFieldConfig } from '../types';

export function SwitchField({
  config,
  value,
  onChange,
  disabled,
}: FieldComponentProps<SwitchFieldConfig, boolean>) {
  return (
    <Switch
      checked={value ?? false}
      onChange={(checked) => onChange?.(checked)}
      disabled={disabled}
      checkedChildren={config.checkedChildren}
      unCheckedChildren={config.unCheckedChildren}
    />
  );
}
