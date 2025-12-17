/**
 * SmartSelect Demo - React Hook Form Integration
 *
 * Features:
 * - 3 cascading selects: User → Project → Task with infinite scroll
 * - Integration with React Hook Form via adapter pattern
 * - Form validation and submission
 *
 * Note: SmartSelect uses its own store for value management.
 * The adapter syncs store changes to React Hook Form via setValue.
 * This is the recommended pattern when using SmartSelect with any form library.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, message, Select, Space, Spin, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';

import { DependentSelectProvider } from '../../context';
import type { DependentFieldConfig, DependentFormAdapter } from '../../types';
import { SmartSelect } from '../index';
import type { FetchRequest, FetchResponse } from '../types';

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

interface FormValues {
  userIds: number[];
  projectIds: number[];
  taskIds: number[];
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

function getCursorCache(key: string): Map<number, string> {
  if (!cursorCache.has(key)) {
    cursorCache.set(key, new Map());
  }
  return cursorCache.get(key)!;
}

// ============================================================================
// API Functions
// ============================================================================

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

async function fetchUsersByIds(ids: Array<string | number>): Promise<User[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/v2/users/options?ids=${ids.join(',')}`);
  const data = await res.json();
  return data.data || [];
}

async function fetchProjects(request: FetchRequest): Promise<FetchResponse<Project>> {
  const { current, pageSize, parentValue, search } = request;

  const userIds = Array.isArray(parentValue) ? parentValue : parentValue ? [parentValue] : [];
  if (!userIds.length) return { data: [], hasMore: false };

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

async function fetchProjectsByIds(ids: Array<string | number>): Promise<Project[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/v2/projects/options?ids=${ids.join(',')}`);
  const data = await res.json();
  return data.data || [];
}

async function fetchTasks(request: FetchRequest): Promise<FetchResponse<Task>> {
  const { current, pageSize, parentValue, search } = request;

  const projectIds = Array.isArray(parentValue) ? parentValue : parentValue ? [parentValue] : [];
  if (!projectIds.length) return { data: [], hasMore: false };

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

async function fetchTasksByIds(ids: Array<string | number>): Promise<Task[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/v2/tasks/options?ids=${ids.join(',')}`);
  const data = await res.json();
  return data.data || [];
}

async function loadSelections(): Promise<Selections | null> {
  const res = await fetch('/api/selections?page=react-hook-form-demo');
  const data = await res.json();
  return data.data;
}

async function saveSelections(selections: Selections): Promise<Selections> {
  const res = await fetch('/api/selections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: 'react-hook-form-demo',
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
];

// ============================================================================
// Main Demo Component
// ============================================================================

export function ReactHookFormDemo() {
  const queryClient = useQueryClient();

  // React Hook Form
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    defaultValues: {
      userIds: [],
      projectIds: [],
      taskIds: [],
    },
  });


  // Watch all values for adapter
  // Load saved selections on mount
  const { data: savedSelections, isLoading: isLoadingSelections } = useQuery<Selections | null>({
    queryKey: ['saved-selections-rhf'],
    queryFn: loadSelections,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveSelections,
    onSuccess: () => {
      message.success('Selections saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['saved-selections-rhf'] });
    },
    onError: (error: Error) => {
      message.error(`Failed to save: ${error.message}`);
    },
  });

  // Create adapter for DependentSelectProvider
  const adapter: DependentFormAdapter = useMemo(
    () => ({
      onFieldChange: (name, value) => setValue(name as 'userIds' | 'projectIds' | 'taskIds', value as number[]),
      onFieldsChange: (fields) => {
        fields.forEach((f) => setValue(f.name as 'userIds' | 'projectIds' | 'taskIds', f.value as number[]));
      },
    }),
    [setValue],
  );

  // Set form values when saved selections load
  useEffect(() => {
    if (savedSelections) {
      reset({
        userIds: savedSelections.userIds || [],
        projectIds: savedSelections.projectIds || [],
        taskIds: savedSelections.taskIds || [],
      });
    }
  }, [savedSelections, reset]);

  // Handle form submit
  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    saveMutation.mutate(data);
  };

  // Handle reset
  const handleReset = () => {
    reset({
      userIds: [],
      projectIds: [],
      taskIds: [],
    });
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
      <Title level={4}>SmartSelect - React Hook Form Demo</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        User → Project → Task cascading selects with infinite scroll using React Hook Form.
      </Text>

      <DependentSelectProvider
        configs={fieldConfigs}
        adapter={adapter}
        initialValues={savedSelections || {}}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* User Select */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Users {errors.userIds && <span style={{ color: 'red' }}>*</span>}
            </label>
            <Controller
              name="userIds"
              control={control}
              rules={{ required: 'Please select at least one user' }}
              render={({ field }) => (
                <SmartSelect.Dependent 
                  name="userIds"
                  value={field.value}
                  onChange={field.onChange}
                >
                  <SmartSelect.Infinite
                    queryKey="users"
                    fetchList={fetchUsers}
                    fetchByIds={fetchUsersByIds}
                    fetchStrategy="eager"
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
                      status={errors.userIds ? 'error' : undefined}
                    />
                  </SmartSelect.Infinite>
                </SmartSelect.Dependent>
              )}
            />
            {errors.userIds && (
              <Text type="danger" style={{ fontSize: 12 }}>
                {errors.userIds.message}
              </Text>
            )}
          </div>

          {/* Project Select */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Projects</label>
            <Controller
              name="projectIds"
              control={control}
              render={({ field }) => (
                <SmartSelect.Dependent name="projectIds"
                
                   value={field.value}
                  onChange={field.onChange}
                >
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
              )}
            />
          </div>

          {/* Task Select */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Tasks</label>
            <Controller
              name="taskIds"
              control={control}
              render={({ field }) => (
                <SmartSelect.Dependent name="taskIds"
                
                
                
                value={field.value}
                  onChange={field.onChange}
                >
                  <SmartSelect.Infinite
                    queryKey="tasks"
                    fetchList={fetchTasks}
                    fetchByIds={fetchTasksByIds}
                    pageSize={10}
                    getItemId={(item) => (item as unknown as Task).id}
                    getItemLabel={(item) => (item as unknown as Task).title}
                    getItemParentValue={(item) => {
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
              )}
            />
          </div>

          {/* Actions */}
          <Space>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              Save Selections
            </Button>
            <Button onClick={handleReset}>Reset</Button>
            <Button
              onClick={() => {
                message.info('Check console for values');
              }}
            >
              Log Values
            </Button>
          </Space>
        </form>
      </DependentSelectProvider>

      {/* Debug Info */}
      <div style={{ marginTop: 24 }}>
        <Text type="secondary">Saved selections: {JSON.stringify(savedSelections || {})}</Text>
      </div>
    </Card>
  );
}

export default ReactHookFormDemo;