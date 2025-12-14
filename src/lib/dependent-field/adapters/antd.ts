/**
 * Ant Design Form Adapter
 *
 * Integrates DependentField with Ant Design Form.
 */

import type { FormInstance } from 'antd';

import type { FieldValues, FormAdapter } from '../types';

/**
 * Create an adapter for Ant Design Form
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const [form] = Form.useForm();
 *   const adapter = useAntdAdapter(form);
 *
 *   return (
 *     <DependentFieldProvider configs={configs} adapter={adapter}>
 *       <Form form={form}>
 *         ...
 *       </Form>
 *     </DependentFieldProvider>
 *   );
 * }
 * ```
 */
export function createAntdAdapter(form: FormInstance): FormAdapter {
  return {
    setFieldValue: (name, value) => {
      form.setFieldValue(name, value);
    },
    setFieldsValue: (values: FieldValues) => {
      form.setFieldsValue(values);
    },
    getFieldValue: (name) => {
      return form.getFieldValue(name);
    },
    getFieldsValue: () => {
      return form.getFieldsValue();
    },
  };
}

/**
 * Hook to create Ant Design Form adapter
 */
export function useAntdAdapter(form: FormInstance): FormAdapter {
  return createAntdAdapter(form);
}
