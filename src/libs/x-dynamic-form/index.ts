/**
 * X-Dynamic-Form
 *
 * A flexible, framework-agnostic dynamic form library.
 *
 * Architecture:
 * - `x-dynamic-form/core` - Framework-agnostic core (types, context, Field component)
 * - `x-dynamic-form/antd` - Ant Design adapter with field components
 * - `x-dynamic-form/mui` - Material UI adapter (coming soon)
 *
 * Key principles:
 * 1. No internal state management - uses external form state (Antd Form, React Hook Form, etc.)
 * 2. Compound component pattern - explicit, no magic
 * 3. Registry-based field resolution - easily extensible
 * 4. Framework adapters - same API across different UI libraries
 *
 * @example
 * ```tsx
 * // With Ant Design
 * import { DynamicForm } from 'x-dynamic-form/antd';
 * import { Form, Button } from 'antd';
 *
 * function MyForm() {
 *   const [form] = Form.useForm();
 *
 *   return (
 *     <DynamicForm form={form} layout="vertical">
 *       <DynamicForm.Field config={{ type: 'input', name: 'email', label: 'Email' }} />
 *       <DynamicForm.Field config={{ type: 'input', name: 'password', inputType: 'password', label: 'Password' }} />
 *       <Button type="primary" htmlType="submit">Submit</Button>
 *     </DynamicForm>
 *   );
 * }
 * ```
 */

// Re-export core
export * from './core';

// Note: Framework-specific adapters should be imported directly:
// import { DynamicForm } from 'x-dynamic-form/antd';
// import { DynamicForm } from 'x-dynamic-form/mui';
