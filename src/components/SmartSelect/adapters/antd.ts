/**
 * Ant Design Form Adapter
 *
 * Integrates SmartSelect with Ant Design Form
 */

import type { FormInstance } from 'antd';
import { useMemo } from 'react';

import type { FormAdapter, SelectValue } from '../types';

/**
 * Create an adapter for Ant Design Form
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const [form] = Form.useForm();
 *   const adapter = useAntdFormAdapter(form);
 *
 *   return (
 *     <Form form={form}>
 *       <SmartSelectProvider adapter={adapter}>
 *         <Form.Item name="country">
 *           <Select.Dependent name="country">
 *             {(props) => <AntdSelect {...} />}
 *           </Select.Dependent>
 *         </Form.Item>
 *       </SmartSelectProvider>
 *     </Form>
 *   );
 * }
 * ```
 */
export function createAntdFormAdapter(form: FormInstance): FormAdapter {
  return {
    setFieldValue: (name: string, value: SelectValue) => {
      form.setFieldValue(name, value);
    },
    setFieldsValue: (values: Record<string, SelectValue>) => {
      form.setFieldsValue(values);
    },
    getFieldValue: (name: string) => {
      return form.getFieldValue(name);
    },
    getFieldsValue: () => {
      return form.getFieldsValue();
    },
  };
}

/**
 * Hook version of the adapter
 */
export function useAntdFormAdapter(form: FormInstance): FormAdapter {
  return useMemo(() => createAntdFormAdapter(form), [form]);
}

/**
 * Create adapter with namePath support (for nested fields)
 *
 * @example
 * ```tsx
 * const adapter = createAntdFormAdapterWithNamePath(form, ['user', 'address']);
 * // This will set form.setFieldValue(['user', 'address', 'country'], value)
 * ```
 */
export function createAntdFormAdapterWithNamePath(
  form: FormInstance,
  basePath: (string | number)[],
): FormAdapter {
  const getFullPath = (name: string) => [...basePath, name];

  return {
    setFieldValue: (name: string, value: SelectValue) => {
      form.setFieldValue(getFullPath(name), value);
    },
    setFieldsValue: (values: Record<string, SelectValue>) => {
      // Build nested object
      let nested: any = values;
      for (let i = basePath.length - 1; i >= 0; i--) {
        nested = { [basePath[i]]: nested };
      }
      form.setFieldsValue(nested);
    },
    getFieldValue: (name: string) => {
      return form.getFieldValue(getFullPath(name));
    },
    getFieldsValue: () => {
      const allValues = form.getFieldsValue();
      let result = allValues;
      for (const key of basePath) {
        result = result?.[key];
      }
      return result ?? {};
    },
  };
}

export function useAntdFormAdapterWithNamePath(
  form: FormInstance,
  basePath: (string | number)[],
): FormAdapter {
  return useMemo(
    () => createAntdFormAdapterWithNamePath(form, basePath),
    [form, basePath],
  );
}
