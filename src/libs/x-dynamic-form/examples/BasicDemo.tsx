/**
 * X-Dynamic-Form Basic Demo
 *
 * Shows the basic usage patterns of the new architecture.
 */

import { useState } from 'react';
import { Form, Button, Card, Space, Typography, Divider, Row, Col, Input, Tag, message } from 'antd';
import { DynamicForm, createAntdRegistry } from '../antd';
import type { FieldComponentProps, FieldConfig } from '../core';
import type { AntdFieldConfig } from '../antd';

const { Title, Paragraph, Text } = Typography;

// =============================================================================
// EXAMPLE 1: Basic Form
// =============================================================================

const basicSchema: AntdFieldConfig[] = [
  {
    type: 'input',
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter first name',
    required: true,
  },
  {
    type: 'input',
    name: 'lastName',
    label: 'Last Name',
    placeholder: 'Enter last name',
    required: true,
  },
  {
    type: 'input',
    name: 'email',
    label: 'Email',
    placeholder: 'Enter email',
    inputType: 'email',
  },
  {
    type: 'select',
    name: 'country',
    label: 'Country',
    placeholder: 'Select country',
    options: [
      { label: 'Vietnam', value: 'vn' },
      { label: 'United States', value: 'us' },
      { label: 'Japan', value: 'jp' },
    ],
    showSearch: true,
    allowClear: true,
  },
];

function BasicFormExample() {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const formValues = await form.validateFields();
      message.success(`Form submitted! ${JSON.stringify(formValues, null, 2)}`);
    } catch {
      message.error('Please fix the errors');
    }
  };

  return (
    <Card title="Example 1: Basic Form">
      <Paragraph type="secondary">
        Form state is managed by Antd Form. DynamicForm is just a thin wrapper that provides the
        context for field resolution.
      </Paragraph>

      <DynamicForm form={form} layout="vertical" useFormItemWrapper>
        <Row gutter={16}>
          {basicSchema.map((config) => (
            <Col key={config.name} span={12}>
              <DynamicForm.Field config={config} />
            </Col>
          ))}
        </Row>

        <Divider />

        <Space>
          <Button type="primary" onClick={handleSubmit}>
            Submit
          </Button>
          <Button onClick={() => form.resetFields()}>Reset</Button>
          <Button onClick={() => form.setFieldsValue({ firstName: 'John', lastName: 'Doe' })}>
            Set Values
          </Button>
        </Space>
      </DynamicForm>
    </Card>
  );
}

// =============================================================================
// EXAMPLE 2: Custom Component Registration
// =============================================================================

// Custom Tag Input component
interface TagInputConfig extends FieldConfig<'tag-input'> {
  type: 'tag-input';
  tagColor?: string;
}

function TagInputField({ config, value, onChange, disabled, error }: FieldComponentProps<TagInputConfig, string[]>) {
  const [inputValue, setInputValue] = useState('');
  const tags = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    if (inputValue && !tags.includes(inputValue)) {
      onChange?.([...tags, inputValue]);
      setInputValue('');
    }
  };

  const handleRemove = (tag: string) => {
    onChange?.(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 8 }}>
        {tags.map((tag) => (
          <Tag key={tag} closable color={config.tagColor ?? 'blue'} onClose={() => handleRemove(tag)}>
            {tag}
          </Tag>
        ))}
      </Space>
      <Input.Search
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onSearch={handleAdd}
        disabled={disabled}
        placeholder={config.placeholder ?? 'Add tag...'}
        enterButton="Add"
        status={error ? 'error' : undefined}
      />
    </div>
  );
}

// Create custom registry
const customRegistry = createAntdRegistry({
  'tag-input': TagInputField,
});

function CustomComponentExample() {
  const [form] = Form.useForm();
  const [values, setValues] = useState<Record<string, unknown>>({});

  const schema: FieldConfig[] = [
    {
      type: 'input',
      name: 'title',
      label: 'Title',
      placeholder: 'Enter title',
    },
    {
      type: 'tag-input',
      name: 'tags',
      label: 'Tags',
      placeholder: 'Add a tag...',
      tagColor: 'green',
    } as TagInputConfig,
  ];

  return (
    <Card title="Example 2: Custom Component Registration">
      <Paragraph type="secondary">
        Register custom field components by creating a custom registry. The component receives
        standard props: config, value, onChange, disabled, error.
      </Paragraph>

      <DynamicForm form={form} registry={customRegistry} layout="vertical" onValuesChange={(_, all) => setValues(all)}>
        {schema.map((config) => (
          <DynamicForm.Field key={config.name} config={config} />
        ))}
      </DynamicForm>

      <Divider />
      <Text strong>Current Values:</Text>
      <pre style={{ background: '#f5f5f5', padding: 12, marginTop: 8 }}>
        {JSON.stringify(values, null, 2)}
      </pre>
    </Card>
  );
}

// =============================================================================
// EXAMPLE 3: Form Arrays
// =============================================================================

function FormArrayExample() {
  const [form] = Form.useForm();
  const [values, setValues] = useState<Record<string, unknown>>({});

  return (
    <Card title="Example 3: Form Arrays (Dynamic Fields)">
      <Paragraph type="secondary">
        Use DynamicForm.Array for dynamic field lists. This wraps Antd's Form.List.
      </Paragraph>

      <DynamicForm form={form} layout="vertical" onValuesChange={(_, all) => setValues(all)}>
        <DynamicForm.Array name="users">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  title={`User ${index + 1}`}
                  extra={
                    <Button danger size="small" onClick={() => remove(field.name)}>
                      Remove
                    </Button>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Name" name={[field.name, 'name']} rules={[{ required: true }]}>
                        <Input placeholder="Enter name" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Email" name={[field.name, 'email']}>
                        <Input placeholder="Enter email" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button type="dashed" onClick={() => add()} block>
                + Add User
              </Button>
            </>
          )}
        </DynamicForm.Array>
      </DynamicForm>

      <Divider />
      <Text strong>Current Values:</Text>
      <pre style={{ background: '#f5f5f5', padding: 12, marginTop: 8 }}>
        {JSON.stringify(values, null, 2)}
      </pre>
    </Card>
  );
}

// =============================================================================
// EXAMPLE 4: All Field Types
// =============================================================================

function AllFieldTypesExample() {
  const [form] = Form.useForm();
  const [values, setValues] = useState<Record<string, unknown>>({});

  const schema: AntdFieldConfig[] = [
    { type: 'input', name: 'input', label: 'Input', placeholder: 'Text input' },
    { type: 'textarea', name: 'textarea', label: 'Textarea', rows: 3 },
    { type: 'number', name: 'number', label: 'Number', min: 0, max: 100 },
    {
      type: 'select',
      name: 'select',
      label: 'Select',
      options: [
        { label: 'Option 1', value: 1 },
        { label: 'Option 2', value: 2 },
      ],
    },
    { type: 'checkbox', name: 'checkbox', label: 'Checkbox', checkboxLabel: 'I agree to terms' },
    {
      type: 'radio',
      name: 'radio',
      label: 'Radio',
      options: [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ],
    },
    { type: 'switch', name: 'switch', label: 'Switch' },
    { type: 'date', name: 'date', label: 'Date Picker' },
    { type: 'slider', name: 'slider', label: 'Slider', min: 0, max: 100 },
    { type: 'rate', name: 'rate', label: 'Rate' },
  ];

  return (
    <Card title="Example 4: All Field Types">
      <Paragraph type="secondary">All built-in field types available in the antd adapter.</Paragraph>

      <DynamicForm form={form} layout="vertical" onValuesChange={(_, all) => setValues(all)}>
        <Row gutter={[16, 0]}>
          {schema.map((config) => (
            <Col key={config.name} span={12}>
              <DynamicForm.Field config={config} />
            </Col>
          ))}
        </Row>
      </DynamicForm>

      <Divider />
      <Text strong>Current Values:</Text>
      <pre style={{ background: '#f5f5f5', padding: 12, marginTop: 8, fontSize: 12 }}>
        {JSON.stringify(values, null, 2)}
      </pre>
    </Card>
  );
}

// =============================================================================
// MAIN DEMO
// =============================================================================

export function BasicDemo() {
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Title level={2}>X-Dynamic-Form - New Architecture</Title>

      <Paragraph>
        A flexible, framework-agnostic dynamic form library with compound component pattern.
      </Paragraph>

      <ul>
        <li>
          <Text strong>No Internal Store:</Text> Uses external form state (Antd Form.useForm)
        </li>
        <li>
          <Text strong>Compound Components:</Text> Explicit API with DynamicForm.Field, DynamicForm.Array
        </li>
        <li>
          <Text strong>Registry Pattern:</Text> Easy to add custom field components
        </li>
        <li>
          <Text strong>Framework Agnostic Core:</Text> Core can be used with any UI library
        </li>
      </ul>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <BasicFormExample />
        <CustomComponentExample />
        <FormArrayExample />
        <AllFieldTypesExample />
      </Space>
    </div>
  );
}

export default BasicDemo;
