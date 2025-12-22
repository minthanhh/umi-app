/**
 * XSelect Field Integration for Dynamic Form
 *
 * Integrates x-select library with x-dynamic-form for:
 * - Cascading/dependent selects
 * - Infinite scroll with React Query
 * - Static selects with metadata
 *
 * This field auto-wraps with XSelect.Dependent and/or XSelect.Infinite
 * based on the config.
 */

import React from 'react';
import { Select, Tag } from 'antd';
import type { FieldComponentProps } from '../../core';
import type { XSelectFieldConfig, StaticSelectFieldConfig, InfiniteSelectFieldConfig } from '../types';
import {
  XSelect,
  useDependentContext,
  useXSelectStoreOptional,
  ErrorDisplay,
} from '../../../x-select';
import type { BaseItem, FetchRequest, FetchResponse, StaticOption } from '../../../x-select';

// =============================================================================
// STATIC SELECT FIELD
// =============================================================================

interface StaticSelectInnerProps {
  config: StaticSelectFieldConfig;
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  error?: string;
}

function StaticSelectInner({ config, value, onChange, disabled, error }: StaticSelectInnerProps) {
  return (
    <XSelect.Static options={config.staticOptions || []}>
      {({ options, getOption, onChange: staticOnChange, value: staticValue, disabled: staticDisabled }) => (
        <Select
          value={(value ?? staticValue) as any}
          onChange={(onChange ?? staticOnChange) as any}
          options={options}
          disabled={disabled ?? staticDisabled}
          placeholder={config.placeholder}
          mode={config.mode}
          allowClear={config.allowClear}
          showSearch={config.showSearch}
          status={error ? 'error' : undefined}
          style={{ width: '100%' }}
          tagRender={config.showColorTags ? ({ value: tagValue, closable, onClose }) => {
            const opt = getOption(tagValue as string);
            return (
              <Tag
                color={opt?.color}
                closable={closable}
                onClose={onClose}
                style={{ marginRight: 3 }}
              >
                {opt?.label}
              </Tag>
            );
          } : undefined}
        />
      )}
    </XSelect.Static>
  );
}

// =============================================================================
// INFINITE SELECT FIELD
// =============================================================================

interface InfiniteSelectInnerProps<T extends BaseItem = BaseItem> {
  config: InfiniteSelectFieldConfig<T>;
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  error?: string;
}

function InfiniteSelectInner<T extends BaseItem = BaseItem>({
  config,
  value: propValue,
  onChange: propOnChange,
  disabled: propDisabled,
  error,
}: InfiniteSelectInnerProps<T>) {
  const dependentContext = useDependentContext();

  // Use dependent context values if available, otherwise use props
  const value = propValue ?? dependentContext?.value;
  const isDisabled = propDisabled ?? dependentContext?.isDisabledByParent;

  return (
    <XSelect.Infinite
      queryKey={config.queryKey}
      fetchList={config.fetchList}
      fetchByIds={config.fetchByIds}
      pageSize={config.pageSize}
      fetchStrategy={config.fetchStrategy}
      staleTime={config.staleTime}
      getItemId={config.getItemId}
      getItemLabel={config.getItemLabel}
      getItemParentValue={config.getItemParentValue}
      value={value as any}
      onChange={propOnChange as any}
      disabled={isDisabled}
      enabled={config.enabled}
    >
      {({
        value: infiniteValue,
        onChange: infiniteOnChange,
        options,
        loading,
        error: infiniteError,
        isRetrying,
        retry,
        onScroll,
        onOpenChange,
        onSearch,
        disabled: infiniteDisabled,
      }) => (
        <div>
          {infiniteError && config.showErrorDisplay !== false && (
            <ErrorDisplay
              error={infiniteError}
              onRetry={retry}
              isRetrying={isRetrying}
              style={{ marginBottom: 8 }}
            />
          )}
          <Select
            value={infiniteValue}
            onChange={infiniteOnChange}
            options={options}
            loading={loading}
            disabled={infiniteDisabled}
            placeholder={config.placeholder}
            mode={config.mode}
            allowClear={config.allowClear ?? true}
            showSearch
            onSearch={onSearch}
            filterOption={false}
            onPopupScroll={onScroll}
            onDropdownVisibleChange={onOpenChange}
            status={error || infiniteError ? 'error' : undefined}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </XSelect.Infinite>
  );
}

// =============================================================================
// MAIN XSELECT FIELD COMPONENT
// =============================================================================

export function XSelectField<T extends BaseItem = BaseItem>({
  config,
  value,
  onChange,
  disabled,
  error,
}: FieldComponentProps<XSelectFieldConfig<T>, unknown>) {
  // Check if we're inside XSelectProvider
  const store = useXSelectStoreOptional();
  const isInXSelectProvider = store !== null;

  // Determine select variant based on config
  const isStatic = 'staticOptions' in config && config.staticOptions;
  const isInfinite = 'queryKey' in config && config.queryKey;
  const hasDependency = 'dependsOn' in config && config.dependsOn;

  // Render content based on type
  const renderContent = () => {
    if (isStatic) {
      return (
        <StaticSelectInner
          config={config as StaticSelectFieldConfig}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
        />
      );
    }

    if (isInfinite) {
      return (
        <InfiniteSelectInner<T>
          config={config as InfiniteSelectFieldConfig<T>}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
        />
      );
    }

    // Fallback: basic select with options from config
    return (
      <Select
        value={value}
        onChange={(v) => onChange?.(v)}
        options={config.options}
        disabled={disabled}
        placeholder={config.placeholder}
        mode={config.mode}
        allowClear={config.allowClear}
        showSearch={config.showSearch}
        status={error ? 'error' : undefined}
        style={{ width: '100%' }}
      />
    );
  };

  // Wrap with XSelect.Dependent when:
  // 1. Has explicit dependency (dependsOn), OR
  // 2. Inside XSelectProvider (to sync root field values to store for cascading)
  // This ensures all fields in XSelectProvider sync their values to the store
  if (hasDependency || isInXSelectProvider) {
    return (
      <XSelect.Dependent name={config.name}>
        {renderContent()}
      </XSelect.Dependent>
    );
  }

  return renderContent();
}

export default XSelectField;
