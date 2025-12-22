/**
 * Antd Slider Field
 */

import { Slider } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { SliderFieldConfig } from '../types';

export function SliderField({
  config,
  value,
  onChange,
  disabled,
}: FieldComponentProps<SliderFieldConfig, number | [number, number]>) {
  const handleChange = (val: number | number[]) => {
    onChange?.(val as number | [number, number]);
  };

  if (config.range) {
    return (
      <Slider
        range
        value={value as [number, number]}
        onChange={handleChange}
        disabled={disabled}
        min={config.min}
        max={config.max}
        step={config.step}
        marks={config.marks}
      />
    );
  }

  return (
    <Slider
      value={value as number}
      onChange={handleChange}
      disabled={disabled}
      min={config.min}
      max={config.max}
      step={config.step}
      marks={config.marks}
    />
  );
}
