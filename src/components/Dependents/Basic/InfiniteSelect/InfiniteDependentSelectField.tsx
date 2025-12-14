/**
 * InfiniteDependentSelectField - Infinite Select tích hợp với DependentField
 *
 * Component kết hợp infinite scroll với DependentField system.
 * Tự động lấy parentValue từ DependentSelectProvider context.
 *
 * Features:
 * - Infinite scroll với React Query
 * - Tích hợp với DependentSelectProvider
 * - Auto-reset khi parent value thay đổi
 * - Cascade delete khi parent thay đổi
 */

import { Select, Spin } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';

import { useDependentField } from '../context';
import type { BaseItem, InfiniteDependentSelectFieldProps } from './types';
import { useInfiniteSelect } from './useInfiniteSelect';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Infinite scroll select tích hợp với DependentField.
 *
 * @example Basic usage with DependentSelectProvider
 * ```tsx
 * const configs = [
 *   { name: 'country', options: countries },
 *   { name: 'province', dependsOn: 'country' }, // options từ InfiniteDependentSelectField
 * ];
 *
 * <DependentSelectProvider configs={configs} adapter={adapter}>
 *   <FormDependentSelectField name="country" label="Country" />
 *
 *   <InfiniteDependentSelectField
 *     name="province"
 *     fetchList={async ({ current, pageSize, parentValue }) => {
 *       const res = await fetch(`/api/provinces?country=${parentValue}&page=${current}`);
 *       return res.json();
 *     }}
 *     getItemLabel={(item) => item.name}
 *   />
 * </DependentSelectProvider>
 * ```
 *
 * @example With Form.Item
 * ```tsx
 * <Form.Item name="city" label="City">
 *   <InfiniteDependentSelectField
 *     name="city"
 *     fetchList={fetchCities}
 *   />
 * </Form.Item>
 * ```
 */
export function InfiniteDependentSelectField<T extends BaseItem = BaseItem>({
  name,
  queryKeyPrefix = 'dependent',
  fetchList,
  fetchByIds,
  pageSize,
  fetchStrategy = 'lazy',
  staleTime,
  getItemId,
  getItemLabel,
  disabled,
  showLoadingMore = true,
  loadingMoreRender,
  onError,
  ...selectProps
}: InfiniteDependentSelectFieldProps<T>) {
  // Get field state from DependentField store
  const {
    config: fieldConfig,
    value: fieldValue,
    parentValue,
    isLoading: isConfigLoading,
    isDisabledByParent,
    onChange: handleFieldChange,
  } = useDependentField(name);

  // Track previous parentValue to detect changes
  const prevParentValueRef = useRef(parentValue);

  // Build query key with field name và parent value
  const queryKey = `${queryKeyPrefix}-${name}`;

  // Use infinite select hook
  const {
    options,
    isLoading,
    isHydrating,
    isFetchingMore,
    hasNextPage,
    error,
    onChange: handleInfiniteChange,
    onOpenChange,
    onScroll,
    onSearch,
    reset,
  } = useInfiniteSelect<T>({
    queryKey,
    fetchList,
    fetchByIds,
    pageSize,
    fetchStrategy,
    staleTime,
    getItemId,
    getItemLabel,
    parentValue,
    value: fieldValue as any,
    onChange: handleFieldChange as any,
    // Chỉ enable khi có parent value (nếu field có dependency)
    enabled: !isDisabledByParent,
  });

  // Reset infinite query khi parent value thay đổi
  useEffect(() => {
    if (prevParentValueRef.current !== parentValue) {
      prevParentValueRef.current = parentValue;

      // Chỉ reset nếu parent value có giá trị mới
      if (parentValue !== undefined && parentValue !== null) {
        reset();
      }
    }
  }, [parentValue, reset]);

  // Report error if callback provided
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Warn in development if config not found
  if (!fieldConfig) {
    console.warn(
      `[InfiniteDependentSelectField] No config found for field "${name}". ` +
        'Make sure the field name matches a config in DependentSelectProvider.',
    );
    return null;
  }

  // Format options for Ant Design Select
  const formattedOptions = useMemo(() => {
    const opts = options.map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));

    // Add loading more option at the end
    if (showLoadingMore && isFetchingMore && hasNextPage) {
      opts.push({
        label: loadingMoreRender ?? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Spin size="small" />
          </div>
        ),
        value: '__loading_more__',
        disabled: true,
      } as any);
    }

    return opts;
  }, [options, showLoadingMore, isFetchingMore, hasNextPage, loadingMoreRender]);

  // Determine loading and disabled states
  const isLoadingState = isLoading || isHydrating || isConfigLoading;
  const isFieldDisabled = disabled || isDisabledByParent;

  return (
    <Select
      // Value & Change handler
      value={fieldValue as any}
      onChange={handleInfiniteChange}
      // Options
      options={formattedOptions}
      // Config-based props
      mode={fieldConfig.mode}
      placeholder={fieldConfig.placeholder}
      // State
      disabled={isFieldDisabled}
      loading={isLoadingState}
      // Infinite scroll handlers
      onPopupScroll={onScroll}
      onDropdownVisibleChange={onOpenChange}
      // Search
      showSearch
      onSearch={onSearch}
      filterOption={false} // Server-side filtering
      // Default behaviors
      allowClear
      optionFilterProp="label"
      // Loading indicator
      notFoundContent={
        isLoadingState ? (
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <Spin size="small" />
          </div>
        ) : undefined
      }
      // Styling
      style={{ minWidth: 200, ...selectProps.style }}
      // Spread additional config selectProps
      {...fieldConfig.selectProps}
      // Pass through other props (highest priority)
      {...selectProps}
    />
  );
}

export default InfiniteDependentSelectField;