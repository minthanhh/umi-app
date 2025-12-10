/**
 * DependentField Demo Page
 *
 * Demonstrates the usage of DependentField library with Ant Design.
 * IMPORTANT: Form library (Antd) is the SOURCE OF TRUTH for values.
 * The store only manages dependency logic.
 */

import { Button, Card, Form, Space, Typography } from 'antd';
import { useMemo } from 'react';

import {
  createAntdAdapter,
  DependentFieldConfig,
  DependentFieldProvider,
} from '@/lib/dependent-field';

import { CitySelect, CountrySelect, ProvinceSelect } from './components';

const { Title, Text, Paragraph } = Typography;

// Field configurations with dependency reset logic
const configs: DependentFieldConfig[] = [
  {
    name: 'country',
  },
  {
    name: 'province',
    dependsOn: 'country',
    onDependencyChange: ({ setValue, hasChanged }) => {
      // Reset province when country changes
      if (hasChanged('country')) {
        setValue(undefined);
      }
    },
  },
  {
    name: 'city',
    dependsOn: 'province',
    onDependencyChange: ({ setValue, hasChanged }) => {
      // Reset city when province changes
      if (hasChanged('province')) {
        setValue(undefined);
      }
    },
  },
];

// Main demo with Antd Form as source of truth
function AntdFormDemo() {
  const [form] = Form.useForm();

  // Create adapter - this connects store to form
  const adapter = useMemo(() => createAntdAdapter(form), [form]);

  const handleSubmit = (values: Record<string, unknown>) => {
    console.log('Form submitted (from Antd Form):', values);
  };

  const handleValuesChange = (
    changedValues: Record<string, unknown>,
    allValues: Record<string, unknown>,
  ) => {
    console.log('Form values changed:', { changedValues, allValues });
  };

  return (
    <Card title="Ant Design Form (Source of Truth)">
      <DependentFieldProvider configs={configs} adapter={adapter}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
        >
          <Form.Item label="Country" name="country">
            <CountrySelect />
          </Form.Item>

          <Form.Item label="Province/State" name="province">
            <ProvinceSelect />
          </Form.Item>

          <Form.Item label="City/District" name="city">
            <CitySelect />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
              <Button
                onClick={() => {
                  console.log('Current form values:', form.getFieldsValue());
                }}
              >
                Log Values
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Debug: Show current form values */}
        <Card size="small" title="Form Values (from Antd Form)">
          <Form.Item noStyle shouldUpdate>
            {() => (
              <pre style={{ margin: 0, fontSize: 12 }}>
                {JSON.stringify(form.getFieldsValue(), null, 2)}
              </pre>
            )}
          </Form.Item>
        </Card>
      </DependentFieldProvider>
    </Card>
  );
}

// Main page component
export default function DependentFieldDemoPage() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>DependentField Demo</Title>

      <Paragraph>
        <Text>
          This demo shows how to use <Text code>useDependentField</Text> hook
          with <Text strong>Ant Design Form as the source of truth</Text>.
        </Text>
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <AntdFormDemo />

        {/* Usage Guide */}
        <Card title="Architecture">
          <Paragraph>
            <Title level={5}>Form is Source of Truth</Title>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`┌─────────────────────────────────────────────────────┐
│                    Antd Form                        │
│              (SOURCE OF TRUTH)                      │
│  form.getFieldValue() / form.setFieldValue()       │
└─────────────────────────────────────────────────────┘
                    ▲           │
                    │           │ adapter.setFieldValue()
                    │           ▼
┌─────────────────────────────────────────────────────┐
│              DependentFieldStore                    │
│  - Tracks dependencies                              │
│  - Triggers onDependencyChange callbacks           │
│  - Notifies subscribers                            │
└─────────────────────────────────────────────────────┘
                    ▲           │
      useDependentField         │ setValue()
                    │           ▼
┌─────────────────────────────────────────────────────┐
│              Select Components                      │
│  - CountrySelect                                   │
│  - ProvinceSelect                                  │
│  - CitySelect                                      │
└─────────────────────────────────────────────────────┘`}
            </pre>
          </Paragraph>

          <Paragraph>
            <Title level={5}>Usage</Title>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`// 1. Create adapter
const adapter = createAntdAdapter(form);

// 2. Wrap with provider
<DependentFieldProvider configs={configs} adapter={adapter}>
  <Form form={form}>
    <Form.Item name="country">
      <CountrySelect />
    </Form.Item>
  </Form>
</DependentFieldProvider>

// 3. In component, use hook to sync with store
function CountrySelect() {
  const { value, onSyncStore, isDependencySatisfied } =
    useDependentField('country');

  return (
    <Select
      value={value}
      onChange={onSyncStore}  // This updates both store and form
      disabled={!isDependencySatisfied}
    />
  );
}`}
            </pre>
          </Paragraph>
        </Card>
      </Space>
    </div>
  );
}
