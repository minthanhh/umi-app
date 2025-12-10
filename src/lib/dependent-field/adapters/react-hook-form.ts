/**
 * React Hook Form Adapter
 *
 * Integrates DependentField with React Hook Form.
 */

import type {
  FieldValues as RHFFieldValues,
  UseFormReturn,
} from 'react-hook-form';

import type { FieldValue, FormAdapter } from '../types';

/**
 * Create an adapter for React Hook Form
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const form = useForm();
 *   const adapter = createRHFAdapter(form);
 *
 *   return (
 *     <DependentFieldProvider configs={configs} adapter={adapter}>
 *       <FormProvider {...form}>
 *         <form onSubmit={form.handleSubmit(onSubmit)}>
 *           ...
 *         </form>
 *       </FormProvider>
 *     </DependentFieldProvider>
 *   );
 * }
 * ```
 */
export function createRHFAdapter<T extends RHFFieldValues>(
  form: UseFormReturn<T>,
): FormAdapter {
  return {
    setFieldValue: (name, value) => {
      // @ts-expect-error - dynamic field name
      form.setValue(name, value);
    },
    getFieldValue: (name) => {
      // @ts-expect-error - dynamic field name
      return form.getValues(name) as FieldValue | FieldValue[] | undefined;
    },
    getFieldsValue: () => {
      return form.getValues() as Record<string, FieldValue | FieldValue[]>;
    },
  };
}

/**
 * Hook to create React Hook Form adapter
 */
export function useRHFAdapter<T extends RHFFieldValues>(
  form: UseFormReturn<T>,
): FormAdapter {
  return createRHFAdapter(form);
}