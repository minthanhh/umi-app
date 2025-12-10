/**
 * Formik Adapter
 *
 * Integrates DependentField with Formik.
 */

import type { FormikContextType } from 'formik';

import type { FieldValue, FormAdapter } from '../types';

/**
 * Create an adapter for Formik
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const formik = useFormik({ ... });
 *   const adapter = createFormikAdapter(formik);
 *
 *   return (
 *     <DependentFieldProvider configs={configs} adapter={adapter}>
 *       <FormikProvider value={formik}>
 *         ...
 *       </FormikProvider>
 *     </DependentFieldProvider>
 *   );
 * }
 * ```
 *
 * Or using FormikContext:
 * ```tsx
 * function FormContent() {
 *   const formik = useFormikContext();
 *   const adapter = createFormikAdapter(formik);
 *   ...
 * }
 * ```
 */
export function createFormikAdapter<T extends Record<string, unknown>>(
  formik: FormikContextType<T>,
): FormAdapter {
  return {
    setFieldValue: (name, value) => {
      formik.setFieldValue(name, value);
    },
    getFieldValue: (name) => {
      return formik.values[name] as FieldValue | FieldValue[] | undefined;
    },
    getFieldsValue: () => {
      return formik.values as Record<string, FieldValue | FieldValue[]>;
    },
  };
}

/**
 * Hook to create Formik adapter from context
 * Must be used inside Formik context
 */
export function useFormikAdapter<T extends Record<string, unknown>>(
  formik: FormikContextType<T>,
): FormAdapter {
  return createFormikAdapter(formik);
}