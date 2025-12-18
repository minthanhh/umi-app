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
  normalizeDependsOn,
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
    console.log(this.fieldRelationships)

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
   *
   * IMPORTANT: We check dependencies FIRST before version.
   * This ensures same object reference is returned when actual data hasn't changed,
   * preventing unnecessary re-renders when unrelated fields change.
   *
   * For multiple dependencies (dependsOn is array):
   * - parentValue: object containing all parent values { [fieldName]: value }
   * - parentValues: same as parentValue (for explicit access)
   */
  getFieldSnapshot = (fieldName: string): DependentFieldSnapshot => {
    // Fast path: unknown field
    if (!this.fieldNameSet.has(fieldName)) {
      return EMPTY_SNAPSHOT;
    }

    const config = this.configLookup.get(fieldName)!;
    const currentValue = this.fieldValues[fieldName];
    const isLoading = this.loadingFieldNames.has(fieldName);

    // Calculate parentValue based on dependsOn type
    let parentValue: unknown;
    let parentValues: Record<string, unknown> | undefined;

    if (config.dependsOn) {
      const parentNames = normalizeDependsOn(config.dependsOn);

      if (parentNames.length === 1) {
        // Single dependency - parentValue is the value directly
        parentValue = this.fieldValues[parentNames[0]];
      } else if (parentNames.length > 1) {
        // Multiple dependencies - parentValue is an object
        const values: Record<string, unknown> = {};
        for (const name of parentNames) {
          values[name] = this.fieldValues[name];
        }
        parentValue = values;
        parentValues = values;
      }
    }

    // Check cache - compare dependencies FIRST (not version)
    // This ensures we return the same reference when data hasn't changed,
    // even if storeVersion increased due to other field changes
    const cached = this.snapshotCache.get(fieldName);
    if (cached) {
      const [cachedValue, cachedParent, cachedLoading] = cached.dependencies as [
        unknown,
        unknown,
        boolean,
      ];

      // For multiple parents, we need to deep compare the parentValues object
      const parentValueEqual = this.areParentValuesEqual(cachedParent, parentValue);

      if (
        cachedValue === currentValue &&
        parentValueEqual &&
        cachedLoading === isLoading
      ) {
        // Dependencies match - return same reference to prevent re-render
        // Update version for consistency (optional optimization)
        if (cached.version !== this.storeVersion) {
          cached.version = this.storeVersion;
        }
        return cached.value;
      }
    }

    // Dependencies changed - compute new snapshot
    const snapshot: DependentFieldSnapshot = {
      value: currentValue,
      parentValue,
      parentValues,
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
   * Compare parentValue for caching purposes.
   * Handles both single value and object (multiple parents).
   */
  private areParentValuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    // Both are objects - compare keys and values
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (aObj[key] !== bObj[key]) return false;
    }

    return true;
  }

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
   *
   * For multiple dependencies (dependsOn is array):
   * - parentValue passed to filterOptions will be object { [fieldName]: value }
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

    // Calculate parentValue based on dependsOn type
    let parentValue: unknown;
    const parentNames = normalizeDependsOn(config.dependsOn);

    if (parentNames.length === 1) {
      // Single dependency
      parentValue = this.fieldValues[parentNames[0]];
    } else {
      // Multiple dependencies - create object
      const values: Record<string, unknown> = {};
      for (const name of parentNames) {
        values[name] = this.fieldValues[name];
      }
      parentValue = values;
    }

    // Check filtered cache
    const cached = this.filteredOptionsCache.get(fieldName);

    if (
      cached &&
      cached.version === this.storeVersion &&
      this.areParentValuesEqual(cached.parentValue, parentValue) &&
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

  /**
   * Cascade delete descendants when a parent value changes.
   *
   * For fields with multiple parents (dependsOn is array):
   * - Only clear child if ALL parents are empty
   * - For cascade delete, combine all parent values
   */
  private cascadeDeleteDescendants(
    fieldName: string,
    values: DependentFieldValues,
    changes: FieldChange[],
  ): void {
    const descendants = this.getDescendantsOf(fieldName);

    for (const descendant of descendants) {
      const relationship = this.fieldRelationships.get(descendant);
      const parentNames = relationship?.parent;
      if (!parentNames) continue;

      const currentValue = values[descendant];
      if (currentValue === undefined || currentValue === null) continue;

      const hasValue = Array.isArray(currentValue)
        ? currentValue.length > 0
        : true;
      if (!hasValue) continue;

      // Collect all parent values (handle both single and multiple parents)
      const allParentValues = this.collectParentValues(parentNames, values);

      // Rule 1: ALL parents empty -> clear child
      if (allParentValues.length === 0) {
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
          allParentValues as (string | number)[],
          options,
        );

        if (!areValuesEqual(currentValue, newValue)) {
          values[descendant] = newValue;
          changes.push({ name: descendant, value: newValue });
        }
      } else {
        // Rule 3: No parentValue in options -> clear on parent change
        const clearedValue = Array.isArray(currentValue) ? [] : undefined;
        if (!areValuesEqual(currentValue, clearedValue)) {
          values[descendant] = clearedValue;
          changes.push({ name: descendant, value: clearedValue });
        }
      }
    }
  }

  /**
   * Collect all parent values from single or multiple parents.
   * Returns a flat array of all parent values.
   */
  private collectParentValues(
    parentNames: string | string[] | null,
    values: DependentFieldValues,
  ): unknown[] {
    if (!parentNames) return [];

    const names = Array.isArray(parentNames) ? parentNames : [parentNames];
    const result: unknown[] = [];

    for (const name of names) {
      const value = values[name];
      if (Array.isArray(value)) {
        result.push(...value);
      } else if (value !== null && value !== undefined) {
        result.push(value);
      }
    }

    return result;
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

  /**
   * Initialize async options for fields with function-based options.
   *
   * For multiple parents (dependsOn is array):
   * - Only load if ALL parents have values
   * - parentValue passed to options function will be object { [fieldName]: value }
   */
  private initializeAsyncOptions(): void {
    for (const config of this.fieldConfigs) {
      if (typeof config.options !== 'function') continue;

      if (!config.dependsOn) {
        this.loadAsyncOptions(config.name, null);
      } else {
        const parentNames = normalizeDependsOn(config.dependsOn);

        if (parentNames.length === 1) {
          // Single dependency
          const parentValue = this.fieldValues[parentNames[0]];
          if (parentValue !== null && parentValue !== undefined) {
            this.loadAsyncOptions(config.name, parentValue);
          }
        } else {
          // Multiple dependencies - all must have value
          const allHaveValue = parentNames.every((name) => {
            const value = this.fieldValues[name];
            return value !== null && value !== undefined;
          });

          if (allHaveValue) {
            // Create object with all parent values
            const parentValues: Record<string, unknown> = {};
            for (const name of parentNames) {
              parentValues[name] = this.fieldValues[name];
            }
            this.loadAsyncOptions(config.name, parentValues);
          }
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