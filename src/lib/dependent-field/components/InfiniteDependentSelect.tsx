/**
 * InfiniteDependentSelect - Select component with infinite scroll + dependency
 *
 * Features:
 * - Infinite scroll loading
 * - Dependency on parent field
 * - Hydration for initial selected values
 * - Auto-disable when parent not selected
 */

import type { SelectProps } from 'antd';
import { Select, Spin } from 'antd';
import React, { useMemo } from 'react';

import {
  useInfiniteDependentField,
  type BaseItem,
  type InfiniteFieldConfig,
} from '../hooks/useInfiniteDependentField';

// ============================================================================
// Types
// ============================================================================

export interface InfiniteDependentSelectProps<
  T extends BaseItem = BaseItem,
> extends Omit<
  SelectProps,
  'options' | 'loading' | 'onPopupScroll' | 'open' | 'onDropdownVisibleChange'
> {
  /** Field name - must match a config in DependentFieldProvider */
  name: string;

  /** Infinite scroll configuration */
  infiniteConfig: InfiniteFieldConfig<T>;

  /** Custom render for option label */
  renderOption?: (item: T) => React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

function InfiniteDependentSelectInner<T extends BaseItem = BaseItem>({
  name,
  infiniteConfig,
  renderOption,
  disabled,
  mode,
  placeholder,
  ...selectProps
}: InfiniteDependentSelectProps<T>) {
  const {
    value,
    setValue,
    isDependencySatisfied,
    options,
    isLoading,
    isHydrating,
    isFetchingMore,
    hasNextPage,
    onOpenChange,
    onScroll,
    isOpen,
  } = useInfiniteDependentField<T>(name, infiniteConfig);

  // Convert to Ant Design options format
  const selectOptions = useMemo(() => {
    return options.map((opt) => ({
      label: renderOption ? renderOption(opt.item) : opt.label,
      value: opt.value,
      disabled: opt.disabled,
    }));
  }, [options, renderOption]);

  // Handle value change
  const handleChange = (newValue: any) => {
    setValue(newValue);
  };

  // Loading indicator in dropdown
  const dropdownRender = (menu: React.ReactElement) => (
    <>
      {menu}
      {(isFetchingMore || hasNextPage) && (
        <div style={{ textAlign: 'center', padding: 8 }}>
          {isFetchingMore ? (
            <Spin size="small" />
          ) : hasNextPage ? (
            <span style={{ color: '#999', fontSize: 12 }}>
              Scroll for more...
            </span>
          ) : null}
        </div>
      )}
    </>
  );

  // Not found content
  const notFoundContent = useMemo(() => {
    if (isLoading || isHydrating) {
      return <Spin size="small" />;
    }
    return undefined;
  }, [isLoading, isHydrating]);

  const isFieldDisabled = disabled || !isDependencySatisfied;

  return (
    <Select
      value={value as any}
      onChange={handleChange}
      options={selectOptions}
      mode={mode}
      placeholder={
        placeholder ?? (isFieldDisabled ? 'Select parent first' : 'Select...')
      }
      disabled={isFieldDisabled}
      loading={isLoading || isHydrating}
      open={isOpen}
      onDropdownVisibleChange={onOpenChange}
      onPopupScroll={onScroll}
      dropdownRender={dropdownRender}
      notFoundContent={notFoundContent}
      allowClear
      showSearch
      optionFilterProp="label"
      style={{ minWidth: 200 }}
      {...selectProps}
    />
  );
}

export const InfiniteDependentSelect = React.memo(
  InfiniteDependentSelectInner,
) as typeof InfiniteDependentSelectInner;

export default InfiniteDependentSelect;
