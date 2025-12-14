/**
 * DependentSelect - Store
 *
 * External store for managing dependent select state.
 * Designed for use with React's useSyncExternalStore.
 *
 * Architecture:
 * - Store manages: values, options cache, loading states, cascade logic
 * - Form library is SOURCE OF TRUTH for values (via adapter)
 * - Adapter syncs store changes back to form
 *
 * Optimizations:
 * - Computed state pattern with lazy evaluation and structural sharing
 * - Batched notifications via microtask (reduces re-renders)
 * - Request deduplication for async options (prevents duplicate API calls)
 * - Immutable loading state updates (Set recreation avoids mutation)
 * - Cached filtered options per parent value
 * - Version-based invalidation for computed values
 */

import type {
  DependentFieldConfig,
  DependentFieldSnapshot,
  DependentFieldValues,
  DependentFormAdapter,
  DependentRelationshipMap,
  SelectOption,
  StoreListener,
} from './types';
import {
  areValuesEqual,
  buildRelationshipMap,
  cascadeDelete,
  createDescendantsGetter,
  filterOptionsByParent,
} from './utils';

// ============================================================================
// TYPES - Internal types for the store
// ============================================================================

/** Represents a field change for batch updates */
interface FieldChange {
  name: string;
  value: unknown;
}

/** Computed value cache entry */
interface CachedComputed<T> {
  value: T;
  version: number;
  dependencies: unknown[];
}

/** Options cache entry with parent value tracking */
interface OptionsCacheEntry {
  options: SelectOption[];
  parentValue: unknown;
  version: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Empty array constant to avoid creating new arrays */
const EMPTY_ARRAY: readonly SelectOption[] = Object.freeze([]);

/** Empty snapshot for fields that don't exist */
const EMPTY_SNAPSHOT: DependentFieldSnapshot = Object.freeze({
  value: undefined,
  parentValue: undefined,
  isLoading: false,
});

// ============================================================================
// STORE CLASS
// ============================================================================

/**
 * External store for dependent select fields.
 *
 * Responsibilities:
 * - Manage field values with computed caching
 * - Cache options (static, async, and filtered)
 * - Handle cascade delete when parent values change
 * - Notify subscribers of changes (batched)
 * - Sync with form library via adapter
 *
 * Performance characteristics:
 * - getFieldSnapshot: O(1) with cache hit, O(1) computation on miss
 * - getOptions: O(1) with cache hit, O(n) filtering on miss
 * - setValue: O(d) where d = number of descendants
 * - subscribe/unsubscribe: O(1)
 *
 * @example
 * ```ts
 * const store = new DependentSelectStore(
 *   configs,
 *   { country: 'VN' },
 *   { onFieldChange: (name, value) => form.setFieldValue(name, value) }
 * );
 *
 * // Subscribe to changes
 * const unsubscribe = store.subscribe('country', () => {
 *   console.log('Country changed:', store.getFieldSnapshot('country'));
 * });
 *
 * // Update value
 * store.setValue('country', 'US');
 * ```
 */
export class DependentSelectStore {
  // ============================================================================
  // PRIVATE STATE
  // ============================================================================

  /** Current values for all fields */
  private fieldValues: DependentFieldValues;

  /** Loading field names (immutable Set for React compatibility) */
  private loadingFieldNames: ReadonlySet<string> = new Set();

  /** Cache for async-loaded options (fieldName -> options) */
  private asyncOptionsCache = new Map<string, SelectOption[]>();

  /** Options passed externally via setExternalOptions */
  private externalOptionsMap = new Map<string, SelectOption[]>();

  /** Global version counter for invalidation */
  private storeVersion = 0;

  // ============================================================================
  // PRIVATE CONFIG (immutable after construction)
  // ============================================================================

  /** Original configs array */
  private readonly fieldConfigs: ReadonlyArray<DependentFieldConfig>;

  /** Lookup map for quick config access */
  private readonly configLookup: ReadonlyMap<string, DependentFieldConfig>;

  /** Parent-child relationship map */
  private readonly fieldRelationships: DependentRelationshipMap;

  /** Pre-computed descendants getter (memoized) */
  private readonly getDescendantsOf: (fieldName: string) => string[];

  /** Set of all field names for quick validation */
  private readonly fieldNameSet: ReadonlySet<string>;

  // ============================================================================
  // PRIVATE SUBSCRIPTIONS
  // ============================================================================

  /** Map of field listeners */
  private fieldSubscribers = new Map<string, Set<StoreListener>>();

  // ============================================================================
  // PRIVATE COMPUTED CACHING
  // ============================================================================

  /** Snapshot cache with version tracking */
  private snapshotCache = new Map<string, CachedComputed<DependentFieldSnapshot>>();

  /** Filtered options cache with parent value tracking */
  private filteredOptionsCache = new Map<string, OptionsCacheEntry>();

  // ============================================================================
  // PRIVATE BATCHING
  // ============================================================================

  /** Fields pending notification */
  private pendingNotifications = new Set<string>();

  /** Whether notification is scheduled */
  private isNotificationScheduled = false;

  // ============================================================================
  // PRIVATE REQUEST DEDUPLICATION
  // ============================================================================

  /** Pending async requests */
  private pendingRequests = new Map<string, Promise<SelectOption[]>>();

  // ============================================================================
  // PRIVATE ADAPTER & LIFECYCLE
  // ============================================================================

  /** Form adapter for syncing */
  private formAdapter?: DependentFormAdapter;

  /** Store destroyed flag */
  private isDestroyed = false;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(
    configs: DependentFieldConfig[],
    initialValues: DependentFieldValues = {},
    adapter?: DependentFormAdapter,
  ) {
    // Freeze configs for immutability
    this.fieldConfigs = Object.freeze([...configs]);
    this.fieldValues = { ...initialValues };
    this.formAdapter = adapter;

    // Build lookup structures (O(n) once)
    this.configLookup = new Map(configs.map((c) => [c.name, c]));
    this.fieldNameSet = new Set(configs.map((c) => c.name));
    this.fieldRelationships = buildRelationshipMap(configs);

    // Create memoized descendants getter
    this.getDescendantsOf = createDescendantsGetter(this.fieldRelationships);

    // Initialize async options
    this.initializeAsyncOptions();
  }

  // ============================================================================
  // PUBLIC GETTERS - Optimized with computed caching
  // ============================================================================

  /**
   * Get snapshot for a field with structural sharing.
   * Returns cached value if dependencies unchanged.
   */
  getFieldSnapshot = (fieldName: string): DependentFieldSnapshot => {
    // Fast path: unknown field
    if (!this.fieldNameSet.has(fieldName)) {
      return EMPTY_SNAPSHOT;
    }

    const config = this.configLookup.get(fieldName)!;
    const currentValue = this.fieldValues[fieldName];
    const parentValue = config.dependsOn
      ? this.fieldValues[config.dependsOn]
      : undefined;
    const isLoading = this.loadingFieldNames.has(fieldName);

    // Check cache validity
    const cached = this.snapshotCache.get(fieldName);
    if (cached && cached.version === this.storeVersion) {
      const [cachedValue, cachedParent, cachedLoading] = cached.dependencies as [
        unknown,
        unknown,
        boolean,
      ];
      if (
        cachedValue === currentValue &&
        cachedParent === parentValue &&
        cachedLoading === isLoading
      ) {
        return cached.value;
      }
    }

    // Compute new snapshot
    const snapshot: DependentFieldSnapshot = {
      value: currentValue,
      parentValue,
      isLoading,
    };

    // Cache with dependencies
    this.snapshotCache.set(fieldName, {
      value: snapshot,
      version: this.storeVersion,
      dependencies: [currentValue, parentValue, isLoading],
    });

    return snapshot;
  };

  /**
   * Get config for a field.
   */
  getConfig = (fieldName: string): DependentFieldConfig | undefined => {
    return this.configLookup.get(fieldName);
  };

  /**
   * Get all configs.
   */
  getConfigs = (): ReadonlyArray<DependentFieldConfig> => {
    return this.fieldConfigs;
  };

  /**
   * Get all current values.
   */
  getValues = (): DependentFieldValues => {
    return this.fieldValues;
  };

  /**
   * Get filtered options with caching.
   * Caches filtered result per parent value.
   */
  getOptions = (
    fieldName: string,
    externalOptions?: SelectOption[],
  ): SelectOption[] => {
    const config = this.configLookup.get(fieldName);
    if (!config) return EMPTY_ARRAY as SelectOption[];

    // Resolve raw options
    const rawOptions = this.resolveOptions(fieldName, externalOptions);
    if (rawOptions.length === 0) return EMPTY_ARRAY as SelectOption[];

    // Root field - no filtering needed
    if (!config.dependsOn) {
      return rawOptions;
    }

    // Check filtered cache
    const parentValue = this.fieldValues[config.dependsOn];
    const cached = this.filteredOptionsCache.get(fieldName);

    if (
      cached &&
      cached.version === this.storeVersion &&
      cached.parentValue === parentValue &&
      cached.options === rawOptions
    ) {
      return cached.options;
    }

    // Filter options
    const filterFn = config.filterOptions ?? filterOptionsByParent;
    const filtered = filterFn(rawOptions, parentValue);

    // Cache result
    this.filteredOptionsCache.set(fieldName, {
      options: filtered,
      parentValue,
      version: this.storeVersion,
    });

    return filtered;
  };

  // ============================================================================
  // PUBLIC ACTIONS
  // ============================================================================

  /**
   * Set value with optimized cascade delete.
   */
  setValue = (fieldName: string, newValue: unknown): void => {
    if (this.isDestroyed) return;

    const currentValue = this.fieldValues[fieldName];
    if (areValuesEqual(currentValue, newValue)) return;

    // Increment version for cache invalidation
    this.storeVersion++;

    // Prepare batch update
    const changes: FieldChange[] = [{ name: fieldName, value: newValue }];
    const newValues = { ...this.fieldValues, [fieldName]: newValue };

    // Cascade delete descendants
    this.cascadeDeleteDescendants(fieldName, newValues, changes);

    // Commit atomically
    this.fieldValues = newValues;

    // Batch notify
    this.scheduleNotifications(changes.map((c) => c.name));

    // Sync to form
    this.syncToForm(changes);
  };

  /**
   * Batch set multiple values.
   * More efficient than calling setValue multiple times.
   */
  setValues = (values: Partial<DependentFieldValues>): void => {
    if (this.isDestroyed) return;

    const changes: FieldChange[] = [];
    const newValues = { ...this.fieldValues };
    const fieldsToProcess = new Set<string>();

    // Collect direct changes
    for (const [fieldName, newValue] of Object.entries(values)) {
      if (!this.fieldNameSet.has(fieldName)) continue;

      const currentValue = this.fieldValues[fieldName];
      if (!areValuesEqual(currentValue, newValue)) {
        newValues[fieldName] = newValue;
        changes.push({ name: fieldName, value: newValue });
        fieldsToProcess.add(fieldName);
      }
    }

    if (changes.length === 0) return;

    // Increment version
    this.storeVersion++;

    // Cascade delete for all changed fields
    for (const fieldName of fieldsToProcess) {
      this.cascadeDeleteDescendants(fieldName, newValues, changes);
    }

    // Commit
    this.fieldValues = newValues;

    // Notify
    this.scheduleNotifications(changes.map((c) => c.name));
    this.syncToForm(changes);
  };

  /**
   * Set external options.
   */
  setExternalOptions = (fieldName: string, options: SelectOption[]): void => {
    const current = this.externalOptionsMap.get(fieldName);
    if (current === options) return;
    if (current && this.areOptionsShallowEqual(current, options)) return;

    this.externalOptionsMap.set(fieldName, options);
    this.storeVersion++;

    // Clear filtered cache for this field
    this.filteredOptionsCache.delete(fieldName);
  };

  /**
   * Set form adapter.
   */
  setAdapter = (adapter?: DependentFormAdapter): void => {
    this.formAdapter = adapter;
  };

  /**
   * Sync controlled value.
   */
  syncControlledValue = (controlledValue: DependentFieldValues): void => {
    if (this.isDestroyed) return;

    const changedFields: string[] = [];
    const prevValues = this.fieldValues;

    for (const fieldName of this.fieldNameSet) {
      if (prevValues[fieldName] !== controlledValue[fieldName]) {
        changedFields.push(fieldName);
      }
    }

    if (changedFields.length === 0) return;

    this.storeVersion++;
    this.fieldValues = controlledValue;
    this.scheduleNotifications(changedFields);
  };

  // ============================================================================
  // PUBLIC SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to field changes.
   * Returns unsubscribe function.
   */
  subscribe = (fieldName: string, listener: StoreListener): (() => void) => {
    let subscribers = this.fieldSubscribers.get(fieldName);
    if (!subscribers) {
      subscribers = new Set();
      this.fieldSubscribers.set(fieldName, subscribers);
    }
    subscribers.add(listener);

    return () => {
      const subs = this.fieldSubscribers.get(fieldName);
      if (subs) {
        subs.delete(listener);
        if (subs.size === 0) {
          this.fieldSubscribers.delete(fieldName);
        }
      }
    };
  };

  // ============================================================================
  // PUBLIC CLEANUP
  // ============================================================================

  /**
   * Destroy store and cleanup.
   */
  destroy = (): void => {
    this.isDestroyed = true;
    this.fieldSubscribers.clear();
    this.snapshotCache.clear();
    this.filteredOptionsCache.clear();
    this.pendingRequests.clear();
    this.asyncOptionsCache.clear();
    this.externalOptionsMap.clear();
  };

  // ============================================================================
  // PRIVATE - Options Resolution
  // ============================================================================

  private resolveOptions(
    fieldName: string,
    externalOptions?: SelectOption[],
  ): SelectOption[] {
    // Priority 1: Direct external options
    if (externalOptions) return externalOptions;

    // Priority 2: Stored external options
    const stored = this.externalOptionsMap.get(fieldName);
    if (stored) return stored;

    const config = this.configLookup.get(fieldName);
    if (!config) return EMPTY_ARRAY as SelectOption[];

    // Priority 3: Async cache
    if (typeof config.options === 'function') {
      return this.asyncOptionsCache.get(fieldName) ?? (EMPTY_ARRAY as SelectOption[]);
    }

    // Priority 4: Static config
    return config.options ?? (EMPTY_ARRAY as SelectOption[]);
  }

  private areOptionsShallowEqual(a: SelectOption[], b: SelectOption[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].value !== b[i].value) return false;

      // Compare parentValue properly (can be array or primitive)
      const aPV = a[i].parentValue;
      const bPV = b[i].parentValue;

      if (aPV !== bPV) {
        // If both are arrays, compare contents
        if (Array.isArray(aPV) && Array.isArray(bPV)) {
          if (aPV.length !== bPV.length) return false;
          for (let j = 0; j < aPV.length; j++) {
            if (aPV[j] !== bPV[j]) return false;
          }
        } else {
          // Different types or different primitives
          return false;
        }
      }
    }
    return true;
  }

  // ============================================================================
  // PRIVATE - Cascade Delete (Optimized)
  // ============================================================================

  private cascadeDeleteDescendants(
    fieldName: string,
    values: DependentFieldValues,
    changes: FieldChange[],
  ): void {
    const descendants = this.getDescendantsOf(fieldName);

    for (const descendant of descendants) {
      const parentName = this.fieldRelationships.get(descendant)?.parent;
      if (!parentName) continue;

      const currentValue = values[descendant];
      if (currentValue === undefined || currentValue === null) continue;

      const hasValue = Array.isArray(currentValue)
        ? currentValue.length > 0
        : true;
      if (!hasValue) continue;

      const parentValues = this.normalizeToArray(values[parentName]);

      // Rule 1: Empty parent -> clear child
      if (parentValues.length === 0) {
        const clearedValue = Array.isArray(currentValue) ? [] : undefined;
        if (!areValuesEqual(currentValue, clearedValue)) {
          values[descendant] = clearedValue;
          changes.push({ name: descendant, value: clearedValue });
        }
        continue;
      }

      // Rule 2: Smart cascade with parentValue
      const options = this.resolveOptions(descendant);
      const hasParentValue = options.some((o) => o.parentValue !== undefined);

      if (hasParentValue) {
        const newValue = cascadeDelete(
          currentValue as string | number | (string | number)[] | null | undefined,
          parentValues as (string | number)[],
          options,
        );

        if (!areValuesEqual(currentValue, newValue)) {
          values[descendant] = newValue;
          changes.push({ name: descendant, value: newValue });
        }
      } else {
        // Rule 3: No parentValue -> clear on parent change
        const clearedValue = Array.isArray(currentValue) ? [] : undefined;
        if (!areValuesEqual(currentValue, clearedValue)) {
          values[descendant] = clearedValue;
          changes.push({ name: descendant, value: clearedValue });
        }
      }
    }
  }

  private normalizeToArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (value !== null && value !== undefined) return [value];
    return [];
  }

  // ============================================================================
  // PRIVATE - Notifications (Batched)
  // ============================================================================

  private scheduleNotifications(fieldNames: string[]): void {
    for (const name of fieldNames) {
      this.pendingNotifications.add(name);

      // Also notify children
      const children = this.fieldRelationships.get(name)?.children;
      if (children) {
        for (const child of children) {
          this.pendingNotifications.add(child);
        }
      }
    }

    if (!this.isNotificationScheduled) {
      this.isNotificationScheduled = true;

      queueMicrotask(() => {
        if (this.isDestroyed) return;

        // Copy and clear before notifying (prevents infinite loops)
        const toNotify = [...this.pendingNotifications];
        this.pendingNotifications.clear();
        this.isNotificationScheduled = false;

        // Notify subscribers
        for (const name of toNotify) {
          const subs = this.fieldSubscribers.get(name);
          if (subs) {
            for (const listener of subs) {
              listener();
            }
          }
        }
      });
    }
  }

  private syncToForm(changes: FieldChange[]): void {
    if (!this.formAdapter) return;

    if (this.formAdapter.onFieldsChange && changes.length > 1) {
      this.formAdapter.onFieldsChange(changes);
    } else {
      for (const { name, value } of changes) {
        this.formAdapter.onFieldChange(name, value);
      }
    }
  }

  // ============================================================================
  // PRIVATE - Async Options
  // ============================================================================

  private initializeAsyncOptions(): void {
    for (const config of this.fieldConfigs) {
      if (typeof config.options !== 'function') continue;

      if (!config.dependsOn) {
        this.loadAsyncOptions(config.name, null);
      } else {
        const parentValue = this.fieldValues[config.dependsOn];
        if (parentValue !== null && parentValue !== undefined) {
          this.loadAsyncOptions(config.name, parentValue);
        }
      }
    }
  }

  private async loadAsyncOptions(
    fieldName: string,
    parentValue: unknown,
  ): Promise<void> {
    if (this.isDestroyed) return;

    const config = this.configLookup.get(fieldName);
    if (!config || typeof config.options !== 'function') return;

    const cacheKey = `${fieldName}:${JSON.stringify(parentValue)}`;

    // Deduplicate requests
    if (this.pendingRequests.has(cacheKey)) return;

    // Set loading (immutable update)
    this.loadingFieldNames = new Set([...this.loadingFieldNames, fieldName]);
    this.storeVersion++;
    this.scheduleNotifications([fieldName]);

    const request = config.options(parentValue);
    this.pendingRequests.set(cacheKey, request);

    try {
      const options = await request;
      if (this.isDestroyed) return;

      this.asyncOptionsCache.set(fieldName, options);
      this.storeVersion++;
    } catch (error) {
      if (this.isDestroyed) return;

      console.error(
        `[DependentSelectStore] Failed to load options for "${fieldName}":`,
        error,
      );
      this.asyncOptionsCache.set(fieldName, []);
    } finally {
      if (this.isDestroyed) return;

      this.pendingRequests.delete(cacheKey);

      // Clear loading (immutable update)
      const newLoading = new Set(this.loadingFieldNames);
      newLoading.delete(fieldName);
      this.loadingFieldNames = newLoading;

      this.storeVersion++;
      this.scheduleNotifications([fieldName]);
    }
  }
}