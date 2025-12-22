/**
 * X-Dynamic-Form Antd Adapter
 *
 * Provides Ant Design integration for x-dynamic-form.
 *
 * @example
 * ```tsx
 * import { DynamicForm, antdRegistry } from 'x-dynamic-form/antd';
 * import { Form, Button } from 'antd';
 *
 * function MyForm() {
 *   const [form] = Form.useForm();
 *
 *   const handleSubmit = async () => {
 *     const values = await form.validateFields();
 *     console.log(values);
 *   };
 *
 *   return (
 *     <DynamicForm form={form} layout="vertical" onFinish={handleSubmit}>
 *       <DynamicForm.Field config={{ type: 'input', name: 'email', label: 'Email' }} />
 *       <DynamicForm.Field config={{ type: 'select', name: 'role', label: 'Role', options: [...] }} />
 *       <Button type="primary" htmlType="submit">Submit</Button>
 *     </DynamicForm>
 *   );
 * }
 * ```
 */

// Main compound component
export { DynamicForm, useDynamicForm } from './DynamicForm';
export type { DynamicFormProps, FormArrayProps } from './DynamicForm';

// Form item wrapper
export { AntdFormItemWrapper } from './FormItemWrapper';

// Registry
export { antdRegistry, createAntdRegistry } from './registry';

// Field components (for direct use or custom registries)
export {
  InputField,
  TextareaField,
  NumberField,
  SelectField,
  CheckboxField,
  CheckboxGroupField,
  RadioField,
  SwitchField,
  DateField,
  DateRangeField,
  SliderField,
  RateField,
  XSelectField,
} from './fields';

// Types
export type {
  AntdFieldType,
  AntdFieldConfig,
  InputFieldConfig,
  TextareaFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  CheckboxFieldConfig,
  CheckboxGroupFieldConfig,
  RadioFieldConfig,
  SwitchFieldConfig,
  DateFieldConfig,
  DateRangeFieldConfig,
  SliderFieldConfig,
  RateFieldConfig,
} from './types';
