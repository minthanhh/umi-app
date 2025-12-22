/**
 * Antd Form Item Wrapper
 *
 * Wraps field components with Ant Design's Form.Item for:
 * - Label display
 * - Error messages
 * - Required indicator
 * - Help text
 * - Automatic value/onChange binding via name prop
 */

import { Form } from 'antd';
import type { FormItemWrapperProps } from '../core';

/**
 * AntdFormItemWrapper - Wraps fields with Ant Design Form.Item
 *
 * This provides the standard Antd form styling including:
 * - Label with required asterisk
 * - Error message display
 * - Help text
 * - Value/onChange binding through Form.Item's name prop
 *
 * IMPORTANT: This wrapper uses Form.Item with `name` prop, which means
 * Ant Design Form will automatically inject `value` and `onChange` props
 * to the children. Field components should handle both controlled (from Form.Item)
 * and uncontrolled scenarios.
 *
 * @example
 * ```tsx
 * <FormProvider registry={registry} FormItemWrapper={AntdFormItemWrapper}>
 *   <Field config={{ type: 'input', name: 'email', label: 'Email', required: true }} />
 * </FormProvider>
 * ```
 */
export function AntdFormItemWrapper({ config, children }: FormItemWrapperProps) {
  // Build validation rules from config
  const rules = [];
  if (config.required) {
    rules.push({ required: true, message: `${config.label || config.name} is required` });
  }

  return (
    <Form.Item
      name={config.name}
      label={config.label}
      rules={rules}
      help={config.help}
      className={config.className}
      style={config.style}
    >
      {children}
    </Form.Item>
  );
}
