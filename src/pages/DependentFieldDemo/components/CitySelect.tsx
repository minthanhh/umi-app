/**
 * CitySelect Component
 *
 * Depends on ProvinceSelect - filters cities by selected province.
 * Value comes from Antd Form (via props), not from store.
 */

import { Select, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { useDependentField } from '@/lib/dependent-field';

import { fetchCities, type Option } from '../data';

interface CitySelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
}

export function CitySelect({ value, onChange }: CitySelectProps) {
  const {
    onSyncStore,
    dependencyValues,
    isDependencySatisfied,
  } = useDependentField<string>('city');

  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  const provinceValue = dependencyValues.province as string | undefined;

  // Fetch cities when province changes
  useEffect(() => {
    if (!provinceValue) {
      setOptions([]);
      return;
    }

    setLoading(true);
    fetchCities(provinceValue)
      .then(setOptions)
      .finally(() => setLoading(false));
  }, [provinceValue]);

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
          ? 'Please select a province first'
          : 'Select a city'
      }
      disabled={!isDependencySatisfied}
      loading={loading}
      allowClear
      style={{ width: '100%' }}
      notFoundContent={loading ? <Spin size="small" /> : undefined}
    />
  );
}
