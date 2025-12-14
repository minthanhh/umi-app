/**
 * SyncedSelect - Form-Synced Select Component
 *
 * Internal component that handles bidirectional sync between
 * Ant Design Form and DependentSelectStore.
 *
 * Data flow:
 * 1. User selects option → Store (cascade logic) → Form (via adapter)
 * 2. Store cascade-delete → Form update (via adapter)
 *
 * IMPORTANT: This component NO LONGER syncs store→form via useEffect.
 * Instead, the adapter pattern handles all form updates.
 * This prevents unnecessary re-renders caused by form.setFieldValue.
 *
 * This component is NOT exported directly. Use FormDependentSelectField instead.
 */

import type { SelectProps } from 'antd';
import { Select } from 'antd';
import { memo, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for SyncedSelect component.
 * Extends Select props but replaces value/onChange with sync logic.
 */
export interface SyncedSelectProps
  extends Omit<SelectProps, 'value' | 'onChange'> {
  /** Value from Form.Item (injected by Form) */
  value?: unknown;

  /** onChange from Form.Item (injected by Form) */
  onChange?: (value: unknown) => void;

  /** Value from DependentSelectStore (for display, not used for control) */
  storeValue: unknown;

  /** Store's onChange handler (triggers cascade logic) */
  onStoreChange: (value: unknown) => void;

  /** Field name (for debugging) */
  fieldName: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Select component that syncs between Ant Design Form and DependentSelectStore.
 *
 * Architecture:
 * - Form.Item injects `value` and `onChange` props (Form is source of truth for display)
 * - User selections update Store first (cascade logic), then adapter syncs to Form
 * - Cascade delete updates are handled by adapter.onFieldChange/onFieldsChange
 *
 * Why no useEffect sync?
 * - The adapter pattern already handles store→form sync
 * - useEffect + form.setFieldValue causes extra re-renders for ALL Form.Items
 * - By removing useEffect, we prevent cascading re-renders
 *
 * @param props - Component props
 * @returns Ant Design Select with sync logic
 *
 * @internal This component is used internally by FormDependentSelectField.
 * Do not use directly.
 */
function SyncedSelectInner({
  value: formValue,
  onChange: formOnChange,
  storeValue: _storeValue, // Kept for type compatibility, not used
  onStoreChange,
  fieldName: _fieldName, // Kept for type compatibility, not used
  ...selectProps
}: SyncedSelectProps) {
  // Handle user selection
  // Updates store first (triggers cascade) → adapter syncs to form
  const handleChange = useCallback(
    (newValue: unknown) => {
      // Update store first (may trigger cascade delete)
      // The adapter will sync changes back to form
      onStoreChange(newValue);
      // Also update form directly for immediate feedback
      formOnChange?.(newValue);
    },
    [formOnChange, onStoreChange],
  );

  // Use formValue for display (Form is source of truth for UI)
  return <Select value={formValue} onChange={handleChange} {...selectProps} />;
}

/**
 * Compare two values for equality (handles arrays).
 * Form.Item may pass new array references even if content is unchanged.
 */
function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
  }
  return false;
}

/**
 * Memoized SyncedSelect to prevent unnecessary re-renders.
 * Only re-renders when props actually change.
 *
 * IMPORTANT: Uses deep comparison for value props because
 * Ant Design Form.Item may pass new array references even when
 * the actual content hasn't changed.
 */
export const SyncedSelect = memo(SyncedSelectInner, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  // Use areValuesEqual for value/storeValue to handle array references
  return (
    areValuesEqual(prevProps.value, nextProps.value) &&
    areValuesEqual(prevProps.storeValue, nextProps.storeValue) &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.loading === nextProps.loading &&
    prevProps.options === nextProps.options &&
    prevProps.mode === nextProps.mode &&
    prevProps.placeholder === nextProps.placeholder
  );
});