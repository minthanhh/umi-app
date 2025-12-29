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

import type { ReactElement } from 'react';
import React, { isValidElement, useCallback, useMemo, useRef } from 'react';

import { useXSelectStore } from '../../contexts';
import {
  useAutoRegistration,
  useInfiniteSelect,
  useStableChildren,
  type RenderableChildren,
} from '../../hooks';
import type {
  BaseItem,
  HydrationQueryConfig,
  InfiniteOption,
  ItemAccessors,
  ListQueryConfig,
  SelectValue,
  ValueMetadataMap,
} from '../../types';
import {
  buildMetadataFromOptions,
  isMetadataEmpty,
} from '../../utils/metadata';

// ============================================================================
// STABLE OPTIONS CACHE
// ============================================================================

interface FormattedOption {
  label: string;
  value: string | number;
}

/**
 * Creates stable formatted options by reusing object references when possible.
 * This prevents unnecessary re-renders in Select components that use reference equality.
 */
function useStableFormattedOptions<T extends BaseItem>(
  options: InfiniteOption<T>[],
): FormattedOption[] {
  const cacheRef = useRef<Map<string | number, FormattedOption>>(new Map());
  const prevResultRef = useRef<FormattedOption[]>([]);

  return useMemo(() => {
    const cache = cacheRef.current;
    const result: FormattedOption[] = [];
    let hasChanged = options.length !== prevResultRef.current.length;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const cached = cache.get(opt.value);

      if (cached && cached.label === opt.label) {
        // Reuse existing object reference
        result.push(cached);
        if (!hasChanged && prevResultRef.current[i] !== cached) {
          hasChanged = true;
        }
      } else {
        // Create new object and cache it
        const newOption: FormattedOption = {
          label: opt.label,
          value: opt.value,
        };
        cache.set(opt.value, newOption);
        result.push(newOption);
        hasChanged = true;
      }
    }

    // Clean up stale cache entries periodically (when cache is 2x larger than needed)
    if (cache.size > options.length * 2) {
      const currentValues = new Set(options.map((o) => o.value));
      for (const key of cache.keys()) {
        if (!currentValues.has(key)) {
          cache.delete(key);
        }
      }
    }

    // Return previous result if nothing changed (stable reference)
    if (!hasChanged) {
      return prevResultRef.current;
    }

    prevResultRef.current = result;
    return result;
  }, [options]);
}

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

  // Format options for Select component with stable references
  const formattedOptions = useStableFormattedOptions(infiniteResult.options);

  // Maintain a stable Map of options for O(1) metadata lookup
  // This prevents race conditions when options array changes during selection
  const optionsMapRef = useRef<Map<string | number, InfiniteOption<T>>>(
    new Map(),
  );

  // Keep optionsMap in sync with options array
  useMemo(() => {
    const map = optionsMapRef.current;
    // Add new options (don't clear - preserve metadata for previously seen options)
    for (const opt of infiniteResult.options) {
      map.set(opt.value, opt);
    }
    // Cleanup: limit map size to prevent unbounded growth
    if (map.size > infiniteResult.options.length * 3) {
      const currentValues = new Set(infiniteResult.options.map((o) => o.value));
      for (const key of map.keys()) {
        if (!currentValues.has(key)) {
          map.delete(key);
        }
      }
    }
  }, [infiniteResult.options]);

  // Track previous hydration state to detect when hydration completes
  const prevIsHydratingRef = useRef(infiniteResult.isHydrating);
  const hasHydrationCompletedRef = useRef(false);

  // Enhanced onChange that syncs metadata BEFORE notifying form
  // Uses optionsMapRef for stable lookup even if options array is stale
  const handleChange = useCallback(
    (newValue: SelectValue) => {
      // Sync metadata IMMEDIATELY when value changes
      // Use optionsMapRef for stable lookup - prevents race condition when
      // user selects an item that was fetched via search but not yet in main list
      if (name && newValue !== undefined && newValue !== null) {
        const selectedValues = Array.isArray(newValue) ? newValue : [newValue];
        const newMetadata: ValueMetadataMap = {};
        let hasMetadata = false;

        for (const val of selectedValues) {
          const option = optionsMapRef.current.get(val as string | number);
          if (option?.parentValue !== undefined) {
            // Normalize parentValue to match ValueMetadataEntry type
            const pv = option.parentValue;
            if (
              typeof pv === 'string' ||
              typeof pv === 'number' ||
              Array.isArray(pv) ||
              (typeof pv === 'object' && pv !== null)
            ) {
              newMetadata[val as string | number] = {
                parentValue: pv as
                  | string
                  | number
                  | (string | number)[]
                  | Record<string, unknown>,
              };
              hasMetadata = true;
            }
          } else if (option) {
            // Option exists but no parentValue - still track it
            newMetadata[val as string | number] = { parentValue: undefined };
            hasMetadata = true;
          }
        }

        if (hasMetadata) {
          store.setValueMetadata(name, newMetadata);
        }
      }

      // Then notify the form
      onChange?.(newValue);
    },
    [name, store, onChange],
  );

  // Sync metadata SYNCHRONOUSLY when hydration completes (not in effect)
  // This ensures metadata is available before any cascade delete triggered by parent change
  if (name && prevIsHydratingRef.current && !infiniteResult.isHydrating) {
    // Hydration just completed - sync metadata immediately
    const metadata = buildMetadataFromOptions(value, infiniteResult.options);
    if (!isMetadataEmpty(metadata)) {
      store.setValueMetadata(name, metadata);
    }
    hasHydrationCompletedRef.current = true;
  }
  prevIsHydratingRef.current = infiniteResult.isHydrating;

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

  return typeof stableChildren === 'function'
    ? stableChildren(injectedProps)
    : isValidElement<ChildSelectProps>(stableChildren)
      ? cloneSelectWithProps(stableChildren, injectedProps)
      : stableChildren;
}

export default InfiniteWrapper;
