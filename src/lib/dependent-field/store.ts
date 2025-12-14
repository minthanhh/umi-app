/**
 * DependentFieldStore - Core Store Implementation
 *
 * IMPORTANT: Form library is the SOURCE OF TRUTH for values.
 * This store only manages:
 * - Dependency tracking
 * - Notifying when dependencies change
 * - Triggering callbacks
 *
 * Values are read from and written to Form via adapter.
 */

import type {
  DependencyChangeParams,
  DependentFieldConfig,
  FieldValue,
  FieldValues,
  FormAdapter,
  Subscriber,
} from './types';

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeDependsOn(dependsOn?: string | string[]): string[] {
  if (!dependsOn) return [];
  return Array.isArray(dependsOn) ? dependsOn : [dependsOn];
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }
  return false;
}

// ============================================================================
// DependentFieldStore Class
// ============================================================================

export class DependentFieldStore {
  // Field configs map for quick lookup
  private configMap: Map<string, DependentFieldConfig> = new Map();

  // Dependency graph: fieldName -> fields that depend on it
  private dependencyGraph: Map<string, Set<string>> = new Map();

  // Reverse dependency: fieldName -> fields it depends on
  private reverseDependency: Map<string, string[]> = new Map();

  // Subscribers for each field
  private fieldSubscribers: Map<string, Set<Subscriber>> = new Map();

  // Global subscribers (notified on any change)
  private globalSubscribers: Set<Subscriber> = new Set();

  // External adapter for form library integration (SOURCE OF TRUTH)
  private adapter?: FormAdapter;

  // Cache previous values to detect changes
  private previousValues: FieldValues = {};

  // Destroyed flag
  private isDestroyed = false;

  constructor(
    configs: DependentFieldConfig[],
    initialValues?: FieldValues,
    adapter?: FormAdapter,
  ) {
    this.adapter = adapter;
    this.previousValues = initialValues ?? {};
    this.initializeFromConfigs(configs);
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeFromConfigs(configs: DependentFieldConfig[]): void {
    // Build config map
    for (const config of configs) {
      this.configMap.set(config.name, config);
    }

    // Build dependency graph
    for (const config of configs) {
      const deps = normalizeDependsOn(config.dependsOn);
      this.reverseDependency.set(config.name, deps);

      for (const dep of deps) {
        if (!this.dependencyGraph.has(dep)) {
          this.dependencyGraph.set(dep, new Set());
        }
        this.dependencyGraph.get(dep)!.add(config.name);
      }
    }
  }

  // ============================================================================
  // Public Getters - Read from Form (via adapter) or cache
  // ============================================================================

  getValue = (fieldName: string): FieldValue | FieldValue[] | undefined => {
    // Read from form adapter if available
    if (this.adapter?.getFieldValue) {
      return this.adapter.getFieldValue(fieldName);
    }
    // Fallback to cached value
    return this.previousValues[fieldName];
  };

  getValues = (): FieldValues => {
    // Read from form adapter if available
    if (this.adapter?.getFieldsValue) {
      return this.adapter.getFieldsValue();
    }
    // Fallback to cached values
    return { ...this.previousValues };
  };

  getDependencyValues = (
    fieldName: string,
  ): Record<string, FieldValue | FieldValue[]> => {
    const deps = this.reverseDependency.get(fieldName) ?? [];
    const result: Record<string, FieldValue | FieldValue[]> = {};

    for (const dep of deps) {
      const value = this.getValue(dep);
      if (value !== undefined) {
        result[dep] = value;
      }
    }

    return result;
  };

  getConfig = (fieldName: string): DependentFieldConfig | undefined => {
    return this.configMap.get(fieldName);
  };

  hasDependencies = (fieldName: string): boolean => {
    const deps = this.reverseDependency.get(fieldName);
    return deps !== undefined && deps.length > 0;
  };

  isDependencySatisfied = (fieldName: string): boolean => {
    const deps = this.reverseDependency.get(fieldName) ?? [];
    if (deps.length === 0) return true;

    return deps.every((dep) => {
      const value = this.getValue(dep);
      if (value === undefined || value === null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
  };

  // ============================================================================
  // Public Actions
  // ============================================================================

  /**
   * Called when a field value changes (from UI).
   * This will:
   * 1. Update form via adapter
   * 2. Notify subscribers
   * 3. Trigger dependency callbacks
   */
  setValue = (
    fieldName: string,
    newValue: FieldValue | FieldValue[] | undefined,
  ): void => {
    if (this.isDestroyed) return;

    const oldValue = this.previousValues[fieldName];

    // Skip if value hasn't changed
    if (shallowEqual(oldValue, newValue)) return;

    // Capture previous dependency values for dependent fields
    const previousDependencySnapshots =
      this.captureDependencySnapshots(fieldName);

    // Update form via adapter (Form is source of truth)
    if (this.adapter) {
      this.adapter.setFieldValue(fieldName, newValue);
    }

    // Update cache
    if (newValue === undefined) {
      delete this.previousValues[fieldName];
    } else {
      this.previousValues[fieldName] = newValue;
    }

    // Notify subscribers
    this.notifyFieldSubscribers(fieldName);
    this.notifyGlobalSubscribers();

    // Trigger dependency callbacks
    this.triggerDependencyChange(fieldName, previousDependencySnapshots);
  };

  /**
   * Sync value from form to store cache.
   * Call this when form value changes externally.
   */
  syncFromForm = (
    fieldName: string,
    newValue: FieldValue | FieldValue[] | undefined,
  ): void => {
    if (this.isDestroyed) return;

    const oldValue = this.previousValues[fieldName];
    if (shallowEqual(oldValue, newValue)) return;

    // Capture previous dependency values
    const previousDependencySnapshots =
      this.captureDependencySnapshots(fieldName);

    // Update cache only (form already has the value)
    if (newValue === undefined) {
      delete this.previousValues[fieldName];
    } else {
      this.previousValues[fieldName] = newValue;
    }

    // Notify subscribers
    this.notifyFieldSubscribers(fieldName);
    this.notifyGlobalSubscribers();

    // Trigger dependency callbacks
    this.triggerDependencyChange(fieldName, previousDependencySnapshots);
  };

  /**
   * Reset cache
   */
  reset = (values?: FieldValues): void => {
    if (this.isDestroyed) return;
    this.previousValues = values ? { ...values } : {};
    this.notifyGlobalSubscribers();
  };

  /**
   * Update adapter
   */
  setAdapter = (adapter?: FormAdapter): void => {
    this.adapter = adapter;
  };

  // ============================================================================
  // Subscriptions
  // ============================================================================

  subscribe = (listener: Subscriber): (() => void) => {
    this.globalSubscribers.add(listener);
    return () => {
      this.globalSubscribers.delete(listener);
    };
  };

  subscribeToField = (
    fieldName: string,
    listener: Subscriber,
  ): (() => void) => {
    if (!this.fieldSubscribers.has(fieldName)) {
      this.fieldSubscribers.set(fieldName, new Set());
    }
    this.fieldSubscribers.get(fieldName)!.add(listener);

    return () => {
      this.fieldSubscribers.get(fieldName)?.delete(listener);
    };
  };

  // ============================================================================
  // Private Methods
  // ============================================================================

  private captureDependencySnapshots(
    changedField: string,
  ): Map<string, Record<string, FieldValue | FieldValue[]>> {
    const snapshots = new Map<
      string,
      Record<string, FieldValue | FieldValue[]>
    >();
    const dependents = this.getDependentFields(changedField);

    for (const dependent of dependents) {
      snapshots.set(dependent, this.getDependencyValues(dependent));
    }

    return snapshots;
  }

  private getDependentFields(fieldName: string): string[] {
    const dependents: string[] = [];
    const queue = [fieldName];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const directDependents = this.dependencyGraph.get(current);
      if (directDependents) {
        for (const dep of directDependents) {
          if (!visited.has(dep)) {
            dependents.push(dep);
            queue.push(dep);
          }
        }
      }
    }

    return dependents;
  }

  private triggerDependencyChange(
    changedField: string,
    previousSnapshots: Map<string, Record<string, FieldValue | FieldValue[]>>,
  ): void {
    const dependents = this.getDependentFields(changedField);

    for (const dependent of dependents) {
      const config = this.configMap.get(dependent);
      if (!config?.onDependencyChange) continue;

      const previousDependencyValues = previousSnapshots.get(dependent) ?? {};
      const currentDependencyValues = this.getDependencyValues(dependent);

      const params: DependencyChangeParams = {
        fieldName: dependent,
        currentValue: this.getValue(dependent),
        dependencyValues: currentDependencyValues,
        previousDependencyValues,
        setValue: (value) => this.setValue(dependent, value),
        hasChanged: (depName) => {
          return !shallowEqual(
            previousDependencyValues[depName],
            currentDependencyValues[depName],
          );
        },
      };

      config.onDependencyChange(params);
    }
  }

  private notifyFieldSubscribers(fieldName: string): void {
    const subscribers = this.fieldSubscribers.get(fieldName);
    if (subscribers) {
      subscribers.forEach((sub) => sub());
    }

    // Also notify dependents
    const dependents = this.dependencyGraph.get(fieldName);
    if (dependents) {
      dependents.forEach((dep) => {
        const depSubscribers = this.fieldSubscribers.get(dep);
        if (depSubscribers) {
          depSubscribers.forEach((sub) => sub());
        }
      });
    }
  }

  private notifyGlobalSubscribers(): void {
    this.globalSubscribers.forEach((sub) => sub());
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy = (): void => {
    this.isDestroyed = true;
    this.fieldSubscribers.clear();
    this.globalSubscribers.clear();
  };
}
