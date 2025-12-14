/**
 * Formik Adapter
 *
 * Integrates SmartSelect with Formik
 */

import { useMemo } from 'react';

import type { FormAdapter, SelectValue } from '../types';

/**
 * Formik helpers interface
 */
interface FormikHelpers {
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  values: Record<string, any>;
}

/**
 * Create an adapter for Formik
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   return (
 *     <Formik initialValues={{ country: '', city: '' }} onSubmit={...}>
 *       {({ setFieldValue, values }) => {
 *         const adapter = createFormikAdapter({ setFieldValue, values });
 *
 *         return (
 *           <Form>
 *             <SmartSelectProvider adapter={adapter}>
 *               <Select.Dependent name="country">
 *                 {(props) => (
 *                   <Field name="country">
 *                     {({ field }) => <AntdSelect {...field} {...props} />}
 *                   </Field>
 *                 )}
 *               </Select.Dependent>
 *             </SmartSelectProvider>
 *           </Form>
 *         );
 *       }}
 *     </Formik>
 *   );
 * }
 * ```
 */
export function createFormikAdapter(helpers: FormikHelpers): FormAdapter {
  return {
    setFieldValue: (name: string, value: SelectValue) => {
      helpers.setFieldValue(name, value, true);
    },
    setFieldsValue: (values: Record<string, SelectValue>) => {
      Object.entries(values).forEach(([name, value]) => {
        helpers.setFieldValue(name, value, true);
      });
    },
    getFieldValue: (name: string) => {
      return helpers.values[name];
    },
    getFieldsValue: () => {
      return helpers.values;
    },
  };
}

/**
 * Hook version - note: Formik values change on every render,
 * so this should be used carefully
 */
export function useFormikAdapter(helpers: FormikHelpers): FormAdapter {
  // Only depend on setFieldValue since values is a new object each render
  return useMemo(
    () => ({
      setFieldValue: (name: string, value: SelectValue) => {
        helpers.setFieldValue(name, value, true);
      },
      setFieldsValue: (values: Record<string, SelectValue>) => {
        Object.entries(values).forEach(([name, value]) => {
          helpers.setFieldValue(name, value, true);
        });
      },
      getFieldValue: (name: string) => {
        return helpers.values[name];
      },
      getFieldsValue: () => {
        return helpers.values;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [helpers.setFieldValue],
  );
}

/**
 * Create adapter with nested path support
 *
 * @example
 * ```tsx
 * const adapter = createFormikAdapterWithPath(formikHelpers, 'user.address');
 * ```
 */
export function createFormikAdapterWithPath(
  helpers: FormikHelpers,
  basePath: string,
): FormAdapter {
  const getFullPath = (name: string) => `${basePath}.${name}`;

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  };

  return {
    setFieldValue: (name: string, value: SelectValue) => {
      helpers.setFieldValue(getFullPath(name), value, true);
    },
    setFieldsValue: (values: Record<string, SelectValue>) => {
      Object.entries(values).forEach(([name, value]) => {
        helpers.setFieldValue(getFullPath(name), value, true);
      });
    },
    getFieldValue: (name: string) => {
      return getNestedValue(helpers.values, getFullPath(name));
    },
    getFieldsValue: () => {
      return getNestedValue(helpers.values, basePath) ?? {};
    },
  };
}

export function useFormikAdapterWithPath(
  helpers: FormikHelpers,
  basePath: string,
): FormAdapter {
  return useMemo(
    () => createFormikAdapterWithPath(helpers, basePath),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [helpers.setFieldValue, basePath],
  );
}
