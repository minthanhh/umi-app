/**
 * ProvinceSelect Component
 *
 * Depends on CountrySelect - filters provinces by selected country.
 * Value comes from Antd Form (via props), not from store.
 */

import { Select, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { useDependentField } from '@/lib/dependent-field';

import { fetchProvinces, type Option } from '../data';

interface ProvinceSelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
}

export function ProvinceSelect({ value, onChange }: ProvinceSelectProps) {
  const {
    onSyncStore,
    dependencyValues,
    isDependencySatisfied,
  } = useDependentField<string>('province');

  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  const countryValue = dependencyValues.country as string | undefined;

  // Fetch provinces when country changes
  useEffect(() => {
    if (!countryValue) {
      setOptions([]);
      return;
    }

    setLoading(true);
    fetchProvinces(countryValue)
      .then(setOptions)
      .finally(() => setLoading(false));
  }, [countryValue]);

  const selectOptions = useMemo(
    () => options.map((opt) => ({ label: opt.label, value: opt.value })),
    [options],
  );

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
      options={selectOptions}
      placeholder={
        !isDependencySatisfied
          ? 'Please select a country first'
          : 'Select a province'
      }
      disabled={!isDependencySatisfied}
      loading={loading}
      allowClear
      style={{ width: '100%' }}
      notFoundContent={loading ? <Spin size="small" /> : undefined}
    />
  );
}