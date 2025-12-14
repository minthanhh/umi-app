/**
 * SmartSelect Multiple Mode Demo
 *
 * Demonstrates multiple selection with infinite scroll and dependencies
 */

import {
  Select as AntdSelect,
  Button,
  Card,
  Form,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMemo } from 'react';

import {
  Select,
  SmartSelectProvider,
  useAntdFormAdapter,
  type FetchRequest,
  type FetchResponse,
} from '../index';

const { Title, Text } = Typography;

// ============================================================================
// Mock Data
// ============================================================================

interface Category {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface TagItem {
  id: number;
  name: string;
  categoryId: number;
  [key: string]: unknown;
}

const mockCategories: Category[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Category ${i + 1}`,
}));

const mockTags: TagItem[] = mockCategories.flatMap((category) =>
  Array.from({ length: 15 }, (_, i) => ({
    id: category.id * 100 + i + 1,
    name: `Tag ${category.id}-${i + 1}`,
    categoryId: category.id,
  })),
);

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

async function fetchCategories(
  req: FetchRequest,
): Promise<FetchResponse<Category>> {
  await delay(300);
  const start = (req.current - 1) * req.pageSize;
  const data = mockCategories.slice(start, start + req.pageSize);
  return { data, hasMore: start + req.pageSize < mockCategories.length };
}

async function fetchTags(
  req: FetchRequest & { categoryIds?: number[] },
): Promise<FetchResponse<TagItem>> {
  await delay(300);
  let filtered = mockTags;

  // Filter by multiple categories
  if (req.categoryIds && req.categoryIds.length > 0) {
    filtered = mockTags.filter((t) => req.categoryIds!.includes(t.categoryId));
  }

  const start = (req.current - 1) * req.pageSize;
  const data = filtered.slice(start, start + req.pageSize);
  return { data, hasMore: start + req.pageSize < filtered.length };
}

// ============================================================================
// Demo Component
// ============================================================================

export function MultipleDemo() {
  const [form] = Form.useForm();
  const adapter = useAntdFormAdapter(form);

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success(`Submitted: ${JSON.stringify(values)}`);
  };

  const handleReset = () => {
    form.resetFields();
    message.info('Form reset');
  };

  return (
    <Card>
      <Title level={4}>Multiple Selection Mode</Title>
      <Text type="secondary">
        Select multiple categories, then select multiple tags filtered by those
        categories.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ categories: [], tags: [] }}
        style={{ marginTop: 24 }}
      >
        <SmartSelectProvider adapter={adapter}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Multiple Categories */}
            <Form.Item
              name="categories"
              label="Categories (Multiple)"
              rules={[
                {
                  required: true,
                  message: 'Please select at least one category',
                },
              ]}
            >
              <CategoriesSelect />
            </Form.Item>

            {/* Multiple Tags - depends on Categories */}
            <Form.Item
              name="tags"
              label="Tags (Multiple, depends on Categories)"
              rules={[
                { required: true, message: 'Please select at least one tag' },
              ]}
            >
              <TagsSelect />
            </Form.Item>

            {/* Actions */}
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
                <Button onClick={handleReset}>Reset</Button>
                <Button
                  onClick={() => {
                    form.setFieldsValue({
                      categories: [1, 2, 3],
                      tags: [101, 102, 201, 202],
                    });
                    message.info(
                      'Set Categories=[1,2,3], Tags=[101,102,201,202]',
                    );
                  }}
                >
                  Set Values Programmatically
                </Button>
              </Space>
            </Form.Item>
          </Space>
        </SmartSelectProvider>
      </Form>

      {/* Debug: Show current form values */}
      <Form.Item noStyle shouldUpdate>
        {() => (
          <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
            <Text code>
              Form Values: {JSON.stringify(form.getFieldsValue())}
            </Text>
          </Card>
        )}
      </Form.Item>
    </Card>
  );
}

// ============================================================================
// Field Components
// ============================================================================

function CategoriesSelect({
  value,
  onChange,
}: {
  value?: number[];
  onChange?: (v: any) => void;
}) {
  const config = useMemo(
    () => ({
      queryKey: 'multiple-demo-categories',
      fetchList: fetchCategories,
      pageSize: 20,
      getItemId: (item: Category) => item.id,
      getItemLabel: (item: Category) => item.name,
    }),
    [],
  );

  return (
    <Select.Dependent name="categories" value={value} onChange={onChange}>
      {({ value: depValue, onChange: depOnChange }) => (
        <Select.Infinite
          config={config}
          value={depValue}
          onChange={depOnChange}
        >
          {({ options, isLoading, onScroll, onOpenChange }) => (
            <AntdSelect
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select categories..."
              options={options.map((o) => ({ label: o.label, value: o.value }))}
              loading={isLoading}
              value={depValue as number[]}
              onChange={depOnChange}
              onPopupScroll={onScroll}
              onDropdownVisibleChange={onOpenChange}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              tagRender={(props) => (
                <Tag
                  closable={props.closable}
                  onClose={props.onClose}
                  style={{ marginRight: 3 }}
                >
                  {props.label}
                </Tag>
              )}
              maxTagCount="responsive"
            />
          )}
        </Select.Infinite>
      )}
    </Select.Dependent>
  );
}

function TagsSelect({
  value,
  onChange,
}: {
  value?: number[];
  onChange?: (v: any) => void;
}) {
  return (
    <Select.Dependent
      name="tags"
      dependsOn="categories"
      value={value}
      onChange={onChange}
      config={{ onDependencyChange: () => [] }} // Reset to empty array when categories change
    >
      {({
        value: depValue,
        onChange: depOnChange,
        dependencyValues,
        isDisabledByDependency,
      }) => (
        <TagsSelectInner
          depValue={depValue}
          depOnChange={depOnChange}
          categoryIds={dependencyValues.categories as number[] | undefined}
          isDisabledByDependency={isDisabledByDependency}
        />
      )}
    </Select.Dependent>
  );
}

function TagsSelectInner({
  depValue,
  depOnChange,
  categoryIds,
  isDisabledByDependency,
}: {
  depValue: any;
  depOnChange: any;
  categoryIds: number[] | undefined;
  isDisabledByDependency: boolean;
}) {
  const config = useMemo(
    () => ({
      queryKey: `multiple-demo-tags-${categoryIds?.join(',') ?? 'none'}`,
      fetchList: (req: FetchRequest) => fetchTags({ ...req, categoryIds }),
      pageSize: 20,
      getItemId: (item: TagItem) => item.id,
      getItemLabel: (item: TagItem) => item.name,
    }),
    [categoryIds],
  );

  return (
    <Select.Infinite config={config} value={depValue} onChange={depOnChange}>
      {({ options, isLoading, onScroll, onOpenChange }) => (
        <AntdSelect
          mode="multiple"
          style={{ width: '100%' }}
          placeholder={
            isDisabledByDependency
              ? 'Select categories first'
              : 'Select tags...'
          }
          options={options.map((o) => ({ label: o.label, value: o.value }))}
          loading={isLoading}
          value={depValue as number[]}
          onChange={depOnChange}
          disabled={isDisabledByDependency}
          onPopupScroll={onScroll}
          onDropdownVisibleChange={onOpenChange}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label as string)
              ?.toLowerCase()
              .includes(input.toLowerCase())
          }
          tagRender={(props) => (
            <Tag
              closable={props.closable}
              onClose={props.onClose}
              style={{ marginRight: 3 }}
            >
              {props.label}
            </Tag>
          )}
          maxTagCount="responsive"
        />
      )}
    </Select.Infinite>
  );
}

export default MultipleDemo;
