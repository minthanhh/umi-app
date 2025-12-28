/**
 * InfiniteWrapper - Infinite Scroll Select Wrapper
 *
 * Wrapper component for infinite scroll select.
 * Injects props into children (options, loading, fetchNextPage, etc.).
 *
 * Features:
 * - Infinite scroll with React Query useInfiniteQuery
 * - Hydration for selected values with useQuery
 * - Auto-get parentValue from DependentWrapper if nested
 * - Supports render props and React.cloneElement
 * - Full React Query options support via listQuery and hydrationQuery
 *
 * NOTE: Scroll handling is NOT included. Use fetchNextPage in your onPopupScroll.
 *
 * @example Basic usage with render props
 * ```tsx
 * <InfiniteWrapper
 *   queryKey="users"
 *   listQuery={{
 *     queryFn: async ({ pageParam, queryKey }) => {
 *       const [, , parentValue, search] = queryKey;
 *       const res = await fetch(`/api/users?page=${pageParam}&search=${search}`);
 *       const data = await res.json();
 *       return { data: data.items, nextPage: data.hasMore ? pageParam + 1 : undefined };
 *     },
 *     initialPageParam: 1,
 *     getNextPageParam: (lastPage) => lastPage.nextPage,
 *   }}
 *   hydrationQuery={{
 *     queryFn: async (_, ids) => {
 *       const res = await fetch(`/api/users?ids=${ids.join(',')}`);
 *       return res.json();
 *     },
 *   }}
 * >
 *   {(props) => (
 *     <Select
 *       options={props.options}
 *       loading={props.loading}
 *       onPopupScroll={(e) => {
 *         if (nearBottom(e) && props.hasNextPage) props.fetchNextPage();
 *       }}
 *     />
 *   )}
 * </InfiniteWrapper>
 * ```
 *
 * @example With itemAccessors
 * ```tsx
 * <InfiniteWrapper
 *   queryKey="users"
 *   listQuery={{ queryFn, initialPageParam: 1, getNextPageParam }}
 *   itemAccessors={{
 *     getId: (item) => item.id,
 *     getLabel: (item) => item.name,
 *     getParentValue: (item) => item.departmentId,
 *   }}
 * >
 *   {(props) => <Select {...props} />}
 * </InfiniteWrapper>
 * ```
 */

import React, { isValidElement, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactElement } from 'react';

import { useXSelectStore } from '../../contexts';
import { useAutoRegistration, useInfiniteSelect, useStableChildren, type RenderableChildren } from '../../hooks';
import type {
  BaseItem,
  HydrationQueryConfig,
  InfiniteOption,
  ItemAccessors,
  ListQueryConfig,
  SelectValue,
} from '../../types';
import { buildMetadataFromOptions, isMetadataEmpty } from '../../utils/metadata';

// ============================================================================
// TYPES
// ============================================================================

/** Props injected into children. */
export interface InfiniteInjectedProps<T extends BaseItem = BaseItem> {
  value: SelectValue;
  onChange: (value: SelectValue) => void;
  options: Array<{ label: string; value: string | number }>;
  rawOptions: InfiniteOption<T>[];
  items: T[];
  loading: boolean;
  isHydrating: boolean;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (value: string) => void;
  fetchNextPage: () => void;
  disabled?: boolean;
}

/** Props for InfiniteWrapper. */
export interface InfiniteWrapperProps<T extends BaseItem = BaseItem> {
  /** Unique query key */
  queryKey: string;

  /** List query configuration (useInfiniteQuery options) */
  listQuery: ListQueryConfig<T>;

  /** Hydration query configuration (useQuery options) */
  hydrationQuery?: HydrationQueryConfig<T>;

  /** Item accessor functions */
  itemAccessors?: ItemAccessors<T>;

  /** Field name (for auto-registration in standalone dynamic mode) */
  name?: string;

  /** Parent field dependency (for auto-registration) */
  dependsOn?: string | string[];

  /** Parent value (standalone usage) */
  parentValue?: unknown;

  /** Controlled value */
  value?: SelectValue;

  /** Change handler */
  onChange?: (value: SelectValue) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Enable/disable query */
  enabled?: boolean;

  /** Selection mode */
  mode?: 'multiple' | 'tags';

  /** Children - ReactElement or render function */
  children: RenderableChildren<InfiniteInjectedProps<T>>;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Check if parent value is empty */
function isParentValueEmpty(parentValue: unknown): boolean {
  if (parentValue === undefined || parentValue === null) return true;
  if (Array.isArray(parentValue) && parentValue.length === 0) return true;
  return false;
}

/** Props that can be passed to children select element. */
interface ChildSelectProps {
  value?: SelectValue;
  onChange?: (value: SelectValue) => void;
  options?: Array<{ label: string; value: string | number }>;
  loading?: boolean;
  disabled?: boolean;
  onDropdownVisibleChange?: (open: boolean) => void;
  showSearch?: boolean;
  onSearch?: (value: string) => void;
  filterOption?: boolean;
  allowClear?: boolean;
}

/** Clone element with merged props for Select component. */
function cloneSelectWithProps<T extends BaseItem>(
  element: ReactElement<ChildSelectProps>,
  injectedProps: InfiniteInjectedProps<T>,
): ReactElement<ChildSelectProps> {
  const childProps = element.props;

  return React.cloneElement(element, {
    value: injectedProps.value,
    onChange: injectedProps.onChange,
    options: injectedProps.options,
    loading: injectedProps.loading,
    disabled: childProps.disabled ?? injectedProps.disabled,
    onDropdownVisibleChange: injectedProps.onOpenChange,
    showSearch: true,
    onSearch: injectedProps.onSearch,
    filterOption: false,
    allowClear: childProps.allowClear ?? true,
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InfiniteWrapper<T extends BaseItem = BaseItem>({
  queryKey,
  listQuery,
  hydrationQuery,
  itemAccessors,
  
  name,
  dependsOn,
  parentValue,
  value,
  onChange,
  disabled,
  mode,
  
  enabled = true,
  children,

  ...restProps
}: InfiniteWrapperProps<T>) {
  const stableChildren = useStableChildren(children);
  const store = useXSelectStore();

  useAutoRegistration({
    name: name ?? '',
    dependsOn,
    mode,
    skip: !name,
  });

  const hasDependency = !!dependsOn;

  const isQueryEnabled = useMemo(() => {
    if (!enabled) return false;
    if (hasDependency && isParentValueEmpty(parentValue)) return false;
    return true;
  }, [enabled, hasDependency, parentValue]);

  const infiniteResult = useInfiniteSelect<T>({
    queryKey,
    listQuery,
    hydrationQuery,
    itemAccessors,
    parentValue,
    value,
    enabled: isQueryEnabled,
  });

  // Format options for Select component
  const formattedOptions = useMemo(
    () =>
      infiniteResult.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
    [infiniteResult.options],
  );

  // Current metadata for selected values (for hydration sync)
  const selectedValuesMetadata = useMemo(
    () => buildMetadataFromOptions(value, infiniteResult.options),
    [value, infiniteResult.options],
  );

  // Enhanced onChange that syncs metadata BEFORE notifying form
  const handleChange = useCallback(
    (newValue: SelectValue) => {
      // Sync metadata IMMEDIATELY when value changes
      // This ensures metadata is available before any cascade delete
      if (name) {
        const newMetadata = buildMetadataFromOptions(newValue, infiniteResult.options);
        console.log({newMetadata})
        if (!isMetadataEmpty(newMetadata)) {
          store.setValueMetadata(name, newMetadata);
        }
      }

      // Then notify the form
      onChange?.(newValue);
    },
    [name, store, infiniteResult.options, onChange],
  );


  // Build injected props
  const injectedProps: InfiniteInjectedProps<T> = {
    ...restProps,
    value,
    onChange: handleChange,
    disabled,
    options: formattedOptions,
    rawOptions: infiniteResult.options,
    items: infiniteResult.items,
    loading: infiniteResult.isLoading,
    isHydrating: infiniteResult.isHydrating,
    isFetchingMore: infiniteResult.isFetchingMore,
    hasNextPage: infiniteResult.hasNextPage,
    isOpen: infiniteResult.isOpen,
    onOpenChange: infiniteResult.onOpenChange,
    onSearch: infiniteResult.onSearch,
    fetchNextPage: infiniteResult.fetchNextPage,
  };

  // Sync metadata to store ONLY for hydration case
  // When user selects from list, handleChange already syncs metadata
  // This effect only runs when hydration completes (options fetched for existing values)
  useEffect(() => {
    // Only sync if we have hydrated options (not from user selection)
    // isHydrating = false means hydration completed
    if (name && !infiniteResult.isHydrating && !isMetadataEmpty(selectedValuesMetadata)) {
      console.log({ [name]: selectedValuesMetadata})
      store.setValueMetadata(name, selectedValuesMetadata);
    }
  }, [store, name, infiniteResult.isHydrating, selectedValuesMetadata]);

  return typeof stableChildren === 'function'
    ? stableChildren(injectedProps)
    : isValidElement<ChildSelectProps>(stableChildren)
      ? cloneSelectWithProps(stableChildren, injectedProps)
      : stableChildren;
}

export default InfiniteWrapper;