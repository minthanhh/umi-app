/**
 * XSelect Integration Demo
 *
 * Demonstrates how x-select integrates with x-dynamic-form.
 * Shows cascading selects with infinite scroll within a dynamic form.
 */

import React, { useCallback, useState } from 'react';
import { Form, Button, Card, Divider, Space, Typography } from 'antd';

import { FormProvider, FieldList, Field } from '../core';
import { antdRegistry, AntdFormItemWrapper } from '../antd';
import { XSelectProvider, type FieldConfig as XSelectFieldConfig } from '../../x-select';
import type { XSelectFieldConfig as DynamicFormXSelectConfig } from '../antd/types';
import type { FieldConfig } from '../core';

const { Title, Text, Paragraph } = Typography;

// =============================================================================
// MOCK DATA & API
// =============================================================================

interface Country {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface Province {
  id: number;
  name: string;
  countryId: number;
  [key: string]: unknown;
}

interface City {
  id: number;
  name: string;
  provinceId: number;
  [key: string]: unknown;
}

// Mock data
const mockCountries: Country[] = [
  { id: 1, name: 'Vietnam' },
  { id: 2, name: 'Thailand' },
  { id: 3, name: 'Japan' },
  { id: 4, name: 'South Korea' },
  { id: 5, name: 'Singapore' },
];

const mockProvinces: Province[] = [
  // Vietnam
  { id: 1, name: 'Ho Chi Minh City', countryId: 1 },
  { id: 2, name: 'Hanoi', countryId: 1 },
  { id: 3, name: 'Da Nang', countryId: 1 },
  // Thailand
  { id: 4, name: 'Bangkok', countryId: 2 },
  { id: 5, name: 'Chiang Mai', countryId: 2 },
  // Japan
  { id: 6, name: 'Tokyo', countryId: 3 },
  { id: 7, name: 'Osaka', countryId: 3 },
  { id: 8, name: 'Kyoto', countryId: 3 },
  // South Korea
  { id: 9, name: 'Seoul', countryId: 4 },
  { id: 10, name: 'Busan', countryId: 4 },
  // Singapore
  { id: 11, name: 'Central Region', countryId: 5 },
];

const mockCities: City[] = [
  // Ho Chi Minh City
  { id: 1, name: 'District 1', provinceId: 1 },
  { id: 2, name: 'District 2', provinceId: 1 },
  { id: 3, name: 'District 7', provinceId: 1 },
  // Hanoi
  { id: 4, name: 'Hoan Kiem', provinceId: 2 },
  { id: 5, name: 'Ba Dinh', provinceId: 2 },
  // Da Nang
  { id: 6, name: 'Hai Chau', provinceId: 3 },
  // Bangkok
  { id: 7, name: 'Sukhumvit', provinceId: 4 },
  { id: 8, name: 'Silom', provinceId: 4 },
  // Tokyo
  { id: 9, name: 'Shibuya', provinceId: 6 },
  { id: 10, name: 'Shinjuku', provinceId: 6 },
  { id: 11, name: 'Minato', provinceId: 6 },
  // Seoul
  { id: 12, name: 'Gangnam', provinceId: 9 },
  { id: 13, name: 'Hongdae', provinceId: 9 },
];

// Mock fetch functions with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchCountries = async (request: { current: number; pageSize: number; search?: string }) => {
  await delay(300);
  let data = [...mockCountries];
  if (request.search) {
    data = data.filter((c) => c.name.toLowerCase().includes(request.search!.toLowerCase()));
  }
  const start = (request.current - 1) * request.pageSize;
  const end = start + request.pageSize;
  return {
    data: data.slice(start, end),
    total: data.length,
    hasMore: end < data.length,
  };
};

const fetchProvinces = async (request: {
  current: number;
  pageSize: number;
  search?: string;
  parentValue?: unknown;
}) => {
  await delay(300);
  let data = [...mockProvinces];
  if (request.parentValue) {
    data = data.filter((p) => p.countryId === request.parentValue);
  }
  if (request.search) {
    data = data.filter((p) => p.name.toLowerCase().includes(request.search!.toLowerCase()));
  }
  const start = (request.current - 1) * request.pageSize;
  const end = start + request.pageSize;
  return {
    data: data.slice(start, end),
    total: data.length,
    hasMore: end < data.length,
  };
};

const fetchCities = async (request: {
  current: number;
  pageSize: number;
  search?: string;
  parentValue?: unknown;
}) => {
  await delay(300);
  let data = [...mockCities];
  if (request.parentValue) {
    data = data.filter((c) => c.provinceId === request.parentValue);
  }
  if (request.search) {
    data = data.filter((c) => c.name.toLowerCase().includes(request.search!.toLowerCase()));
  }
  const start = (request.current - 1) * request.pageSize;
  const end = start + request.pageSize;
  return {
    data: data.slice(start, end),
    total: data.length,
    hasMore: end < data.length,
  };
};

// =============================================================================
// STATIC OPTIONS EXAMPLE
// =============================================================================

const statusOptions = [
  { label: 'Active', value: 'active', color: 'green', description: 'Currently active' },
  { label: 'Inactive', value: 'inactive', color: 'red', description: 'Not active' },
  { label: 'Pending', value: 'pending', color: 'orange', description: 'Awaiting approval' },
  { label: 'Archived', value: 'archived', color: 'gray', description: 'No longer in use' },
];

const priorityOptions = [
  { label: 'High', value: 'high', color: '#ff4d4f' },
  { label: 'Medium', value: 'medium', color: '#faad14' },
  { label: 'Low', value: 'low', color: '#52c41a' },
];

// =============================================================================
// DEMO 1: BASIC X-SELECT IN DYNAMIC FORM
// =============================================================================

function BasicXSelectDemo() {
  const [form] = Form.useForm();
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);

  const formConfigs: FieldConfig<string>[] = [
    {
      type: 'input',
      name: 'name',
      label: 'Project Name',
      required: true,
      placeholder: 'Enter project name',
    },
    {
      type: 'x-select',
      name: 'status',
      label: 'Status',
      required: true,
      placeholder: 'Select status',
      staticOptions: statusOptions,
    } as DynamicFormXSelectConfig,
    {
      type: 'x-select',
      name: 'priority',
      label: 'Priority',
      placeholder: 'Select priority',
      staticOptions: priorityOptions,
    } as DynamicFormXSelectConfig,
    {
      type: 'textarea',
      name: 'description',
      label: 'Description',
      placeholder: 'Enter description',
    },
  ];

  const handleSubmit = (values: Record<string, unknown>) => {
    setSubmittedValues(values);
    console.log('Form values:', values);
  };

  return (
    <Card title="Demo 1: Basic X-Select with Static Options">
      <Paragraph type="secondary">
        Static options with metadata (color, description) - perfect for status fields, enums, etc.
      </Paragraph>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <FormProvider registry={antdRegistry} FormItemWrapper={AntdFormItemWrapper}>
          <FieldList configs={formConfigs} />
        </FormProvider>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>

      {submittedValues && (
        <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
          <Text strong>Submitted Values:</Text>
          <pre style={{ margin: 0 }}>{JSON.stringify(submittedValues, null, 2)}</pre>
        </Card>
      )}
    </Card>
  );
}

// =============================================================================
// DEMO 2: CASCADING X-SELECT WITH INFINITE SCROLL
// =============================================================================

function CascadingXSelectDemo() {
  const [form] = Form.useForm();
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);

  // Form adapter for XSelectProvider - syncs XSelect state with Antd Form
  const formAdapter = useCallback(
    () => ({
      onFieldChange: (name: string, value: unknown) => {
        form.setFieldValue(name, value);
      },
      onFieldsChange: (fields: Array<{ name: string; value: unknown }>) => {
        const values: Record<string, unknown> = {};
        fields.forEach(({ name, value }) => {
          values[name] = value;
        });
        form.setFieldsValue(values);
      },
    }),
    [form],
  )();

  // XSelect configs - defines the dependency tree for cascading behavior
  // These configs are used by XSelectProvider to:
  // 1. Track parent-child relationships (dependsOn)
  // 2. Provide parentValue to child fields
  // 3. Auto-clear children when parent changes
  const xSelectConfigs: XSelectFieldConfig[] = [
    {
      name: 'country',
      placeholder: 'Select country',
    },
    {
      name: 'province',
      dependsOn: 'country',
      placeholder: 'Select province',
    },
    {
      name: 'city',
      dependsOn: 'province',
      placeholder: 'Select city',
    },
  ];

  // Dynamic form configs - includes UI configuration and data fetching
  // The x-select fields here will be wrapped by XSelect.Dependent which
  // reads parentValue from XSelectProvider's store
  const formConfigs: FieldConfig<string>[] = [
    {
      type: 'input',
      name: 'companyName',
      label: 'Company Name',
      required: true,
      placeholder: 'Enter company name',
    },
    {
      type: 'x-select',
      name: 'country',
      label: 'Country',
      required: true,
      placeholder: 'Select country',
      queryKey: 'countries',
      listQuery: {
        fetchFn: fetchCountries,
      },
      showSearch: true,
    } as DynamicFormXSelectConfig,
    {
      type: 'x-select',
      name: 'province',
      label: 'Province/State',
      placeholder: 'Select province',
      dependsOn: 'country',
      queryKey: 'provinces',
      listQuery: {
        fetchFn: fetchProvinces,
      },
      showSearch: true,
    } as DynamicFormXSelectConfig,
    {
      type: 'x-select',
      name: 'city',
      label: 'City/District',
      placeholder: 'Select city',
      dependsOn: 'province',
      queryKey: 'cities',
      listQuery: {
        fetchFn: fetchCities,
      },
      showSearch: true,
    } as DynamicFormXSelectConfig,
    {
      type: 'input',
      name: 'address',
      label: 'Street Address',
      placeholder: 'Enter street address',
    },
  ];

  const handleSubmit = (values: Record<string, unknown>) => {
    setSubmittedValues(values);
    console.log('Form values:', values);
  };

  return (
    <Card title="Demo 2: Cascading X-Select with Infinite Scroll">
      <Paragraph type="secondary">
        Cascading selects with infinite scroll - perfect for Country → Province → City relationships.
        When you change a parent, children are automatically cleared.
      </Paragraph>

      <XSelectProvider configs={xSelectConfigs} adapter={formAdapter}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <FormProvider registry={antdRegistry} FormItemWrapper={AntdFormItemWrapper}>
            <FieldList configs={formConfigs} />
          </FormProvider>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
            </Space>
          </Form.Item>
        </Form>
      </XSelectProvider>

      {submittedValues && (
        <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
          <Text strong>Submitted Values:</Text>
          <pre style={{ margin: 0 }}>{JSON.stringify(submittedValues, null, 2)}</pre>
        </Card>
      )}
    </Card>
  );
}

// =============================================================================
// DEMO 3: MIXED FIELD TYPES
// =============================================================================

function MixedFieldsDemo() {
  const [form] = Form.useForm();
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);

  const formConfigs: FieldConfig<string>[] = [
    {
      type: 'input',
      name: 'title',
      label: 'Task Title',
      required: true,
      placeholder: 'Enter task title',
    },
    {
      type: 'x-select',
      name: 'status',
      label: 'Status',
      required: true,
      staticOptions: statusOptions,
    } as DynamicFormXSelectConfig,
    {
      type: 'x-select',
      name: 'priorities',
      label: 'Priorities (Multiple)',
      mode: 'multiple',
      staticOptions: priorityOptions,
      placeholder: 'Select multiple priorities',
    } as DynamicFormXSelectConfig,
    {
      type: 'date',
      name: 'dueDate',
      label: 'Due Date',
    },
    {
      type: 'switch',
      name: 'isUrgent',
      label: 'Urgent',
    },
    {
      type: 'number',
      name: 'estimatedHours',
      label: 'Estimated Hours',
      placeholder: 'Enter hours',
    },
    {
      type: 'textarea',
      name: 'notes',
      label: 'Notes',
      placeholder: 'Additional notes...',
    },
  ];

  const handleSubmit = (values: Record<string, unknown>) => {
    setSubmittedValues(values);
    console.log('Form values:', values);
  };

  return (
    <Card title="Demo 3: Mixed Field Types">
      <Paragraph type="secondary">
        X-Select works seamlessly alongside other field types in the dynamic form.
      </Paragraph>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <FormProvider registry={antdRegistry} FormItemWrapper={AntdFormItemWrapper}>
          <FieldList configs={formConfigs} />
        </FormProvider>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>

      {submittedValues && (
        <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
          <Text strong>Submitted Values:</Text>
          <pre style={{ margin: 0 }}>{JSON.stringify(submittedValues, null, 2)}</pre>
        </Card>
      )}
    </Card>
  );
}

// =============================================================================
// DEMO 4: INDIVIDUAL FIELD USAGE
// =============================================================================

function IndividualFieldDemo() {
  const [form] = Form.useForm();

  return (
    <Card title="Demo 4: Individual Field Usage">
      <Paragraph type="secondary">
        You can also use x-select fields individually with the Field component.
      </Paragraph>

      <Form form={form} layout="vertical">
        <FormProvider registry={antdRegistry} FormItemWrapper={AntdFormItemWrapper}>
          <Field
            config={
              {
                type: 'x-select',
                name: 'singleStatus',
                label: 'Single Status Field',
                staticOptions: statusOptions,
                placeholder: 'Select status',
              } as DynamicFormXSelectConfig
            }
          />

          <Field
            config={
              {
                type: 'x-select',
                name: 'multipleStatus',
                label: 'Multiple Status Field',
                mode: 'multiple',
                staticOptions: statusOptions,
                placeholder: 'Select multiple statuses',
              } as DynamicFormXSelectConfig
            }
          />
        </FormProvider>

        <Form.Item>
          <Button type="primary" onClick={() => console.log(form.getFieldsValue())}>
            Log Values
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

// =============================================================================
// MAIN DEMO COMPONENT
// =============================================================================

export function XSelectIntegrationDemo() {
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>X-Select Integration with X-Dynamic-Form</Title>
      <Paragraph>
        This demo shows how x-select integrates with x-dynamic-form. X-Select provides powerful
        features like cascading dependencies, infinite scroll, and static options with metadata.
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <BasicXSelectDemo />
        <Divider />
        <CascadingXSelectDemo />
        <Divider />
        <MixedFieldsDemo />
        <Divider />
        <IndividualFieldDemo />
      </Space>
    </div>
  );
}

export default XSelectIntegrationDemo;
