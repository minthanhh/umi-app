import { createContext, useContext } from 'react';

import type { BaseItem, SelectContext } from './types';

// ============================================================================
// Context Creation
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SelectWrapperContext = createContext<SelectContext<any> | null>(null);

SelectWrapperContext.displayName = 'SelectWrapperContext';

// ============================================================================
// Context Provider Component
// ============================================================================

interface SelectProviderProps<T extends BaseItem> {
  value: SelectContext<T>;
  children: React.ReactNode;
}

export function SelectProvider<T extends BaseItem>({
  value,
  children,
}: SelectProviderProps<T>) {
  return (
    <SelectWrapperContext.Provider value={value}>
      {children}
    </SelectWrapperContext.Provider>
  );
}

// ============================================================================
// useSelectContext Hook
// ============================================================================

export function useSelectContext<T extends BaseItem>(): SelectContext<T> {
  const context = useContext(SelectWrapperContext);

  if (!context) {
    throw new Error(
      'useSelectContext must be used within a SelectWrapper component',
    );
  }

  return context as SelectContext<T>;
}
