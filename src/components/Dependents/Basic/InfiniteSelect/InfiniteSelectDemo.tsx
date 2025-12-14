/**
 * InfiniteSelectDemo - Demo Component
 *
 * Demo các cách sử dụng InfiniteSelect:
 * 1. Standalone usage
 * 2. With DependentField integration
 * 3. With render props (custom UI)
 */

import { Card, Divider, Form, Space, Typography } from 'antd';
import React, { useState } from 'react';

import { DependentSelectProvider, FormDependentSelectField } from '../index';
import type { DependentFormAdapter } from '../types';
import { InfiniteDependentSelectField } from './InfiniteDependentSelectField';
import { InfiniteSelect } from './InfiniteSelect';
import { InfiniteSelectWrapper } from './InfiniteSelectWrapper';
import type { BaseItem, FetchRequest, FetchResponse } from './types';

const { Title, Text } = Typography;

// ============================================================================
// MOCK DATA & FETCH FUNCTIONS
// ============================================================================

interface User extends BaseItem {
  id: number;
  name: string;
  email: string;
}

interface Country extends BaseItem {
  id: string;
  name: string;
  code: string;
}

interface Province extends BaseItem {
  id: string;
  name: string;
  countryId: string;
}

// Generate mock users
const mockUsers: User[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
}));

// Mock countries
const mockCountries: Country[] = [
  { id: 'VN', name: 'Vietnam', code: 'VN' },
  { id: 'US', name: 'United States', code: 'US' },
  { id: 'JP', name: 'Japan', code: 'JP' },
];

// Mock provinces
const mockProvinces: Province[] = [
  { id: 'HCM', name: 'Ho Chi Minh City', countryId: 'VN' },
  { id: 'HN', name: 'Ha Noi', countryId: 'VN' },
  { id: 'DN', name: 'Da Nang', countryId: 'VN' },
  { id: 'CA', name: 'California', countryId: 'US' },
  { id: 'NY', name: 'New York', countryId: 'US' },
  { id: 'TX', name: 'Texas', countryId: 'US' },
  { id: 'TK', name: 'Tokyo', countryId: 'JP' },
  { id: 'OS', name: 'Osaka', countryId: 'JP' },
  { id: 'KY', name: 'Kyoto', countryId: 'JP' },
];

/**
 * Simulate API call with delay
 */
async function simulateDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch users with pagination and search
 */
async function fetchUsers(request: FetchRequest): Promise<FetchResponse<User>> {
  await simulateDelay(300);

  let filtered = [...mockUsers];

  // Search filter
  if (request.search) {
    const search = request.search.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search),
    );
  }

  // Pagination
  const start = (request.current - 1) * request.pageSize;
  const end = start + request.pageSize;
  const data = filtered.slice(start, end);

  return {
    data,
    total: filtered.length,
    hasMore: end < filtered.length,
  };
}

/**
 * Fetch provinces with parent filter
 */
async function fetchProvinces(
  request: FetchRequest,
): Promise<FetchResponse<Province>> {
  await simulateDelay(300);

  let filtered = [...mockProvinces];

  // Filter by country (parent value)
  if (request.parentValue) {
    filtered = filtered.filter((p) => p.countryId === request.parentValue);
  }

  // Search filter
  if (request.search) {
    const search = request.search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
  }

  // Pagination
  const start = (request.current - 1) * request.pageSize;
  const end = start + request.pageSize;
  const data = filtered.slice(start, end);

  return {
    data,
    total: filtered.length,
    hasMore: end < filtered.length,
  };
}

// ============================================================================
// DEMO 1: STANDALONE USAGE
// ============================================================================

function StandaloneDemo() {
  const [selectedUser, setSelectedUser] = useState<number | undefined>();

  return (
    <Card title="1. Standalone Usage" size="small">
      <Text type="secondary">
        InfiniteSelect hoạt động độc lập, không cần Provider.
      </Text>
      <Divider />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>Selected: {selectedUser ?? 'None'}</Text>

        <InfiniteSelect<User>
          queryKey="demo-users"
          fetchList={fetchUsers}
          value={selectedUser}
          onChange={(v) => setSelectedUser(v as number)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => `${item.name} (${item.email})`}
          placeholder="Search and select a user..."
          style={{ width: 300 }}
          pageSize={10}
        />
      </Space>
    </Card>
  );
}

// ============================================================================
// DEMO 2: WITH DEPENDENT FIELD
// ============================================================================

function DependentFieldDemo() {
  const [form] = Form.useForm();

  // Adapter để sync với Ant Design Form
  const adapter: DependentFormAdapter = {
    onFieldChange: (name, value) => {
      form.setFieldValue(name, value);
    },
    onFieldsChange: (fields) => {
      const values: Record<string, unknown> = {};
      fields.forEach((f) => {
        values[f.name] = f.value;
      });
      form.setFieldsValue(values);
    },
  };

  // Configs cho dependent fields
  const configs = [
    {
      name: 'country',
      label: 'Country',
      placeholder: 'Select country',
      options: mockCountries.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    },
    {
      name: 'province',
      label: 'Province',
      placeholder: 'Select province',
      dependsOn: 'country',
      // Options sẽ được fetch từ InfiniteDependentSelectField
    },
  ];

  const handleSubmit = (values: Record<string, unknown>) => {
    console.log('Form values:', values);
  };

  return (
    <Card title="2. With DependentField Integration" size="small">
      <Text type="secondary">
        InfiniteDependentSelectField tự động lấy parentValue từ context.
      </Text>
      <Divider />

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <DependentSelectProvider configs={configs} adapter={adapter}>
          <Form.Item name="country" label="Country">
            <FormDependentSelectField name="country" />
          </Form.Item>

          <Form.Item name="province" label="Province">
            <InfiniteDependentSelectField<Province>
              name="province"
              fetchList={fetchProvinces}
              getItemId={(item) => item.id}
              getItemLabel={(item) => item.name}
              pageSize={5}
            />
          </Form.Item>
        </DependentSelectProvider>
      </Form>
    </Card>
  );
}

// ============================================================================
// DEMO 3: WITH RENDER PROPS (CUSTOM UI)
// ============================================================================

function RenderPropsDemo() {
  const [selected, setSelected] = useState<number | undefined>();

  return (
    <Card title="3. With Render Props (Custom UI)" size="small">
      <Text type="secondary">
        InfiniteSelectWrapper cho phép tùy chỉnh UI hoàn toàn.
      </Text>
      <Divider />

      <InfiniteSelectWrapper<User>
        queryKey="demo-users-custom"
        fetchList={fetchUsers}
        value={selected}
        onChange={(v) => setSelected(v as number)}
        getItemId={(item) => item.id}
        getItemLabel={(item) => item.name}
        pageSize={5}
        fetchStrategy="eager"
      >
        {({
          items,
          isLoading,
          isFetchingMore,
          hasNextPage,
          fetchNextPage,
          selectedItems,
          onChange,
        }) => (
          <div
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              padding: 8,
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>
                    Selected: {selectedItems.map((i) => i.name).join(', ') || 'None'}
                  </Text>
                </div>

                <Space direction="vertical" style={{ width: '100%' }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onChange(item.id)}
                      style={{
                        padding: '8px 12px',
                        background: selectedItems.some((s) => s.id === item.id)
                          ? '#e6f7ff'
                          : '#fafafa',
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: selectedItems.some((s) => s.id === item.id)
                          ? '1px solid #1890ff'
                          : '1px solid transparent',
                      }}
                    >
                      <Text>{item.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.email}
                      </Text>
                    </div>
                  ))}
                </Space>

                {hasNextPage && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <button
                      onClick={fetchNextPage}
                      disabled={isFetchingMore}
                      style={{
                        padding: '4px 12px',
                        cursor: isFetchingMore ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isFetchingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </InfiniteSelectWrapper>
    </Card>
  );
}

// ============================================================================
// MAIN DEMO COMPONENT
// ============================================================================

export function InfiniteSelectDemo() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>InfiniteSelect Demo</Title>

      <Text>
        InfiniteSelect cung cấp infinite scroll với React Query. Có thể dùng:
      </Text>
      <ul>
        <li>
          <Text code>InfiniteSelect</Text> - Standalone với Ant Design
        </li>
        <li>
          <Text code>InfiniteDependentSelectField</Text> - Tích hợp với
          DependentField
        </li>
        <li>
          <Text code>InfiniteSelectWrapper</Text> - Render props cho custom UI
        </li>
        <li>
          <Text code>useInfiniteSelect</Text> - Hook để dùng với bất kỳ UI
        </li>
      </ul>

      <Divider />

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <StandaloneDemo />
        <DependentFieldDemo />
        <RenderPropsDemo />
      </Space>
    </Space>
  );
}

export default InfiniteSelectDemo;