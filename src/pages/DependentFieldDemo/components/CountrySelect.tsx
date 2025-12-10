/**
 * CountrySelect Component
 *
 * A standalone select for country - no dependencies.
 * Value comes from Antd Form (via props), not from store.
 */

import { Select } from 'antd';

import { useDependentField } from '@/lib/dependent-field';

import { countries } from '../data';

interface CountrySelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
}

export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const { onSyncStore } = useDependentField<string>('country');

  const handleChange = (newValue: string | undefined) => {
    // Sync to store (triggers dependency logic)
    onSyncStore(newValue);
    // Also call form's onChange
    onChange?.(newValue);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      options={countries}
      placeholder="Select a country"
      allowClear
      style={{ width: '100%' }}
    />
  );
}