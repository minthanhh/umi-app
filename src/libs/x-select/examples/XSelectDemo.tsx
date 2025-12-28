/**
 * XSelect Demo - Cascading Selects with Infinite Scroll
 *
 * Demonstrates:
 * - User → Project → Task cascading
 * - Infinite scroll with cursor pagination
 * - Hydration for selected values
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, message, Select, Space, Spin, Typography } from 'antd';
import { useMemo } from 'react';

import { XSelectProvider, XSelect } from '../index';
import type { FieldConfig, FormAdapter, InfinitePageData } from '../index';

const { Title, Text } = Typography;

// ============================================================================
// Types
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: unknown;
}

interface Project {
  id: number;
  name: string;
  ownerId: number;
  [key: string]: unknown;
}

interface Task {
  id: number;
  title: string;
  projectId: number;
  [key: string]: unknown;
}

interface Selections {
  userIds?: number[];
  projectIds?: number[];
  taskIds?: number[];
  [key: string]: unknown;
}

// ============================================================================
// Cursor Cache
// ============================================================================

const cursorCache = new Map<string, Map<number, string>>();

function getCursors(key: string): Map<number, string> {
  if (!cursorCache.has(key)) {
    cursorCache.set(key, new Map());
  }
  return cursorCache.get(key)!;
}

// ============================================================================
// API Helpers
// ============================================================================

interface ApiResponse<T> {
  data: T[];
  pageInfo?: {
    endCursor?: string;
    hasNextPage?: boolean;
    total?: number;
  };
}

async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  return res.json();
}

function buildParams(params: Record<string, string | number | undefined>): URLSearchParams {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) urlParams.set(key, String(value));
  });
  return urlParams;
}

// ============================================================================
// Query Factories
// ============================================================================

function createListQueryFn<T>(
  endpoint: string,
  options?: {
    parentField?: string;
    getParentValue?: (parentValue: unknown) => string | undefined;
  },
) {
  return async ({ pageParam = 1, queryKey }: { pageParam: number; queryKey: readonly unknown[] }): Promise<InfinitePageData<T>> => {
    const [, , parentValue, search] = queryKey as [string, string, unknown, string];

    // Get parent IDs if applicable
    let parentIds: string | undefined;
    if (options?.getParentValue) {
      parentIds = options.getParentValue(parentValue);
      if (options.parentField && !parentIds) {
        return { data: [], nextPage: undefined, fetchedWithParentValue: parentValue };
      }
    }

    // Build cache key and get cursor
    const cacheKey = `${endpoint}-${parentIds || ''}-${search || ''}`;
    const cursors = getCursors(cacheKey);
    const cursor = pageParam > 1 ? cursors.get(pageParam - 1) : undefined;

    // Build URL params
    const params = buildParams({
      limit: '10',
      cursor,
      keyword: search || undefined,
      ...(options?.parentField && parentIds ? { parentField: options.parentField, parentValue: parentIds } : {}),
    });

    const response = await fetchApi<T>(`/api/v2/${endpoint}/options?${params}`);

    // Cache cursor for next page
    if (response.pageInfo?.endCursor) {
      cursors.set(pageParam, response.pageInfo.endCursor);
    }

    return {
      data: response.data || [],
      nextPage: response.pageInfo?.hasNextPage ? pageParam + 1 : undefined,
      fetchedWithParentValue: parentValue,
    };
  };
}

function createHydrationQueryFn<T>(endpoint: string) {
  return async (_context: unknown, ids: Array<string | number>): Promise<T[]> => {
    if (!ids.length) return [];
    const response = await fetchApi<T>(`/api/v2/${endpoint}/options?ids=${ids.join(',')}`);
    return response.data || [];
  };
}

// Helper to extract IDs from parent value
function extractIds(value: unknown): string | undefined {
  if (!value) return undefined;
  const ids = Array.isArray(value) ? value : [value];
  return ids.length > 0 ? ids.join(',') : undefined;
}

// ============================================================================
// Query Functions
// ============================================================================

const userListQuery = createListQueryFn<User>('users');
const userHydrationQuery = createHydrationQueryFn<User>('users');

const projectListQuery = createListQueryFn<Project>('projects', {
  parentField: 'memberId',
  getParentValue: extractIds,
});
const projectHydrationQuery = createHydrationQueryFn<Project>('projects');

const taskListQuery = createListQueryFn<Task>('tasks', {
  parentField: 'projectId',
  getParentValue: extractIds,
});
const taskHydrationQuery = createHydrationQueryFn<Task>('tasks');

// ============================================================================
// Selections API
// ============================================================================

async function loadSelections(): Promise<Selections | null> {
  const res = await fetch('/api/selections?page=x-select-demo');
  const data = await res.json();
  return data.data;
}

async function saveSelections(selections: Selections): Promise<Selections> {
  const res = await fetch('/api/selections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: 'x-select-demo', selections }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

// ============================================================================
// Scroll Handler
// ============================================================================

const SCROLL_THRESHOLD = 50;

function createScrollHandler(fetchNextPage: () => void, hasNextPage: boolean, isFetchingMore: boolean) {
  return (e: React.UIEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < SCROLL_THRESHOLD;

    if (isNearBottom && hasNextPage && !isFetchingMore) {
      fetchNextPage();
    }
  };
}

// ============================================================================
// Field Configs
// ============================================================================

const fieldConfigs: FieldConfig[] = [
  { name: 'userIds', mode: 'multiple' },
  { name: 'projectIds', mode: 'multiple', dependsOn: 'userIds' },
  { name: 'taskIds', mode: 'multiple', dependsOn: 'projectIds' },
];

// ============================================================================
// Demo Component
// ============================================================================

export function XSelectDemo() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: savedSelections, isLoading } = useQuery({
    queryKey: ['saved-selections'],
    queryFn: loadSelections,
  });

  const saveMutation = useMutation({
    mutationFn: saveSelections,
    onSuccess: () => {
      message.success('Saved!');
      queryClient.invalidateQueries({ queryKey: ['saved-selections'] });
    },
    onError: (error: Error) => message.error(error.message),
  });

  const adapter: FormAdapter = useMemo(() => ({
    onFieldChange: (name, value) => form.setFieldValue(name, value),
    onFieldsChange: (fields) => form.setFieldsValue(
      Object.fromEntries(fields.map((f) => [f.name, f.value])),
    ),
  }), [form]);

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>XSelect Demo</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        User → Project → Task cascading selects with infinite scroll
      </Text>

      <XSelectProvider
        configs={fieldConfigs}
        adapter={adapter}
        initialValues={savedSelections ?? undefined}
      >
        <Form form={form} layout="vertical" initialValues={savedSelections ?? undefined}>
          {/* Users */}
          <Form.Item name="userIds" label="Users">
            <XSelect.Dependent name="userIds">
              <XSelect.Infinite<User>
                queryKey="users"
                listQuery={{
                  queryFn: userListQuery,
                  initialPageParam: 1,
                  getNextPageParam: (lastPage) => lastPage.nextPage,
                }}
                hydrationQuery={{ queryFn: userHydrationQuery }}
                itemAccessors={{
                  getId: (item) => item.id,
                  getLabel: (item) => `${item.name} (${item.email})`,
                  
                }}
              >
                {(props) => (
                  <Select
                    mode="multiple"
                    value={props.value as number[]}
                    onChange={props.onChange}
                    options={props.options}
                    loading={props.loading}
                    placeholder="Select users..."
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={props.onSearch}
                    onDropdownVisibleChange={props.onOpenChange}
                    onPopupScroll={createScrollHandler(props.fetchNextPage, props.hasNextPage, props.isFetchingMore)}
                  />
                )}
              </XSelect.Infinite>
            </XSelect.Dependent>
          </Form.Item>

          {/* Projects */}
          <Form.Item name="projectIds" label="Projects">
            <XSelect.Dependent name="projectIds">
              <XSelect.Infinite<Project>
                queryKey="projects"
                listQuery={{
                  queryFn: projectListQuery,
                  initialPageParam: 1,
                  getNextPageParam: (lastPage) => lastPage.nextPage,
                  fetchStrategy: "lazy"
                }}
                hydrationQuery={{ queryFn: projectHydrationQuery }}
                itemAccessors={{
                  getId: (item) => item.id,
                  getLabel: (item) => item.name,
                  getParentValue: (item) => item.ownerId,
                }}
              >
                {(props) => (
                  <Select
                    mode="multiple"
                    value={props.value as number[]}
                    onChange={props.onChange}
                    options={props.options}
                    loading={props.loading}
                    disabled={props.disabled}
                    placeholder="Select projects..."
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={props.onSearch}
                    onDropdownVisibleChange={props.onOpenChange}
                    onPopupScroll={createScrollHandler(props.fetchNextPage, props.hasNextPage, props.isFetchingMore)}
                  />
                )}
              </XSelect.Infinite>
            </XSelect.Dependent>
          </Form.Item>

          {/* Tasks */}
          <Form.Item name="taskIds" label="Tasks">
            <XSelect.Dependent name="taskIds">
              <XSelect.Infinite<Task>
                queryKey="tasks"
                listQuery={{
                  queryFn: taskListQuery,
                  initialPageParam: 1,
                  getNextPageParam: (lastPage) => lastPage.nextPage,
                }}
                hydrationQuery={{ queryFn: taskHydrationQuery }}
                itemAccessors={{
                  getId: (item) => item.id,
                  getLabel: (item) => item.title,
                  getParentValue: (item) => item.projectId,
                }}
              >
                {(props) => (
                  <Select
                    mode="multiple"
                    value={props.value as number[]}
                    onChange={props.onChange}
                    options={props.options}
                    loading={props.loading}
                    disabled={props.disabled}
                    placeholder="Select tasks..."
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={props.onSearch}
                    onDropdownVisibleChange={props.onOpenChange}
                    onPopupScroll={createScrollHandler(props.fetchNextPage, props.hasNextPage, props.isFetchingMore)}
                  />
                )}
              </XSelect.Infinite>
            </XSelect.Dependent>
          </Form.Item>

          {/* Actions */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={() => saveMutation.mutate(form.getFieldsValue())}
                loading={saveMutation.isPending}
              >
                Save
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
              <Button onClick={() => console.log(form.getFieldsValue())}>
                Log Values
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </XSelectProvider>
    </Card>
  );
}

export default XSelectDemo;
