/**
 * Select.Dependent - Dependency wrapper component
 *
 * Features:
 * - Track dependencies (single or multiple)
 * - Auto-reset when dependencies change
 * - Disable when dependencies not satisfied
 * - Render props for any UI library
 *
 * Does NOT know about infinite scroll - completely independent
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

import { useSmartSelectStore } from './context';
import type {
  DependencyChangeParams,
  DependencyConfig,
  DependentProps,
  DependentRenderProps,
  SelectValue,
} from './types';

// ============================================================================
// Component
// ============================================================================

export function Dependent({
  name,
  dependsOn,
  config: inlineConfig,
  configName,
  value: controlledValue,
  onChange: controlledOnChange,
  disableOnUnsatisfied = true,
  children,
}: DependentProps) {
  // Get store (required for Dependent)
  const store = useSmartSelectStore();

  // Get config from provider if configName provided
  const providerConfig = configName
    ? store.getDependencyConfig(configName)
    : undefined;

  // Normalize dependsOn
  const normalizedDepsOn = useMemo(() => {
    if (dependsOn) {
      return Array.isArray(dependsOn) ? dependsOn : [dependsOn];
    }
    const cfgDepsOn = providerConfig?.dependsOn;
    if (cfgDepsOn) {
      return Array.isArray(cfgDepsOn) ? cfgDepsOn : [cfgDepsOn];
    }
    return [];
  }, [dependsOn, providerConfig?.dependsOn]);

  // Register dependency config at runtime
  useEffect(() => {
    const config: DependencyConfig = {
      name,
      dependsOn: normalizedDepsOn,
      onDependencyChange:
        inlineConfig?.onDependencyChange ?? providerConfig?.onDependencyChange,
    };
    store.registerDependencyConfig(config);
  }, [name, normalizedDepsOn, inlineConfig, providerConfig, store]);

  // Track previous dependency values for change detection
  const prevDepsRef = useRef<Record<string, SelectValue>>({});

  // Subscribe to field and its dependencies
  const subscribe = useCallback(
    (callback: () => void) => {
      const allFields = [name, ...normalizedDepsOn];
      return store.subscribeToFields(allFields, callback);
    },
    [store, name, normalizedDepsOn],
  );

  // Get current value
  const getValueSnapshot = useCallback(() => {
    if (controlledValue !== undefined) return controlledValue;
    return store.getValue(name);
  }, [store, name, controlledValue]);

  const value = useSyncExternalStore(
    subscribe,
    getValueSnapshot,
    getValueSnapshot,
  );

  // Get dependency values
  const getDepsSnapshot = useCallback(() => {
    const result: Record<string, SelectValue> = {};
    normalizedDepsOn.forEach((dep) => {
      result[dep] = store.getValue(dep);
    });
    return result;
  }, [store, normalizedDepsOn]);

  // Use ref to maintain stable reference
  const depsSnapshotRef = useRef<Record<string, SelectValue>>({});

  const dependencyValues = useSyncExternalStore(
    subscribe,
    () => {
      const newDeps = getDepsSnapshot();
      // Check if actually changed
      const hasChanged = normalizedDepsOn.some(
        (dep) => depsSnapshotRef.current[dep] !== newDeps[dep],
      );
      if (hasChanged) {
        depsSnapshotRef.current = newDeps;
      }
      return depsSnapshotRef.current;
    },
    () => depsSnapshotRef.current,
  );

  // Check if dependencies are satisfied
  const isDependencySatisfied = useMemo(() => {
    if (normalizedDepsOn.length === 0) return true;

    return normalizedDepsOn.every((dep) => {
      const depValue = dependencyValues[dep];
      if (depValue === undefined || depValue === null) return false;
      if (Array.isArray(depValue) && depValue.length === 0) return false;
      return true;
    });
  }, [normalizedDepsOn, dependencyValues]);

  // Handle value change
  const handleChange = useCallback(
    (newValue: SelectValue) => {
      store.setValue(name, newValue);
      controlledOnChange?.(newValue);
    },
    [store, name, controlledOnChange],
  );

  // Handle dependency change callback
  useEffect(() => {
    const onDependencyChange =
      inlineConfig?.onDependencyChange ?? providerConfig?.onDependencyChange;

    if (!onDependencyChange) {
      prevDepsRef.current = dependencyValues;
      return;
    }

    // Check if any dependency actually changed
    const hasAnyChange = normalizedDepsOn.some(
      (dep) => prevDepsRef.current[dep] !== dependencyValues[dep],
    );

    if (hasAnyChange && Object.keys(prevDepsRef.current).length > 0) {
      const params: DependencyChangeParams = {
        currentValue: value,
        dependencyValues,
        previousDependencyValues: prevDepsRef.current,
        hasChanged: (depName) =>
          prevDepsRef.current[depName] !== dependencyValues[depName],
      };

      const newValue = onDependencyChange(params);
      if (newValue !== undefined) {
        handleChange(newValue);
      }
    }

    prevDepsRef.current = dependencyValues;
  }, [
    dependencyValues,
    handleChange,
    inlineConfig?.onDependencyChange,
    normalizedDepsOn,
    providerConfig?.onDependencyChange,
    value,
  ]);

  // Build render props
  const renderProps: DependentRenderProps = {
    value,
    dependencyValues,
    isDependencySatisfied,
    isDisabledByDependency: disableOnUnsatisfied && !isDependencySatisfied,
    onChange: handleChange,
  };

  // Render
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  // For non-function children, clone and inject props
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onChange: handleChange,
            disabled:
              (child.props as any).disabled ||
              (disableOnUnsatisfied && !isDependencySatisfied),
            __dependentProps: renderProps,
          });
        }
        return child;
      })}
    </>
  );
}

export default Dependent;
