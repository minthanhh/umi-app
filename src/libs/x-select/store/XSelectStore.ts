/**
 * XSelect - Store
 *
 * External store for managing cascading select state.
 * Designed for use with React's useSyncExternalStore.
 *
 * Architecture:
 * - Store manages: values and cascade logic via metadata
 * - Form library is SOURCE OF TRUTH for values (via adapter)
 * - Adapter syncs store changes back to form
 * - Components (InfiniteWrapper, StaticWrapper) sync value metadata for cascade delete
 *
 * Supports both:
 * - Static mode: configs provided upfront in constructor
 * - Dynamic mode: fields self-register at runtime via registerField()
 *
 * Cascade Delete Strategy (Metadata Snapshot):
 * - Components sync only metadata of SELECTED values: { value: parentValue }
 * - On parent change, store uses metadata to determine which child values to remove
 * - Lightweight and race-condition free
 *
 * Optimizations:
 * - Computed state with lazy evaluation and structural sharing
 * - Batched notifications via microtask
 * - Batched field registration via RegistrationManager
 */

import type {
  FieldConfig,
  FieldSnapshot,
  FieldValues,
  FormAdapter,
  RelationshipMap,
  StoreListener,
  ValueMetadataMap,
  ValueMetadataEntry,
} from '../types';

import { EMPTY_SNAPSHOT } from '../constants';
import {
  areValuesEqual,
  buildRelationshipMap,
  detectCircularDependency,
  getDescendants,
  normalizeDependsOn,
} from '../utils';

import { RegistrationManager } from './RegistrationManager';

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/**
 * Event types for store changes.
 */
export type StoreEventType =
  | 'field:registered'
  | 'field:unregistered'
  | 'fields:rebuilt'
  | 'value:changed';

/**
 * Event payload for store events.
 */
export interface StoreEvent {
  type: StoreEventType;
  fieldNames: string[];
}

/**
 * Event listener type.
 */
export type StoreEventListener = (event: StoreEvent) => void;

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

// ============================================================================
// STORE CLASS
// ============================================================================

/**
 * External store for cascading select fields.
 *
 * Supports both static and dynamic modes:
 * - Static: Pass configs in constructor
 * - Dynamic: Use registerField() to add fields at runtime
 *
 * @example Static mode
 * ```ts
 * const store = new XSelectStore(
 *   configs,
 *   { country: 'VN' },
 *   { onFieldChange: (name, value) => form.setFieldValue(name, value) }
 * );
 * ```
 *
 * @example Dynamic mode
 * ```ts
 * const store = new XSelectStore([], {}, adapter);
 * store.registerField({ name: 'country', options: countries });
 * store.registerField({ name: 'city', dependsOn: 'country', options: cities });
 * ```
 */
export class XSelectStore {
  // State
  private fieldValues: FieldValues;
  private storeVersion = 0;

  // Value metadata for cascade delete (only stores parentValue of selected values)
  private valueMetadataMap = new Map<string, ValueMetadataMap>();

  // Dynamic config management (mutable)
  private configs = new Map<string, FieldConfig>();
  private fieldRelationships: RelationshipMap = new Map();
  private descendantsCache = new Map<string, string[]>();
  private readonly registrationManager: RegistrationManager;

  // Subscriptions
  private fieldSubscribers = new Map<string, Set<StoreListener>>();
  private eventListeners = new Set<StoreEventListener>();

  // Caching for snapshots
  private snapshotCache = new Map<string, CachedComputed<FieldSnapshot>>();

  // Batching
  private pendingNotifications = new Set<string>();
  private isNotificationScheduled = false;

  // Adapter & lifecycle
  private formAdapter?: FormAdapter;
  private isDestroyed = false;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(
    configs: FieldConfig[] = [],
    initialValues: FieldValues = {},
    adapter?: FormAdapter,
  ) {
    this.fieldValues = { ...initialValues };
    this.formAdapter = adapter;

    // Initialize registration manager
    this.registrationManager = new RegistrationManager({
      onFlush: this.handleRegistrationFlush,
    });

    // If configs provided, register them immediately (static mode)
    if (configs.length > 0) {
      // Validate for circular dependencies
      this.validateConfigs(configs);

      for (const config of configs) {
        this.configs.set(config.name, config);
      }
      this.rebuildRelationships();
    }
  }

  /**
   * Validate configs for circular dependencies.
   * @throws Error if circular dependency detected
   */
  private validateConfigs(configs: FieldConfig[]): void {
    const result = detectCircularDependency(configs);

    if (result.hasCircular) {
      const cyclePath = result.cyclePath.join(' → ');
      console.error(
        `[XSelectStore] Circular dependency detected: ${cyclePath}\n` +
        `This will cause infinite loops in cascade delete. Please fix your field configurations.`
      );

      // In development, throw error to catch early
      if (process.env.NODE_ENV === 'development') {
        throw new Error(
          `[XSelectStore] Circular dependency detected: ${cyclePath}. ` +
          `This will cause infinite loops. Please fix your field configurations.`
        );
      }
    }
  }

  // ============================================================================
  // REGISTRATION API (for dynamic mode)
  // ============================================================================

  /**
   * Register a field dynamically.
   * Flushes synchronously to ensure field is available immediately.
   */
  registerField = (config: FieldConfig): void => {
    if (this.isDestroyed) return;
    this.registrationManager.register(config);
    // Flush synchronously to ensure field is registered before next render
    this.registrationManager.flushSync();
  };

  /**
   * Unregister a field dynamically.
   * Batched - multiple calls in same tick are processed together.
   */
  unregisterField = (fieldName: string): void => {
    if (this.isDestroyed) return;
    this.registrationManager.unregister(fieldName);
  };

  /**
   * Update a field's configuration.
   */
  updateFieldConfig = (fieldName: string, updates: Partial<FieldConfig>): void => {
    if (this.isDestroyed) return;

    const existingConfig = this.configs.get(fieldName);
    if (!existingConfig) {
      console.warn(`[XSelectStore] Cannot update non-existent field: ${fieldName}`);
      return;
    }

    const updatedConfig: FieldConfig = { ...existingConfig, ...updates };
    this.registrationManager.update(updatedConfig);
  };

  /**
   * Check if a field is registered.
   */
  hasField = (fieldName: string): boolean => {
    return this.configs.has(fieldName);
  };

  /**
   * Get all registered field names.
   */
  getFieldNames = (): string[] => {
    return Array.from(this.configs.keys());
  };

  // ============================================================================
  // REGISTRATION FLUSH HANDLER
  // ============================================================================

  /**
   * Handle batched registration changes.
   */
  private handleRegistrationFlush = (
    added: ReadonlyMap<string, FieldConfig>,
    removed: ReadonlySet<string>,
  ): void => {
    if (this.isDestroyed) return;

    const addedNames: string[] = [];
    const removedNames: string[] = [];

    // Process removals first
    for (const fieldName of removed) {
      if (this.configs.has(fieldName)) {
        this.configs.delete(fieldName);
        removedNames.push(fieldName);

        // Clean up related state
        delete this.fieldValues[fieldName];
        this.snapshotCache.delete(fieldName);
        this.valueMetadataMap.delete(fieldName);
      }
    }

    // Process additions
    for (const [fieldName, config] of added) {
      const isNew = !this.configs.has(fieldName);
      this.configs.set(fieldName, config);

      if (isNew) {
        addedNames.push(fieldName);
      }
    }

    // Rebuild if there were changes
    if (addedNames.length > 0 || removedNames.length > 0) {
      // Validate for circular dependencies after adding new fields
      if (addedNames.length > 0) {
        this.validateConfigs(Array.from(this.configs.values()));
      }

      this.storeVersion++;
      this.rebuildRelationships();

      // Emit events
      if (addedNames.length > 0) {
        this.emitEvent({ type: 'field:registered', fieldNames: addedNames });
      }
      if (removedNames.length > 0) {
        this.emitEvent({ type: 'field:unregistered', fieldNames: removedNames });
      }
      this.emitEvent({
        type: 'fields:rebuilt',
        fieldNames: [...addedNames, ...removedNames],
      });

      // Notify all affected fields
      const affectedFields = new Set([...addedNames, ...removedNames]);

      // Also notify children of added fields
      for (const fieldName of addedNames) {
        const relationship = this.fieldRelationships.get(fieldName);
        if (relationship?.children) {
          for (const child of relationship.children) {
            affectedFields.add(child);
          }
        }
      }

      this.scheduleNotifications([...affectedFields]);
    }
  };

  // ============================================================================
  // RELATIONSHIP MANAGEMENT
  // ============================================================================

  /**
   * Rebuild relationship map from current configs.
   */
  private rebuildRelationships(): void {
    const configArray = Array.from(this.configs.values());
    this.fieldRelationships = buildRelationshipMap(configArray);
    this.descendantsCache.clear();
  }

  /**
   * Get descendants with caching.
   */
  private getDescendantsOf = (fieldName: string): string[] => {
    const cached = this.descendantsCache.get(fieldName);
    if (cached) return cached;

    const descendants = getDescendants(fieldName, this.fieldRelationships);
    this.descendantsCache.set(fieldName, descendants);
    return descendants;
  };

  // ============================================================================
  // PUBLIC GETTERS
  // ============================================================================

  /**
   * Get field snapshot with structural sharing.
   */
  getFieldSnapshot = (fieldName: string): FieldSnapshot => {
    if (!this.configs.has(fieldName)) {
      return EMPTY_SNAPSHOT;
    }

    const config = this.configs.get(fieldName)!;
    const currentValue = this.fieldValues[fieldName];

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
      const [cachedValue, cachedParent] = cached.dependencies as [
        unknown,
        unknown,
      ];

      const parentValueEqual = this.areParentValuesEqual(cachedParent, parentValue);

      if (
        cachedValue === currentValue &&
        parentValueEqual
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
    };

    this.snapshotCache.set(fieldName, {
      value: snapshot,
      version: this.storeVersion,
      dependencies: [currentValue, parentValue],
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
    return this.configs.get(fieldName);
  };

  /**
   * Get all configs as array.
   */
  getConfigs = (): ReadonlyArray<FieldConfig> => {
    return Array.from(this.configs.values());
  };

  /**
   * Get all values.
   */
  getValues = (): FieldValues => {
    return this.fieldValues;
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

    this.emitEvent({
      type: 'value:changed',
      fieldNames: changes.map((c) => c.name),
    });
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
      if (!this.configs.has(fieldName)) continue;

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

    this.emitEvent({
      type: 'value:changed',
      fieldNames: changes.map((c) => c.name),
    });
  };

  /**
   * Set value metadata for cascade delete.
   * Components (InfiniteWrapper, StaticWrapper) call this to sync metadata of selected values.
   *
   * @param fieldName - The field to set metadata for
   * @param metadata - Map of value -> { parentValue } for cascade delete
   *
   * @example
   * ```ts
   * // When user selects cities D1, D7 (from HCM) and HK (from HN)
   * store.setValueMetadata('city', {
   *   'D1': { parentValue: 'HCM' },
   *   'D7': { parentValue: 'HCM' },
   *   'HK': { parentValue: 'HN' },
   * });
   *
   * // When parent province 'HCM' is deselected, cascade delete will:
   * // - Check each city value's parentValue
   * // - Remove D1, D7 (parentValue = 'HCM')
   * // - Keep HK (parentValue = 'HN')
   * ```
   */
  setValueMetadata = (fieldName: string, metadata: ValueMetadataMap): void => {
    if (this.isDestroyed) return;

    const current = this.valueMetadataMap.get(fieldName);

    // Skip if same reference
    if (current === metadata) return;

    // Skip if shallow equal (same keys and parentValues)
    if (current && this.areMetadataEqual(current, metadata)) return;

    this.valueMetadataMap.set(fieldName, metadata);
  };

  /**
   * Get value metadata for a field.
   */
  getValueMetadata = (fieldName: string): ValueMetadataMap | undefined => {
    return this.valueMetadataMap.get(fieldName);
  };

  /**
   * Compare two metadata maps for equality.
   */
  private areMetadataEqual(a: ValueMetadataMap, b: ValueMetadataMap): boolean {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!(key in b)) return false;

      const aEntry = a[key];
      const bEntry = b[key];

      // Compare parentValue
      if (!this.areParentValuesEqual(aEntry.parentValue, bEntry.parentValue)) {
        return false;
      }
    }

    return true;
  }

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

    for (const fieldName of this.configs.keys()) {
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

  /**
   * Subscribe to store events.
   */
  onEvent = (listener: StoreEventListener): (() => void) => {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  };

  /**
   * Emit event to listeners.
   */
  private emitEvent(event: StoreEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Destroy store.
   */
  destroy = (): void => {
    this.isDestroyed = true;
    this.registrationManager.destroy();
    this.fieldSubscribers.clear();
    this.eventListeners.clear();
    this.snapshotCache.clear();
    this.valueMetadataMap.clear();
    this.configs.clear();
    this.fieldRelationships.clear();
    this.descendantsCache.clear();
  };

  // ============================================================================
  // PRIVATE - Cascade Delete (using Metadata Snapshot)
  // ============================================================================

  /**
   * Cascade delete descendants using value metadata.
   *
   * Strategy:
   * 1. For each descendant, check if it has selected values
   * 2. Get metadata for those values (synced by InfiniteWrapper/StaticWrapper)
   * 3. Filter values: keep only values whose parentValue is still selected in parent
   * 4. If no metadata available, fall back to clearing all values
   *
   * @example
   * Parent: province = ['HCM'] (was ['HCM', 'HN'])
   * Child: city = ['D1', 'D7', 'HK']
   * Metadata: { D1: { parentValue: 'HCM' }, D7: { parentValue: 'HCM' }, HK: { parentValue: 'HN' } }
   *
   * After cascade: city = ['D1', 'D7'] (HK removed because HN is no longer selected)
   */
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

      // Get metadata for this field
      const metadata = this.valueMetadataMap.get(descendant);

      // No metadata -> fall back to clearing (conservative approach)
      if (!metadata || Object.keys(metadata).length === 0) {
        const clearedValue = Array.isArray(currentValue) ? [] : undefined;
        if (!areValuesEqual(currentValue, clearedValue)) {
          values[descendant] = clearedValue;
          changes.push({ name: descendant, value: clearedValue });
        }
        continue;
      }

      // Smart cascade using metadata
      const newValue = this.cascadeDeleteWithMetadata(
        currentValue,
        parentNamesArray,
        values,
        metadata,
      );

      if (!areValuesEqual(currentValue, newValue)) {
        values[descendant] = newValue;
        changes.push({ name: descendant, value: newValue });
      }
    }
  }

  /**
   * Filter values based on metadata and remaining parent values.
   */
  private cascadeDeleteWithMetadata(
    currentValue: unknown,
    parentNames: string[],
    values: FieldValues,
    metadata: ValueMetadataMap,
  ): unknown {
    const isMultiple = Array.isArray(currentValue);
    const currentValues = isMultiple
      ? (currentValue as (string | number)[])
      : [currentValue as string | number];

    // Collect all remaining parent values
    const remainingParentValues = this.collectRemainingParentValues(parentNames, values);
    const isMultiParent = parentNames.length > 1;

    const filteredValues = currentValues.filter((value) => {
      const entry = metadata[value];

      // No metadata for this value -> remove it (conservative)
      if (!entry) return false;

      const valueParent = entry.parentValue;

      // No parentValue in metadata -> keep it (root-level option)
      if (valueParent === undefined) return true;

      // Check if value's parent is still selected
      return this.isParentValueStillSelected(
        valueParent,
        remainingParentValues,
        isMultiParent,
        parentNames,
      );
    });

    // Return in same format as input
    if (isMultiple) {
      return filteredValues;
    } else {
      return filteredValues.length > 0 ? filteredValues[0] : undefined;
    }
  }

  /**
   * Collect remaining parent values as a flat array or map (for multi-parent).
   */
  private collectRemainingParentValues(
    parentNames: string[],
    values: FieldValues,
  ): { flat: (string | number)[]; byField: Record<string, (string | number)[]> } {
    const flat: (string | number)[] = [];
    const byField: Record<string, (string | number)[]> = {};

    for (const name of parentNames) {
      const value = values[name];
      const arr: (string | number)[] = [];

      if (Array.isArray(value)) {
        arr.push(...(value as (string | number)[]));
      } else if (value !== null && value !== undefined) {
        arr.push(value as string | number);
      }

      byField[name] = arr;
      flat.push(...arr);
    }

    return { flat, byField };
  }

  /**
   * Check if a value's parentValue is still in the remaining parent values.
   */
  private isParentValueStillSelected(
    valueParent: ValueMetadataEntry['parentValue'],
    remainingParentValues: { flat: (string | number)[]; byField: Record<string, (string | number)[]> },
    isMultiParent: boolean,
    parentNames: string[],
  ): boolean {
    // Single parent value (string | number)
    if (typeof valueParent === 'string' || typeof valueParent === 'number') {
      return remainingParentValues.flat.includes(valueParent);
    }

    // Array of parent values (for multi-parent options that belong to multiple parents)
    if (Array.isArray(valueParent)) {
      // Keep if ANY of the parent values is still selected
      return valueParent.some((pv) => remainingParentValues.flat.includes(pv));
    }

    // Object parent value (for multi-parent dependencies)
    // e.g., { province: 'HCM', category: 'A' }
    if (typeof valueParent === 'object' && valueParent !== null) {
      const parentValueObj = valueParent as Record<string, unknown>;

      // Check each parent field
      for (const parentName of parentNames) {
        const requiredValue = parentValueObj[parentName];
        if (requiredValue === undefined) continue;

        const remainingForField = remainingParentValues.byField[parentName] || [];

        // If this parent field has a required value, check if it's still selected
        if (Array.isArray(requiredValue)) {
          // Any of the required values must be present
          const hasAny = requiredValue.some((v) =>
            remainingForField.includes(v as string | number),
          );
          if (!hasAny) return false;
        } else {
          if (!remainingForField.includes(requiredValue as string | number)) {
            return false;
          }
        }
      }

      return true;
    }

    // Unknown format -> keep it
    return true;
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

    // Defer form sync to next microtask to prevent Form re-render
    // from happening during the same synchronous execution.
    // This allows React to batch the store notifications first,
    // then sync to form separately.
    const adapter = this.formAdapter;
    queueMicrotask(() => {
      for (const { name, value } of changes) {
        adapter.onFieldChange(name, value);
      }
    });
  }
}