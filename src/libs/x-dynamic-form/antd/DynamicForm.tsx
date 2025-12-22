/**
 * Antd DynamicForm Compound Component
 *
 * A compound component pattern for building dynamic forms with Ant Design.
 * This integrates with Ant Design's Form component for form state management.
 *
 * Features:
 * - Uses Antd Form's state management (no internal store)
 * - Compound component pattern (DynamicForm.Field, DynamicForm.List)
 * - Fully customizable and extensible
 * - Pass-through all Antd Form props
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Form } from 'antd';
import type { FormInstance, FormProps } from 'antd';
import { FormProvider, Field as CoreField, FieldList as CoreFieldList, type FieldRegistry } from '../core';
import type { FieldProps, FieldListProps } from '../core';
import { antdRegistry } from './registry';
import { AntdFormItemWrapper } from './FormItemWrapper';

// =============================================================================
// CONTEXT
// =============================================================================

interface DynamicFormContextValue {
  form: FormInstance;
}

const DynamicFormContext = createContext<DynamicFormContextValue | null>(null);

function useDynamicFormContext() {
  const ctx = useContext(DynamicFormContext);
  if (!ctx) {
    throw new Error('DynamicForm compound components must be used within DynamicForm');
  }
  return ctx;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface DynamicFormProps extends Omit<FormProps, 'form'> {
  /** Antd Form instance (from Form.useForm()) */
  form: FormInstance;
  /** Custom field registry (defaults to antdRegistry) */
  registry?: FieldRegistry;
  /** Whether to wrap fields with AntdFormItemWrapper (default: true) */
  useFormItemWrapper?: boolean;
  /** Children */
  children: ReactNode;
}

/**
 * DynamicForm - Compound component for dynamic forms with Ant Design
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const [form] = Form.useForm();
 *
 *   return (
 *     <DynamicForm form={form} layout="vertical">
 *       <DynamicForm.Field config={{ type: 'input', name: 'email', label: 'Email' }} />
 *       <DynamicForm.Field config={{ type: 'input', name: 'password', label: 'Password', inputType: 'password' }} />
 *       <Button type="primary" htmlType="submit">Submit</Button>
 *     </DynamicForm>
 *   );
 * }
 * ```
 */
function DynamicFormRoot({
  form,
  registry = antdRegistry,
  useFormItemWrapper = true,
  children,
  ...formProps
}: DynamicFormProps) {
  // Create getValue/setValue functions from Antd form
  const getValue = (name: string) => form.getFieldValue(name);
  const setValue = (name: string, value: unknown) => form.setFieldValue(name, value);
  const getError = (name: string) => {
    const errors = form.getFieldError(name);
    return errors.length > 0 ? errors[0] : undefined;
  };

  const contextValue = useMemo(() => ({ form }), [form]);

  return (
    <DynamicFormContext.Provider value={contextValue}>
      <Form form={form} {...formProps}>
        <FormProvider
          registry={registry}
          FormItemWrapper={useFormItemWrapper ? AntdFormItemWrapper : undefined}
          getValue={getValue}
          setValue={setValue}
          getError={getError}
        >
          {children}
        </FormProvider>
      </Form>
    </DynamicFormContext.Provider>
  );
}

// =============================================================================
// FIELD COMPONENT (ANTD INTEGRATED)
// =============================================================================

/**
 * DynamicForm.Field - Renders a field that integrates with Antd Form
 *
 * This wraps the core Field component and integrates it with Antd Form's
 * state management using Form.Item with name binding.
 */
function DynamicFormField(props: FieldProps) {
  // Use the core Field which will pick up context from FormProvider
  return <CoreField {...props} />;
}

// =============================================================================
// FIELD LIST COMPONENT
// =============================================================================

/**
 * DynamicForm.List - Renders multiple fields from config array
 */
function DynamicFormFieldList(props: FieldListProps) {
  return <CoreFieldList {...props} />;
}

// =============================================================================
// FORM.LIST INTEGRATION (for array fields)
// =============================================================================

export interface FormArrayProps {
  /** Field name for the array */
  name: string;
  /** Render prop for array items */
  children: (
    fields: Array<{ key: number; name: number; fieldKey?: number }>,
    operations: {
      add: (defaultValue?: unknown, insertIndex?: number) => void;
      remove: (index: number | number[]) => void;
      move: (from: number, to: number) => void;
    },
  ) => ReactNode;
}

/**
 * DynamicForm.Array - Wrapper around Antd Form.List for array fields
 *
 * @example
 * ```tsx
 * <DynamicForm.Array name="users">
 *   {(fields, { add, remove }) => (
 *     <>
 *       {fields.map((field) => (
 *         <div key={field.key}>
 *           <DynamicForm.Field
 *             config={{ type: 'input', name: [field.name, 'name'], label: 'Name' }}
 *           />
 *           <Button onClick={() => remove(field.name)}>Remove</Button>
 *         </div>
 *       ))}
 *       <Button onClick={() => add()}>Add User</Button>
 *     </>
 *   )}
 * </DynamicForm.Array>
 * ```
 */
function DynamicFormArray({ name, children }: FormArrayProps) {
  return <Form.List name={name}>{children}</Form.List>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access the form instance from within DynamicForm
 */
export function useDynamicForm() {
  return useDynamicFormContext().form;
}

// =============================================================================
// COMPOUND COMPONENT EXPORT
// =============================================================================

export const DynamicForm = Object.assign(DynamicFormRoot, {
  Field: DynamicFormField,
  List: DynamicFormFieldList,
  Array: DynamicFormArray,
  useForm: Form.useForm,
});
