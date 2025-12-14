/**
 * SmartSelectStore - Centralized state management
 *
 * Manages:
 * - Field values
 * - Dependency tracking
 * - Subscriptions for selective re-renders
 */

import type {
  BaseItem,
  DependencyChangeParams,
  DependencyConfig,
  FormAdapter,
  InfiniteConfig,
  SelectValue,
  SmartSelectProviderConfig,
} from './types';

// ============================================================================
// Types
// ============================================================================

type Subscriber = () => void;

// ============================================================================
// Store Class
// ============================================================================

export class SmartSelectStore {
  // Values
  private values: Record<string, SelectValue> = {};
  private previousValues: Record<string, SelectValue> = {};

  // Configs
  private infiniteConfigs: Map<string, InfiniteConfig<any>> = new Map();
  private dependencyConfigs: Map<string, DependencyConfig> = new Map();

  // Dependency graph: fieldName → fields that depend on it
  private dependencyGraph: Map<string, Set<string>> = new Map();

  // Reverse dependency: fieldName → fields it depends on
  private reverseDependency: Map<string, string[]> = new Map();

  // Subscribers
  private fieldSubscribers: Map<string, Set<Subscriber>> = new Map();
  private globalSubscribers: Set<Subscriber> = new Set();

  // Form adapter
  private adapter?: FormAdapter;

  // Destroyed flag
  private isDestroyed = false;

  constructor(
    config?: SmartSelectProviderConfig,
    initialValues?: Record<string, SelectValue>,
    adapter?: FormAdapter,
  ) {
    this.adapter = adapter;
    this.values = { ...initialValues };
    this.previousValues = { ...initialValues };

    if (config) {
      this.initializeConfigs(config);
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeConfigs(config: SmartSelectProviderConfig): void {
    // Store infinite configs
    if (config.infiniteConfigs) {
      Object.entries(config.infiniteConfigs).forEach(([name, cfg]) => {
        this.infiniteConfigs.set(name, cfg);
      });
    }

    // Store dependency configs and build graph
    if (config.dependencyConfigs) {
      Object.entries(config.dependencyConfigs).forEach(([name, cfg]) => {
        this.dependencyConfigs.set(name, cfg);
        this.buildDependencyGraph(cfg);
      });
    }
  }

  private buildDependencyGraph(config: DependencyConfig): void {
    const deps = this.normalizeDependsOn(config.dependsOn);
    this.reverseDependency.set(config.name, deps);

    deps.forEach((dep) => {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)!.add(config.name);
    });
  }

  private normalizeDependsOn(dependsOn?: string | string[]): string[] {
    if (!dependsOn) return [];
    return Array.isArray(dependsOn) ? dependsOn : [dependsOn];
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  getValue = (name: string): SelectValue => {
    // Try adapter first
    if (this.adapter?.getFieldValue) {
      return this.adapter.getFieldValue(name);
    }
    return this.values[name];
  };

  getValues = (): Record<string, SelectValue> => {
    if (this.adapter?.getFieldsValue) {
      return this.adapter.getFieldsValue();
    }
    return { ...this.values };
  };

  getDependencyValues = (fieldName: string): Record<string, SelectValue> => {
    const deps = this.reverseDependency.get(fieldName) ?? [];
    const result: Record<string, SelectValue> = {};

    deps.forEach((dep) => {
      result[dep] = this.getValue(dep);
    });

    return result;
  };

  getInfiniteConfig = <T extends BaseItem>(
    name: string,
  ): InfiniteConfig<T> | undefined => {
    return this.infiniteConfigs.get(name) as InfiniteConfig<T> | undefined;
  };

  getDependencyConfig = (name: string): DependencyConfig | undefined => {
    return this.dependencyConfigs.get(name);
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

  hasDependencies = (fieldName: string): boolean => {
    const deps = this.reverseDependency.get(fieldName);
    return deps !== undefined && deps.length > 0;
  };

  // ============================================================================
  // Public Actions
  // ============================================================================

  setValue = (name: string, newValue: SelectValue): void => {
    if (this.isDestroyed) return;

    const oldValue = this.values[name];
    if (this.shallowEqual(oldValue, newValue)) return;

    // Capture previous dependency values for affected fields
    const previousSnapshots = this.captureDependencySnapshots(name);

    // Update value
    this.values[name] = newValue;

    // Sync to form adapter
    if (this.adapter) {
      this.adapter.setFieldValue(name, newValue);
    }

    // Notify subscribers
    this.notifyFieldSubscribers(name);
    this.notifyGlobalSubscribers();

    // Trigger dependency callbacks
    this.triggerDependencyCallbacks(name, previousSnapshots);

    // Update previous values
    this.previousValues[name] = newValue;
  };

  setValues = (newValues: Record<string, SelectValue>): void => {
    Object.entries(newValues).forEach(([name, value]) => {
      this.setValue(name, value);
    });
  };

  /** Register a dependency config at runtime */
  registerDependencyConfig = (config: DependencyConfig): void => {
    this.dependencyConfigs.set(config.name, config);
    this.buildDependencyGraph(config);
  };

  /** Register an infinite config at runtime */
  registerInfiniteConfig = <T extends BaseItem>(
    name: string,
    config: InfiniteConfig<T>,
  ): void => {
    this.infiniteConfigs.set(name, config);
  };

  setAdapter = (adapter?: FormAdapter): void => {
    this.adapter = adapter;
  };

  // ============================================================================
  // Subscriptions
  // ============================================================================

  subscribe = (callback: Subscriber): (() => void) => {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  };

  subscribeToField = (name: string, callback: Subscriber): (() => void) => {
    if (!this.fieldSubscribers.has(name)) {
      this.fieldSubscribers.set(name, new Set());
    }
    this.fieldSubscribers.get(name)!.add(callback);

    return () => {
      this.fieldSubscribers.get(name)?.delete(callback);
    };
  };

  subscribeToFields = (names: string[], callback: Subscriber): (() => void) => {
    const unsubscribes = names.map((name) =>
      this.subscribeToField(name, callback),
    );
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  };

  // ============================================================================
  // Private Methods
  // ============================================================================

  private shallowEqual(a: SelectValue, b: SelectValue): boolean {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => val === b[i]);
    }
    return false;
  }

  private captureDependencySnapshots(
    changedField: string,
  ): Map<string, Record<string, SelectValue>> {
    const snapshots = new Map<string, Record<string, SelectValue>>();
    const dependents = this.getAllDependentFields(changedField);

    dependents.forEach((dependent) => {
      snapshots.set(dependent, this.getDependencyValues(dependent));
    });

    return snapshots;
  }

  private getAllDependentFields(fieldName: string): string[] {
    const dependents: string[] = [];
    const queue = [fieldName];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const directDependents = this.dependencyGraph.get(current);
      if (directDependents) {
        directDependents.forEach((dep) => {
          if (!visited.has(dep)) {
            dependents.push(dep);
            queue.push(dep);
          }
        });
      }
    }

    return dependents;
  }

  private triggerDependencyCallbacks(
    changedField: string,
    previousSnapshots: Map<string, Record<string, SelectValue>>,
  ): void {
    const dependents = this.getAllDependentFields(changedField);

    dependents.forEach((dependent) => {
      const config = this.dependencyConfigs.get(dependent);
      if (!config?.onDependencyChange) return;

      const previousDependencyValues = previousSnapshots.get(dependent) ?? {};
      const currentDependencyValues = this.getDependencyValues(dependent);

      const params: DependencyChangeParams = {
        currentValue: this.getValue(dependent),
        dependencyValues: currentDependencyValues,
        previousDependencyValues,
        hasChanged: (depName) => {
          return !this.shallowEqual(
            previousDependencyValues[depName],
            currentDependencyValues[depName],
          );
        },
      };

      const newValue = config.onDependencyChange(params);

      // If callback returns a value, update the field
      if (newValue !== undefined) {
        this.setValue(dependent, newValue);
      }
    });
  }

  private notifyFieldSubscribers(name: string): void {
    // Notify the field itself
    this.fieldSubscribers.get(name)?.forEach((sub) => sub());

    // Notify dependent fields
    const dependents = this.dependencyGraph.get(name);
    if (dependents) {
      dependents.forEach((dep) => {
        this.fieldSubscribers.get(dep)?.forEach((sub) => sub());
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
