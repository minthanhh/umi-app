/**
 * DependentSelect - Class-based Store
 *
 * Architecture:
 * - Store manages: options, loading states, cascade logic
 * - Form library is SOURCE OF TRUTH for values
 * - Adapter syncs Store changes to Form
 */

import type {
  DependentFieldConfig,
  DependentSelectValues,
  FormAdapter,
  RelationshipMap,
  SelectOption,
} from './types';
import {
  buildRelationshipMap,
  cascadeDeleteValues,
  cloneValues,
  defaultFilterOptions,
  getAllDescendants,
  getRemovedParentValues,
} from './utils';

// ============================================================================
// Types
// ============================================================================

export type Listener = () => void;

export interface FieldSnapshot {
  value: any;
  parentValue: any;
  isLoading: boolean;
}

export interface StoreSnapshot {
  values: DependentSelectValues;
  loadingFields: Set<string>;
  optionsCache: Map<string, SelectOption[]>;
}

// ============================================================================
// DependentSelectStore Class
// ============================================================================

export class DependentSelectStore {
  // State
  private values: DependentSelectValues;
  private loadingFields: Set<string> = new Set();
  private optionsCache: Map<string, SelectOption[]> = new Map();

  // Configs (immutable after construction)
  private readonly configs: DependentFieldConfig[];
  private readonly configMap: Map<string, DependentFieldConfig>;
  private readonly relationshipMap: RelationshipMap;

  // Listeners
  private globalListeners: Set<Listener> = new Set();
  private fieldListeners: Map<string, Set<Listener>> = new Map();

  // Form adapter (mutable - can be updated)
  private adapter?: FormAdapter;

  // Flag to track if store is destroyed
  private isDestroyed = false;

  constructor(
    configs: DependentFieldConfig[],
    initialValues: DependentSelectValues = {},
    adapter?: FormAdapter,
  ) {
    this.configs = configs;
    this.values = initialValues;
    this.adapter = adapter;

    // Build config map
    this.configMap = new Map();
    configs.forEach((config) => this.configMap.set(config.name, config));

    // Build relationship map
    this.relationshipMap = buildRelationshipMap(configs);

    // Load initial async options
    this.loadInitialOptions();
  }

  // ============================================================================
  // Getters (for useSyncExternalStore)
  // ============================================================================

  getValues = (): DependentSelectValues => {
    return this.values;
  };

  getConfigs = (): DependentFieldConfig[] => {
    return this.configs;
  };

  getLoadingFields = (): Set<string> => {
    return this.loadingFields;
  };

  getOptionsCache = (): Map<string, SelectOption[]> => {
    return this.optionsCache;
  };

  getSnapshot = (): StoreSnapshot => {
    return {
      values: this.values,
      loadingFields: this.loadingFields,
      optionsCache: this.optionsCache,
    };
  };

  getFieldSnapshot = (fieldName: string): FieldSnapshot => {
    const config = this.configMap.get(fieldName);
    return {
      value: this.values[fieldName],
      parentValue: config?.dependsOn
        ? this.values[config.dependsOn]
        : undefined,
      isLoading: this.loadingFields.has(fieldName),
    };
  };

  getFilteredOptions = (fieldName: string): SelectOption[] => {
    const config = this.configMap.get(fieldName);
    if (!config) return [];

    let rawOptions: SelectOption[];
    if (typeof config.options === 'function') {
      rawOptions = this.optionsCache.get(fieldName) || [];
    } else {
      rawOptions = config.options;
    }

    if (!config.dependsOn) {
      return rawOptions;
    }

    const parentValue = this.values[config.dependsOn];
    const filterFn = config.filterOptions || defaultFilterOptions;
    return filterFn(rawOptions, parentValue);
  };

  getConfig = (fieldName: string): DependentFieldConfig | undefined => {
    return this.configMap.get(fieldName);
  };

  getRelationshipMap = (): RelationshipMap => {
    return this.relationshipMap;
  };

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Set value for a field. This will:
   * 1. Update store state
   * 2. Cascade delete dependent values if needed
   * 3. Notify Form via adapter
   * 4. Reload options for dependent fields
   */
  setValue = (fieldName: string, newValue: any): void => {
    const oldValue = this.values[fieldName];

    // Skip if value hasn't changed
    if (oldValue === newValue) return;

    const removedValues = getRemovedParentValues(oldValue, newValue);
    let updatedValues = cloneValues(this.values);
    updatedValues[fieldName] = newValue;

    // Track changed fields for adapter notification
    const changedFields: Array<{ name: string; value: any }> = [
      { name: fieldName, value: newValue },
    ];

    // Cascade delete
    if (removedValues.length > 0) {
      const descendants = getAllDescendants(fieldName, this.relationshipMap);

      descendants.forEach((descendantName) => {
        const descendantConfig = this.configMap.get(descendantName);
        if (!descendantConfig) return;

        let descendantOptions: SelectOption[];
        if (typeof descendantConfig.options === 'function') {
          descendantOptions = this.optionsCache.get(descendantName) || [];
        } else {
          descendantOptions = descendantConfig.options;
        }

        const parentName = this.relationshipMap.get(descendantName)?.parent;
        if (!parentName) return;

        let parentRemovedValues: (string | number)[];
        if (parentName === fieldName) {
          parentRemovedValues = removedValues;
        } else {
          const parentOldValue = this.values[parentName];
          const parentNewValue = updatedValues[parentName];
          parentRemovedValues = getRemovedParentValues(
            parentOldValue,
            parentNewValue,
          );
        }

        if (parentRemovedValues.length > 0) {
          const oldDescVal = updatedValues[descendantName];
          const newDescVal = cascadeDeleteValues(
            oldDescVal,
            parentRemovedValues,
            descendantOptions,
          );
          updatedValues[descendantName] = newDescVal;

          if (oldDescVal !== newDescVal) {
            changedFields.push({ name: descendantName, value: newDescVal });
          }
        }
      });
    }

    // Update state
    this.values = updatedValues;

    // Notify listeners (for useSyncExternalStore)
    changedFields.forEach(({ name }) => {
      this.notifyFieldListeners(name);
    });
    this.notifyGlobalListeners();

    // Notify Form via adapter
    this.notifyAdapter(changedFields);

    // Reload options for dependent fields
    this.reloadDependentOptions(fieldName, newValue);
  };

  setValues = (newValues: Partial<DependentSelectValues>): void => {
    Object.entries(newValues).forEach(([fieldName, value]) => {
      this.setValue(fieldName, value);
    });
  };

  resetFields = (fieldNames?: string[]): void => {
    const fieldsToReset = fieldNames || this.configs.map((c) => c.name);
    fieldsToReset.forEach((fieldName) => {
      this.setValue(fieldName, undefined);
    });
  };

  /**
   * Update adapter (useful when form instance changes)
   */
  setAdapter = (adapter?: FormAdapter): void => {
    this.adapter = adapter;
  };

  /**
   * Update values from external source (controlled mode)
   */
  syncControlledValue = (controlledValue: DependentSelectValues): void => {
    const oldValues = this.values;
    this.values = controlledValue;

    // Notify only changed fields
    Object.keys(controlledValue).forEach((fieldName) => {
      if (oldValues[fieldName] !== controlledValue[fieldName]) {
        this.notifyFieldListeners(fieldName);
      }
    });

    this.notifyGlobalListeners();
  };

  // ============================================================================
  // Subscriptions
  // ============================================================================

  subscribe = (listener: Listener): (() => void) => {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  };

  subscribeToField = (fieldName: string, listener: Listener): (() => void) => {
    if (!this.fieldListeners.has(fieldName)) {
      this.fieldListeners.set(fieldName, new Set());
    }
    this.fieldListeners.get(fieldName)!.add(listener);

    return () => {
      this.fieldListeners.get(fieldName)?.delete(listener);
    };
  };

  // ============================================================================
  // Private Methods
  // ============================================================================

  private notifyGlobalListeners = (): void => {
    this.globalListeners.forEach((listener) => listener());
  };

  private notifyFieldListeners = (fieldName: string): void => {
    // Notify the field itself
    this.fieldListeners.get(fieldName)?.forEach((listener) => listener());

    // Notify children (they depend on this field)
    const rel = this.relationshipMap.get(fieldName);
    if (rel) {
      rel.children.forEach((childName) => {
        this.fieldListeners.get(childName)?.forEach((listener) => listener());
      });
    }
  };

  /**
   * Notify Form library via adapter
   */
  private notifyAdapter = (
    changedFields: Array<{ name: string; value: any }>,
  ): void => {
    if (!this.adapter) return;

    // Use batch update if available
    if (this.adapter.onFieldsChange && changedFields.length > 1) {
      this.adapter.onFieldsChange(changedFields);
    } else {
      // Fall back to individual updates
      changedFields.forEach(({ name, value }) => {
        this.adapter?.onFieldChange(name, value);
      });
    }
  };

  private loadInitialOptions = (): void => {
    this.configs.forEach((config) => {
      if (typeof config.options !== 'function') return;

      if (config.dependsOn) {
        const parentValue = this.values[config.dependsOn];
        if (parentValue !== undefined && parentValue !== null) {
          this.loadOptionsForField(config.name, parentValue);
        }
      } else {
        if (!this.optionsCache.has(config.name)) {
          this.loadOptionsForField(config.name, null);
        }
      }
    });
  };

  private reloadDependentOptions = (
    parentFieldName: string,
    parentValue: any,
  ): void => {
    const rel = this.relationshipMap.get(parentFieldName);
    if (!rel) return;

    rel.children.forEach((childName) => {
      const childConfig = this.configMap.get(childName);
      if (childConfig && typeof childConfig.options === 'function') {
        if (
          parentValue !== undefined &&
          parentValue !== null &&
          !(Array.isArray(parentValue) && parentValue.length === 0)
        ) {
          this.loadOptionsForField(childName, parentValue);
        } else {
          // Clear options when parent is cleared
          this.optionsCache = new Map(this.optionsCache);
          this.optionsCache.set(childName, []);
          this.notifyFieldListeners(childName);
        }
      }
    });
  };

  private loadOptionsForField = async (
    fieldName: string,
    parentValue: any,
  ): Promise<void> => {
    // Skip if store is destroyed
    if (this.isDestroyed) return;

    const config = this.configMap.get(fieldName);
    if (!config || typeof config.options !== 'function') return;

    const optionsFn = config.options;

    // Set loading
    this.loadingFields = new Set(this.loadingFields).add(fieldName);
    this.notifyFieldListeners(fieldName);

    try {
      const options = await optionsFn(parentValue);

      // Check again after async operation
      if (this.isDestroyed) return;

      this.optionsCache = new Map(this.optionsCache).set(fieldName, options);
    } catch (error) {
      // Check again after async operation
      if (this.isDestroyed) return;

      console.error(`Error loading options for ${fieldName}:`, error);
      this.optionsCache = new Map(this.optionsCache).set(fieldName, []);
    } finally {
      // Check again before final updates
      if (this.isDestroyed) return;

      const next = new Set(this.loadingFields);
      next.delete(fieldName);
      this.loadingFields = next;
      this.notifyFieldListeners(fieldName);
    }
  };

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy = (): void => {
    this.isDestroyed = true;
    this.globalListeners.clear();
    this.fieldListeners.clear();
  };
}