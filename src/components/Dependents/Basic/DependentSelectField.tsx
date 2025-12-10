/**
 * DependentSelectField - Individual Select Component
 *
 * Wrapper component for Ant Design Select that integrates with DependentSelectProvider
 */

import { Select, Spin } from 'antd';
import { useMemo } from 'react';

import { useDependentField } from './context';
import type { DependentSelectFieldProps } from './types';

export function DependentSelectField({
  name,
  disabled,
  className,
  style,
}: DependentSelectFieldProps) {
  const { config, options, value, isLoading, isDisabledByParent, onChange } =
    useDependentField(name);

  // Convert options to Ant Design format
  const selectOptions = useMemo(
    () =>
      options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        disabled: opt.disabled,
      })),
    [options],
  );

  if (!config) {
    console.warn(`DependentSelectField: No config found for field "${name}"`);
    return null;
  }

  const isFieldDisabled = disabled || isDisabledByParent;

  return (
    <Select
      value={value}
      onChange={onChange}
      options={selectOptions}
      mode={config.mode}
      placeholder={config.placeholder}
      disabled={isFieldDisabled}
      loading={isLoading}
      allowClear
      showSearch
      optionFilterProp="label"
      notFoundContent={isLoading ? <Spin size="small" /> : undefined}
      className={className}
      style={{ minWidth: 200, ...style }}
      {...config.selectProps}
    />
  );
}

export default DependentSelectField;
