/**
 * XSelect DevTools - Redux DevTools Integration
 *
 * Allows monitoring XSelect state changes in Redux DevTools browser extension.
 *
 * @example Enable DevTools
 * ```tsx
 * import { enableXSelectDevTools } from 'x-select';
 *
 * // Enable globally (call once at app startup)
 * enableXSelectDevTools();
 *
 * // Or with options
 * enableXSelectDevTools({
 *   name: 'XSelect Store',
 *   maxAge: 50, // Max number of actions to keep
 * });
 * ```
 *
 * @example Connect specific store
 * ```tsx
 * const store = new XSelectStore(configs);
 * connectStoreToDevTools(store, 'MyFormStore');
 * ```
 */

import { useEffect } from 'react';
import type { XSelectStore } from '../store/XSelectStore';
import type { FieldValues } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Redux DevTools Extension interface
 */
interface ReduxDevToolsExtension {
  connect(options?: DevToolsOptions): DevToolsConnection;
  disconnect(): void;
}

interface DevToolsOptions {
  name?: string;
  maxAge?: number;
  serialize?: boolean | object;
  actionSanitizer?: (action: DevToolsAction) => DevToolsAction;
  stateSanitizer?: (state: unknown) => unknown;
  trace?: boolean;
  traceLimit?: number;
}

interface DevToolsConnection {
  init(state: unknown): void;
  send(action: DevToolsAction | string, state: unknown): void;
  subscribe(listener: (message: DevToolsMessage) => void): () => void;
  unsubscribe(): void;
  error(message: string): void;
}

interface DevToolsAction {
  type: string;
  payload?: unknown;
}

interface DevToolsMessage {
  type: string;
  payload?: {
    type?: string;
    state?: string;
  };
  state?: string;
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevToolsExtension;
  }
}

// ============================================================================
// STATE
// ============================================================================

let globalDevTools: DevToolsConnection | null = null;
let isEnabled = false;
const connectedStores = new Map<XSelectStore, { unsubscribe: () => void; name: string }>();
let storeCounter = 0;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get Redux DevTools extension if available
 */
function getDevToolsExtension(): ReduxDevToolsExtension | undefined {
  if (typeof window !== 'undefined') {
    return window.__REDUX_DEVTOOLS_EXTENSION__;
  }
  return undefined;
}

/**
 * Format state for DevTools display
 */
function formatState(stores: Map<XSelectStore, { name: string }>): Record<string, unknown> {
  const state: Record<string, unknown> = {};

  stores.forEach(({ name }, store) => {
    const configs = store.getConfigs();
    const values = store.getValues();

    state[name] = {
      values,
      fields: configs.reduce(
        (acc, config) => {
          const snapshot = store.getFieldSnapshot(config.name);
          acc[config.name] = {
            value: snapshot.value,
            parentValue: snapshot.parentValue,
            parentValues: snapshot.parentValues,
            isLoading: snapshot.isLoading,
            hasOptions: store.getOptions(config.name).length,
            config: {
              dependsOn: config.dependsOn,
              mode: config.mode,
              label: config.label,
            },
          };
          return acc;
        },
        {} as Record<string, unknown>,
      ),
      _meta: {
        fieldCount: configs.length,
        timestamp: new Date().toISOString(),
      },
    };
  });

  return state;
}

/**
 * Get combined state from all connected stores
 */
function getCombinedState(): Record<string, unknown> {
  const storeMap = new Map<XSelectStore, { name: string }>();
  connectedStores.forEach((info, store) => {
    storeMap.set(store, { name: info.name });
  });
  return formatState(storeMap);
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface EnableDevToolsOptions extends DevToolsOptions {
  /** Auto-connect new stores created after enabling */
  autoConnect?: boolean;
}

/**
 * Enable XSelect DevTools globally.
 * Call this once at app startup.
 *
 * @example
 * ```tsx
 * // In your app entry point
 * import { enableXSelectDevTools } from 'x-select';
 *
 * if (process.env.NODE_ENV === 'development') {
 *   enableXSelectDevTools();
 * }
 * ```
 */
export function enableXSelectDevTools(options: EnableDevToolsOptions = {}): boolean {
  const extension = getDevToolsExtension();

  if (!extension) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[XSelect DevTools] Redux DevTools extension not found. ' +
          'Install it from https://github.com/reduxjs/redux-devtools',
      );
    }
    return false;
  }

  if (isEnabled) {
    console.warn('[XSelect DevTools] Already enabled');
    return true;
  }

  const { name = 'XSelect', maxAge = 50, ...rest } = options;

  globalDevTools = extension.connect({
    name,
    maxAge,
    ...rest,
  });

  // Initialize with empty state
  globalDevTools.init({});

  // Handle time travel
  globalDevTools.subscribe((message) => {
    if (message.type === 'DISPATCH' && message.payload?.type === 'JUMP_TO_ACTION') {
      // Time travel - restore state from DevTools
      if (message.state) {
        try {
          const state = JSON.parse(message.state) as Record<string, { values: FieldValues }>;

          connectedStores.forEach(({ name: storeName }, store) => {
            const storeState = state[storeName];
            if (storeState?.values) {
              store.setValues(storeState.values);
            }
          });
        } catch (e) {
          console.error('[XSelect DevTools] Failed to restore state:', e);
        }
      }
    }
  });

  isEnabled = true;

  if (process.env.NODE_ENV === 'development') {
    console.log('[XSelect DevTools] Enabled. Open Redux DevTools to inspect state.');
  }

  return true;
}

/**
 * Disable XSelect DevTools
 */
export function disableXSelectDevTools(): void {
  if (!isEnabled) return;

  // Disconnect all stores
  const storesToDisconnect: XSelectStore[] = [];
  connectedStores.forEach((_, store) => {
    storesToDisconnect.push(store);
  });
  storesToDisconnect.forEach((store) => {
    disconnectStoreFromDevTools(store);
  });

  globalDevTools?.unsubscribe();
  globalDevTools = null;
  isEnabled = false;
}

/**
 * Check if DevTools is enabled
 */
export function isDevToolsEnabled(): boolean {
  return isEnabled;
}

/**
 * Connect a specific XSelectStore to DevTools.
 *
 * @example
 * ```tsx
 * const store = new XSelectStore(configs);
 * const disconnect = connectStoreToDevTools(store, 'UserForm');
 *
 * // Later, to disconnect:
 * disconnect();
 * ```
 */
export function connectStoreToDevTools(
  store: XSelectStore,
  name?: string,
): () => void {
  if (!isEnabled || !globalDevTools) {
    // Auto-enable if not enabled
    const enabled = enableXSelectDevTools();
    if (!enabled) {
      return () => {}; // No-op if DevTools not available
    }
  }

  if (connectedStores.has(store)) {
    console.warn('[XSelect DevTools] Store already connected');
    return () => disconnectStoreFromDevTools(store);
  }

  const storeName = name || `XSelectStore_${++storeCounter}`;

  // Subscribe to all fields
  const configs = store.getConfigs();
  const unsubscribers: Array<() => void> = [];

  for (const config of configs) {
    const unsub = store.subscribe(config.name, () => {
      // Send update to DevTools
      if (globalDevTools) {
        const fieldSnapshot = store.getFieldSnapshot(config.name);

        globalDevTools.send(
          {
            type: `${storeName}/${config.name}/CHANGE`,
            payload: {
              field: config.name,
              value: fieldSnapshot.value,
              parentValue: fieldSnapshot.parentValue,
            },
          },
          getCombinedState(),
        );
      }
    });
    unsubscribers.push(unsub);
  }

  const unsubscribe = () => {
    unsubscribers.forEach((unsub) => unsub());
  };

  connectedStores.set(store, { unsubscribe, name: storeName });

  // Send initial state
  if (globalDevTools) {
    globalDevTools.send(
      { type: `${storeName}/INIT`, payload: { fields: configs.map((c) => c.name) } },
      getCombinedState(),
    );
  }

  return () => disconnectStoreFromDevTools(store);
}

/**
 * Disconnect a store from DevTools
 */
export function disconnectStoreFromDevTools(store: XSelectStore): void {
  const info = connectedStores.get(store);
  if (info) {
    info.unsubscribe();
    connectedStores.delete(store);

    if (globalDevTools) {
      globalDevTools.send({ type: `${info.name}/DISCONNECT` }, getCombinedState());
    }
  }
}

/**
 * Send a custom action to DevTools (for debugging)
 */
export function sendToDevTools(action: string | DevToolsAction, state?: unknown): void {
  if (!globalDevTools) return;

  const actionObj = typeof action === 'string' ? { type: action } : action;
  globalDevTools.send(actionObj, state ?? getCombinedState());
}

/**
 * Log current state to console (for debugging without DevTools)
 */
export function logXSelectState(store?: XSelectStore): void {
  if (store) {
    const configs = store.getConfigs();
    const state = {
      values: store.getValues(),
      fields: configs.map((c) => ({
        name: c.name,
        snapshot: store.getFieldSnapshot(c.name),
        optionsCount: store.getOptions(c.name).length,
      })),
    };
    console.log('[XSelect State]', state);
  } else {
    console.log('[XSelect State - All Stores]', getCombinedState());
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

/**
 * React hook to auto-connect store to DevTools.
 * Use this inside XSelectProvider.
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const store = useXSelectStore();
 *   useXSelectDevTools(store, 'MyForm');
 *
 *   return <...>;
 * }
 * ```
 */
export function useXSelectDevTools(store: XSelectStore | null, name?: string): void {
  // Import React lazily to avoid issues if React is not available

  useEffect(() => {
    if (!store) return;

    const disconnect = connectStoreToDevTools(store, name);
    return disconnect;
  }, [store, name]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { DevToolsOptions, DevToolsAction };
