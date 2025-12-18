/**
 * XSelect - Store
 *
 * External store for managing cascading select state.
 * Designed for use with React's useSyncExternalStore.
 *
 * Architecture:
 * - Store manages: values, options cache, loading states, cascade logic
 * - Form library is SOURCE OF TRUTH for values (via adapter)
 * - Adapter syncs store changes back to form
 *
 * Optimizations:
 * - Computed state with lazy evaluation and structural sharing
 * - Batched notifications via microtask
 * - Request deduplication for async options
 * - Cached filtered options per parent value
 */

import type {
  FieldConfig,
  FieldSnapshot,
  FieldValues,
  FormAdapter,
  RelationshipMap,
  XSelectOption,
  StoreListener,
} from '../types';

import {
  areValuesEqual,
  buildRelationshipMap,
  cascadeDelete,
  cascadeDeleteMultiParent,
  createDescendantsGetter,
  filterOptionsByParent,
  normalizeDependsOn,
} from '../utils';

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface FieldChange {
  name: string;
  value: unknown;
}

interface CachedComputed<T> {
  value: T;
  version: number;
  dependencies: unknown[];
}

interface OptionsCacheEntry {
  options: XSelectOption[];
  parentValue: unknown;
  version: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EMPTY_ARRAY: readonly XSelectOption[] = Object.freeze([]);

const EMPTY_SNAPSHOT: FieldSnapshot = Object.freeze({
  value: undefined,
  parentValue: undefined,
  isLoading: false,
});

// ============================================================================
// STORE CLASS
// ============================================================================

/**
 * External store for cascading select fields.
 *
 * @example
 * ```ts
 * const store = new XSelectStore(
 *   configs,
 *   { country: 'VN' },
 *   { onFieldChange: (name, value) => form.setFieldValue(name, value) }
 * );
 *
 * const unsubscribe = store.subscribe('country', () => {
 *   console.log('Country changed:', store.getFieldSnapshot('country'));
 * });
 *
 * store.setValue('country', 'US');
 * ```
 */
export class XSelectStore {
  // State
  private fieldValues: FieldValues;
  private loadingFieldNames: ReadonlySet<string> = new Set();
  private asyncOptionsCache = new Map<string, XSelectOption[]>();
  private externalOptionsMap = new Map<string, XSelectOption[]>();
  private storeVersion = 0;

  // Config (immutable)
  private readonly fieldConfigs: ReadonlyArray<FieldConfig>;
  private readonly configLookup: ReadonlyMap<string, FieldConfig>;
  private readonly fieldRelationships: RelationshipMap;
  private readonly getDescendantsOf: (fieldName: string) => string[];
  private readonly fieldNameSet: ReadonlySet<string>;

  // Subscriptions
  private fieldSubscribers = new Map<string, Set<StoreListener>>();

  // Caching
  private snapshotCache = new Map<string, CachedComputed<FieldSnapshot>>();
  private filteredOptionsCache = new Map<string, OptionsCacheEntry>();

  // Batching
  private pendingNotifications = new Set<string>();
  private isNotificationScheduled = false;

  // Request deduplication
  private pendingRequests = new Map<string, Promise<XSelectOption[]>>();

  // Adapter & lifecycle
  private formAdapter?: FormAdapter;
  private isDestroyed = false;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(
    configs: FieldConfig[],
    initialValues: FieldValues = {},
    adapter?: FormAdapter,
  ) {
    this.fieldConfigs = Object.freeze([...configs]);
    this.fieldValues = { ...initialValues };
    this.formAdapter = adapter;

    // Build lookup structures
    this.configLookup = new Map(configs.map((c) => [c.name, c]));
    this.fieldNameSet = new Set(configs.map((c) => c.name));
    this.fieldRelationships = buildRelationshipMap(configs);
    console.log({fieldRelationships: this.fieldRelationships})
    this.getDescendantsOf = createDescendantsGetter(this.fieldRelationships);

    // Initialize async options
    this.initializeAsyncOptions();
  }

  // ============================================================================
  // PUBLIC GETTERS
  // ============================================================================

  /**
   * Get field snapshot with structural sharing.
   */
  getFieldSnapshot = (fieldName: string): FieldSnapshot => {
    if (!this.fieldNameSet.has(fieldName)) {
      return EMPTY_SNAPSHOT;
    }

    const config = this.configLookup.get(fieldName)!;
    const currentValue = this.fieldValues[fieldName];
    const isLoading = this.loadingFieldNames.has(fieldName);

    // Calculate parentValue
    let parentValue: unknown;
    let parentValues: Record<string, unknown> | undefined;

    if (config.dependsOn) {
      const parentNames = normalizeDependsOn(config.dependsOn);

      if (parentNames.length === 1) {
        parentValue = this.fieldValues[parentNames[0]];
      } else if (parentNames.length > 1) {
        const values: Record<string, unknown> = {};
        for (const name of parentNames) {
          values[name] = this.fieldValues[name];
        }
        parentValue = values;
        parentValues = values;
      }
    }

    // Check cache
    const cached = this.snapshotCache.get(fieldName);
    if (cached) {
      const [cachedValue, cachedParent, cachedLoading] = cached.dependencies as [
        unknown,
        unknown,
        boolean,
      ];

      const parentValueEqual = this.areParentValuesEqual(cachedParent, parentValue);

      if (
        cachedValue === currentValue &&
        parentValueEqual &&
        cachedLoading === isLoading
      ) {
        if (cached.version !== this.storeVersion) {
          cached.version = this.storeVersion;
        }
        return cached.value;
      }
    }

    // Create new snapshot
    const snapshot: FieldSnapshot = {
      value: currentValue,
      parentValue,
      parentValues,
      isLoading,
    };

    this.snapshotCache.set(fieldName, {
      value: snapshot,
      version: this.storeVersion,
      dependencies: [currentValue, parentValue, isLoading],
    });

    return snapshot;
  };

  /**
   * Compare parent values.
   */
  private areParentValuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

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
  getConfig = (fieldName: string): FieldConfig | undefined => {
    return this.configLookup.get(fieldName);
  };

  /**
   * Get all configs.
   */
  getConfigs = (): ReadonlyArray<FieldConfig> => {
    return this.fieldConfigs;
  };

  /**
   * Get all values.
   */
  getValues = (): FieldValues => {
    return this.fieldValues;
  };

  /**
   * Get filtered options.
   */
  getOptions = (
    fieldName: string,
    externalOptions?: XSelectOption[],
  ): XSelectOption[] => {
    const config = this.configLookup.get(fieldName);
    if (!config) return EMPTY_ARRAY as XSelectOption[];

    const rawOptions = this.resolveOptions(fieldName, externalOptions);
    if (rawOptions.length === 0) return EMPTY_ARRAY as XSelectOption[];

    // Root field - no filtering
    if (!config.dependsOn) {
      return rawOptions;
    }

    // Calculate parentValue
    let parentValue: unknown;
    const parentNames = normalizeDependsOn(config.dependsOn);

    if (parentNames.length === 1) {
      parentValue = this.fieldValues[parentNames[0]];
    } else {
      const values: Record<string, unknown> = {};
      for (const name of parentNames) {
        values[name] = this.fieldValues[name];
      }
      parentValue = values;
    }

    // Check cache
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
   * Set field value with cascade delete.
   */
  setValue = (fieldName: string, newValue: unknown): void => {
    if (this.isDestroyed) return;

    const currentValue = this.fieldValues[fieldName];
    if (areValuesEqual(currentValue, newValue)) return;

    this.storeVersion++;

    const changes: FieldChange[] = [{ name: fieldName, value: newValue }];
    const newValues = { ...this.fieldValues, [fieldName]: newValue };

    this.cascadeDeleteDescendants(fieldName, newValues, changes);

    this.fieldValues = newValues;

    this.scheduleNotifications(changes.map((c) => c.name));
    this.syncToForm(changes);
  };

  /**
   * Batch set multiple values.
   */
  setValues = (values: Partial<FieldValues>): void => {
    if (this.isDestroyed) return;

    const changes: FieldChange[] = [];
    const newValues = { ...this.fieldValues };
    const fieldsToProcess = new Set<string>();

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

    this.storeVersion++;

    for (const fieldName of fieldsToProcess) {
      this.cascadeDeleteDescendants(fieldName, newValues, changes);
    }

    this.fieldValues = newValues;

    this.scheduleNotifications(changes.map((c) => c.name));
    this.syncToForm(changes);
  };

  /**
   * Set external options.
   */
  setExternalOptions = (fieldName: string, options: XSelectOption[]): void => {
    const current = this.externalOptionsMap.get(fieldName);
    if (current === options) return;
    if (current && this.areOptionsShallowEqual(current, options)) return;

    this.externalOptionsMap.set(fieldName, options);
    this.storeVersion++;
    this.filteredOptionsCache.delete(fieldName);
  };

  /**
   * Set form adapter.
   */
  setAdapter = (adapter?: FormAdapter): void => {
    this.formAdapter = adapter;
  };

  /**
   * Sync controlled values.
   */
  syncControlledValue = (controlledValue: FieldValues): void => {
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
  // SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to field changes.
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
  // CLEANUP
  // ============================================================================

  /**
   * Destroy store.
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
    externalOptions?: XSelectOption[],
  ): XSelectOption[] {
    if (externalOptions) return externalOptions;

    const stored = this.externalOptionsMap.get(fieldName);
    if (stored) return stored;

    const config = this.configLookup.get(fieldName);
    if (!config) return EMPTY_ARRAY as XSelectOption[];

    if (typeof config.options === 'function') {
      return this.asyncOptionsCache.get(fieldName) ?? (EMPTY_ARRAY as XSelectOption[]);
    }

    return config.options ?? (EMPTY_ARRAY as XSelectOption[]);
  }

  private areOptionsShallowEqual(a: XSelectOption[], b: XSelectOption[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].value !== b[i].value) return false;

      const aPV = a[i].parentValue;
      const bPV = b[i].parentValue;

      if (aPV !== bPV) {
        if (Array.isArray(aPV) && Array.isArray(bPV)) {
          if (aPV.length !== bPV.length) return false;
          for (let j = 0; j < aPV.length; j++) {
            if (aPV[j] !== bPV[j]) return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }

  // ============================================================================
  // PRIVATE - Cascade Delete
  // ============================================================================

  private cascadeDeleteDescendants(
    fieldName: string,
    values: FieldValues,
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

      const parentNamesArray = Array.isArray(parentNames) ? parentNames : [parentNames];
      const isMultiParent = parentNamesArray.length > 1;

      // Check if all parents are empty
      const allParentsEmpty = parentNamesArray.every((name) => {
        const value = values[name];
        if (value === null || value === undefined) return true;
        if (Array.isArray(value)) return value.length === 0;
        return false;
      });

      // All parents empty -> clear child
      if (allParentsEmpty) {
        const clearedValue = Array.isArray(currentValue) ? [] : undefined;
        if (!areValuesEqual(currentValue, clearedValue)) {
          values[descendant] = clearedValue;
          changes.push({ name: descendant, value: clearedValue });
        }
        continue;
      }
      // Smart cascade with parentValue
      const options = this.resolveOptions(descendant);
      const hasParentValue = options.some((o) => o.parentValue !== undefined);

      if (hasParentValue) {
        let newValue: unknown;

        if (isMultiParent) {
          // Multi-parent: use cascadeDeleteMultiParent with object format
          const remainingParentValuesMap: Record<string, (string | number)[]> = {};
          for (const parentName of parentNamesArray) {
            const parentValue = values[parentName];
            if (Array.isArray(parentValue)) {
              remainingParentValuesMap[parentName] = parentValue as (string | number)[];
            } else if (parentValue !== null && parentValue !== undefined) {
              remainingParentValuesMap[parentName] = [parentValue as string | number];
            } else {
              remainingParentValuesMap[parentName] = [];
            }
          }

          newValue = cascadeDeleteMultiParent(
            currentValue as string | number | (string | number)[] | null | undefined,
            remainingParentValuesMap,
            options,
          );
        } else {
          // Single parent: use original cascadeDelete
          const allParentValues = this.collectParentValues(parentNames, values);
          newValue = cascadeDelete(
            currentValue as string | number | (string | number)[] | null | undefined,
            allParentValues as (string | number)[],
            options,
          );
        }

        if (!areValuesEqual(currentValue, newValue)) {
          values[descendant] = newValue;
          changes.push({ name: descendant, value: newValue });
        }
      } else {
        // No parentValue in options -> clear on parent change
        const clearedValue = Array.isArray(currentValue) ? [] : undefined;
        if (!areValuesEqual(currentValue, clearedValue)) {
          values[descendant] = clearedValue;
          changes.push({ name: descendant, value: clearedValue });
        }
      }
    }
  }

  private collectParentValues(
    parentNames: string | string[] | null,
    values: FieldValues,
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

  // ============================================================================
  // PRIVATE - Notifications
  // ============================================================================

  private scheduleNotifications(fieldNames: string[]): void {
    for (const name of fieldNames) {
      this.pendingNotifications.add(name);

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

        const toNotify = [...this.pendingNotifications];
        this.pendingNotifications.clear();
        this.isNotificationScheduled = false;

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
        const parentNames = normalizeDependsOn(config.dependsOn);

        if (parentNames.length === 1) {
          const parentValue = this.fieldValues[parentNames[0]];
          if (parentValue !== null && parentValue !== undefined) {
            this.loadAsyncOptions(config.name, parentValue);
          }
        } else {
          const allHaveValue = parentNames.every((name) => {
            const value = this.fieldValues[name];
            return value !== null && value !== undefined;
          });

          if (allHaveValue) {
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

    if (this.pendingRequests.has(cacheKey)) return;

    // Set loading
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

      console.error(`[XSelectStore] Failed to load options for "${fieldName}":`, error);
      this.asyncOptionsCache.set(fieldName, []);
    } finally {
      if (this.isDestroyed) return;

      this.pendingRequests.delete(cacheKey);

      const newLoading = new Set(this.loadingFieldNames);
      newLoading.delete(fieldName);
      this.loadingFieldNames = newLoading;

      this.storeVersion++;
      this.scheduleNotifications([fieldName]);
    }
  }
}