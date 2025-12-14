/**
 * SmartSelect Demo - User → Project → Task with Infinite Scroll
 *
 * Features:
 * - 3 cascading selects: User → Project → Task
 * - All selects use infinite scroll
 * - Selections are saved to database and restored on page load
 * - Uses SmartSelect compound components
 */

import { useQuery, useMutation, useQueryClient } from '@umijs/max';
import { Button, Card, Form, message, Select, Space, Spin, Typography } from 'antd';
import { useEffect, useMemo } from 'react';

import { DependentSelectProvider } from '../context';
import type { DependentFieldConfig, DependentFormAdapter } from '../types';
import { SmartSelect } from './index';
import type { FetchRequest, FetchResponse } from './types';

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
  members?: { userId: number }[];
  [key: string]: unknown;
}

interface Task {
  id: number;
  title: string;
  projectId: number;
  [key: string]: unknown;
}

interface Filter {
  id: number;
  name: string;
  page: string;
  [key: string]: unknown;
}

interface Selections {
  userIds?: number[];
  projectIds?: number[];
  taskIds?: number[];
  [key: string]: unknown;
}

// ============================================================================
// Cursor Cache - Track cursors for page-based to cursor-based conversion
// ============================================================================

const cursorCache = new Map<string, Map<number, string>>();

function getCursorCache(key: string): Map<number, string> {
  if (!cursorCache.has(key)) {
    cursorCache.set(key, new Map());
  }
  return cursorCache.get(key)!;
}

// ============================================================================
// API Functions - Using v2 cursor-based APIs
// ============================================================================

/**
 * Fetch users with cursor pagination
 */
async function fetchUsers(request: FetchRequest): Promise<FetchResponse<User>> {
  const { current, pageSize, search } = request;
  const cacheKey = `users-${search || ''}`;
  const cursors = getCursorCache(cacheKey);
  const cursor = current > 1 ? cursors.get(current - 1) : undefined;

  const params = new URLSearchParams({ limit: String(pageSize) });
  if (cursor) params.set('cursor', cursor);
  if (search) params.set('keyword', search);

  const res = await fetch(`/api/v2/users/options?${params}`);
  const data = await res.json();

  if (data.pageInfo?.endCursor) {
    cursors.set(current, data.pageInfo.endCursor);
  }

  return {
    data: data.data || [],
    total: data.pageInfo?.total,
    hasMore: data.pageInfo?.hasNextPage ?? false,
  };
}

/**
 * Fetch users by IDs (hydration)
 */
async function fetchUsersByIds(ids: Array<string | number>): Promise<User[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/v2/users/options?ids=${ids.join(',')}`);
  const data = await res.json();
  return data.data || [];
}

/**
 * Fetch projects with cursor pagination
 */
async function fetchProjects(request: FetchRequest): Promise<FetchResponse<Project>> {
  const { current, pageSize, parentValue, search } = request;

  const userIds = Array.isArray(parentValue) ? parentValue : parentValue ? [parentValue] : [];
  if (!userIds.length) return { data: [], hasMore: false };

  // Pass all userIds as comma-separated string
  const userIdsStr = userIds.join(',');
  const cacheKey = `projects-${userIdsStr}-${search || ''}`;
  const cursors = getCursorCache(cacheKey);
  const cursor = current > 1 ? cursors.get(current - 1) : undefined;

  const params = new URLSearchParams({
    limit: String(pageSize),
    parentField: 'memberId',
    parentValue: userIdsStr,
  });
  if (cursor) params.set('cursor', cursor);
  if (search) params.set('keyword', search);

  const res = await fetch(`/api/v2/projects/options?${params}`);
  const data = await res.json();

  if (data.pageInfo?.endCursor) {
    cursors.set(current, data.pageInfo.endCursor);
  }

  return {
    data: data.data || [],
    total: data.pageInfo?.total,
    hasMore: data.pageInfo?.hasNextPage ?? false,
  };
}

/**
 * Fetch projects by IDs (hydration)
 */
async function fetchProjectsByIds(ids: Array<string | number>): Promise<Project[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/v2/projects/options?ids=${ids.join(',')}`);
  const data = await res.json();
  return data.data || [];
}

/**
 * Fetch tasks with cursor pagination
 */
async function fetchTasks(request: FetchRequest): Promise<FetchResponse<Task>> {
  const { current, pageSize, parentValue, search } = request;

  const projectIds = Array.isArray(parentValue) ? parentValue : parentValue ? [parentValue] : [];
  if (!projectIds.length) return { data: [], hasMore: false };

  // Pass all projectIds as comma-separated string
  const projectIdsStr = projectIds.join(',');
  const cacheKey = `tasks-${projectIdsStr}-${search || ''}`;
  const cursors = getCursorCache(cacheKey);
  const cursor = current > 1 ? cursors.get(current - 1) : undefined;

  const params = new URLSearchParams({
    limit: String(pageSize),
    parentField: 'projectId',
    parentValue: projectIdsStr,
  });
  if (cursor) params.set('cursor', cursor);
  if (search) params.set('keyword', search);

  const res = await fetch(`/api/v2/tasks/options?${params}`);
  const data = await res.json();

  if (data.pageInfo?.endCursor) {
    cursors.set(current, data.pageInfo.endCursor);
  }

  return {
    data: data.data || [],
    total: data.pageInfo?.total,
    hasMore: data.pageInfo?.hasNextPage ?? false,
  };
}

/**
 * Fetch tasks by IDs (hydration)
 */
async function fetchTasksByIds(ids: Array<string | number>): Promise<Task[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/v2/tasks/options?ids=${ids.join(',')}`);
  const data = await res.json();
  return data.data || [];
}

/**
 * Fetch filters with cursor pagination (no dependency)
 */
async function fetchFilters(request: FetchRequest): Promise<FetchResponse<Filter>> {
  const { current, pageSize, search } = request;
  const cacheKey = `filters-${search || ''}`;
  const cursors = getCursorCache(cacheKey);
  const cursor = current > 1 ? cursors.get(current - 1) : undefined;

  const params = new URLSearchParams({ limit: String(pageSize) });
  if (cursor) params.set('cursor', cursor);
  if (search) params.set('keyword', search);

  const res = await fetch(`/api/v2/filters/options?${params}`);
  const data = await res.json();

  if (data.pageInfo?.endCursor) {
    cursors.set(current, data.pageInfo.endCursor);
  }

  return {
    data: data.data || [],
    total: data.pageInfo?.total,
    hasMore: data.pageInfo?.hasNextPage ?? false,
  };
}

/**
 * Fetch filters by IDs (hydration)
 */
async function fetchFiltersByIds(ids: Array<string | number>): Promise<Filter[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/v2/filters/options?ids=${ids.join(',')}`);
  const data = await res.json();
  return data.data || [];
}

/**
 * Load saved selections from API
 */
async function loadSelections(): Promise<Selections | null> {
  const res = await fetch('/api/selections?page=smart-select-demo');
  const data = await res.json();
  return data.data;
}

/**
 * Save selections to API
 */
async function saveSelections(selections: Selections): Promise<Selections> {
  const res = await fetch('/api/selections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: 'smart-select-demo',
      selections,
    }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  return data.data;
}

// ============================================================================
// Field Configs
// ============================================================================

const fieldConfigs: DependentFieldConfig[] = [
  {
    name: 'userIds',
    label: 'Users',
    placeholder: 'Select users...',
    mode: 'multiple',
  },
  {
    name: 'projectIds',
    label: 'Projects',
    placeholder: 'Select projects...',
    mode: 'multiple',
    dependsOn: 'userIds',
  },
  {
    name: 'taskIds',
    label: 'Tasks',
    placeholder: 'Select tasks...',
    mode: 'multiple',
    dependsOn: 'projectIds',
  },
  {
    name: 'testIds',
    label: 'Tests - Tasks',
    placeholder: 'Select tasks...',
    mode: 'multiple',
    dependsOn: 'taskIds',
  },
];

// ============================================================================
// Main Demo Component
// ============================================================================

export function SmartSelectDemo() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Load saved selections on mount
  const {
    data: savedSelections,
    isLoading: isLoadingSelections,
  } = useQuery<Selections | null>({
    queryKey: ['saved-selections'],
    queryFn: loadSelections,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveSelections,
    onSuccess: () => {
      message.success('Selections saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['saved-selections'] });
    },
    onError: (error: Error) => {
      message.error(`Failed to save: ${error.message}`);
    },
  });

  // Create adapter for form sync
  const adapter: DependentFormAdapter = useMemo(
    () => ({
      onFieldChange: (name, value) => form.setFieldValue(name, value),
      onFieldsChange: (fields) =>
        form.setFieldsValue(
          Object.fromEntries(fields.map((f) => [f.name, f.value])),
        ),
    }),
    [form],
  );

  // Set form values when saved selections load
  useEffect(() => {
    if (savedSelections) {
      form.setFieldsValue(savedSelections);
    }
  }, [savedSelections, form]);

  // Handle save
  const handleSave = () => {
    const values = form.getFieldsValue();
    console.log({values});
    saveMutation.mutate(values);
  };

  // Handle reset
  const handleReset = () => {
    form.resetFields();
  };

  // Show loading while fetching saved selections
  if (isLoadingSelections) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading saved selections...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>SmartSelect Demo</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        User → Project → Task cascading selects with infinite scroll.
        Selections are saved to database and restored on page reload.
      </Text>

      <DependentSelectProvider
        configs={fieldConfigs}
        adapter={adapter}
        initialValues={savedSelections || {}}
      >
        <Form form={form} layout="vertical">
          {/* User Select - Infinite only */}
          <Form.Item name="userIds" label="Users">
            <SmartSelect.Dependent name="userIds">
              <SmartSelect.Infinite
                queryKey="users"
                fetchList={fetchUsers}
                fetchByIds={fetchUsersByIds}
                fetchStrategy='eager'
                pageSize={10}
                getItemId={(item) => (item as unknown as User).id}
                getItemLabel={(item) =>
                  `${(item as unknown as User).name} (${(item as unknown as User).email})`
                }
              >
                <Select
                  mode="multiple"
                  placeholder="Select users..."
                  style={{ width: '100%' }}
                />
              </SmartSelect.Infinite>
            </SmartSelect.Dependent>
          </Form.Item>

          {/* Project Select - Dependent + Infinite */}
          <Form.Item name="projectIds" label="Projects">
            <SmartSelect.Dependent name="projectIds">
              <SmartSelect.Infinite
                queryKey="projects"
                fetchList={fetchProjects}
                fetchByIds={fetchProjectsByIds}
                pageSize={10}
                getItemId={(item) => (item as unknown as Project).id}
                getItemLabel={(item) => (item as unknown as Project).name}
                getItemParentValue={(item) => {
                  const project = item as unknown as Project;
                  return [project.ownerId];
                }}
              >
                <Select
                  mode="multiple"
                  placeholder="Select projects..."
                  style={{ width: '100%' }}
                />
              </SmartSelect.Infinite>
            </SmartSelect.Dependent>
          </Form.Item>

          {/* Task Select - Dependent + Infinite */}
          <Form.Item name="taskIds" label="Tasks">
            <SmartSelect.Dependent name="taskIds">
              <SmartSelect.Infinite
                queryKey="tasks"
                fetchList={fetchTasks}
                fetchByIds={fetchTasksByIds}
                pageSize={10}
                getItemId={(item) => (item as unknown as Task).id}
                getItemLabel={(item) => (item as unknown as Task).title}
                getItemParentValue={(item) => {
                  // Each task belongs to exactly one project
                  const task = item as unknown as Task;
                  return task.projectId;
                }}
              >
                <Select
                  mode="multiple"
                  placeholder="Select tasks..."
                  style={{ width: '100%' }}
                />
              </SmartSelect.Infinite>
            </SmartSelect.Dependent>
          </Form.Item>

          <Form.Item name="testIds" label="Tasks">
            <SmartSelect.Dependent name="testIds" options={[{ label: "Test - Task 1", value: "test-task1", parentValue: [84] }]}>
                <Select
                  mode="multiple"
                  placeholder="Select tasks..."
                  style={{ width: '100%' }}
                />
            </SmartSelect.Dependent>
          </Form.Item>

          {/* Filter Select - Infinite only (no dependency) */}
          <Form.Item name="filterIds" label="Filters">
            <SmartSelect.Infinite
              queryKey="filters"
              fetchList={fetchFilters}
              fetchByIds={fetchFiltersByIds}
              fetchStrategy="lazy"
              pageSize={10}
              getItemId={(item) => (item as unknown as Filter).id}
              getItemLabel={(item) => {
                const filter = item as unknown as Filter;
                return `${filter.name} (${filter.page})`;
              }}
            >
              <Select
                mode="multiple"
                placeholder="Select filters..."
                style={{ width: '100%' }}
              />
            </SmartSelect.Infinite>
          </Form.Item>

          {/* Actions */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saveMutation.isPending}
              >
                Save Selections
              </Button>
              <Button onClick={handleReset}>Reset</Button>
              <Button
                onClick={() => {
                  const values = form.getFieldsValue();
                  console.log('Current values:', values);
                  message.info('Check console for values');
                }}
              >
                Log Values
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </DependentSelectProvider>

      {/* Debug Info */}
      <div style={{ marginTop: 24 }}>
        <Text type="secondary">
          Saved selections: {JSON.stringify(savedSelections || {})}
        </Text>
      </div>
    </Card>
  );
}

export default SmartSelectDemo;