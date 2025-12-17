/**
 * SmartSelect Demo - Formik Integration
 *
 * Features:
 * - 3 cascading selects: User → Project → Task with infinite scroll
 * - Integration with Formik using useFormik hook
 * - Form validation with Yup schema
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, message, Select, Space, Spin, Typography } from 'antd';
import { useFormik, FormikProvider } from 'formik';
import { useEffect, useMemo } from 'react';
import * as Yup from 'yup';

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
// Validation Schema
// ============================================================================

const validationSchema = Yup.object().shape({
  userIds: Yup.array().of(Yup.number()).min(1, 'Please select at least one user'),
  projectIds: Yup.array().of(Yup.number()),
  taskIds: Yup.array().of(Yup.number()),
});

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
  const res = await fetch('/api/selections?page=formik-demo');
  const data = await res.json();
  return data.data;
}

async function saveSelections(selections: Selections): Promise<Selections> {
  const res = await fetch('/api/selections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: 'formik-demo',
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

export function FormikDemo() {
  const queryClient = useQueryClient();

  // Load saved selections on mount
  const { data: savedSelections, isLoading: isLoadingSelections } = useQuery<Selections | null>({
    queryKey: ['saved-selections-formik'],
    queryFn: loadSelections,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveSelections,
    onSuccess: () => {
      message.success('Selections saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['saved-selections-formik'] });
    },
    onError: (error: Error) => {
      message.error(`Failed to save: ${error.message}`);
    },
  });

  // Formik setup
  const formik = useFormik<FormValues>({
    initialValues: {
      userIds: [],
      projectIds: [],
      taskIds: [],
    },
    validationSchema,
    onSubmit: (values) => {
      console.log('Form submitted:', values);
      saveMutation.mutate(values);
    },
  });

  // Create adapter for DependentSelectProvider
  const adapter: DependentFormAdapter = useMemo(
    () => ({
      onFieldChange: (name, value) => formik.setFieldValue(name, value),
      onFieldsChange: (fields) => {
        fields.forEach((f) => formik.setFieldValue(f.name, f.value));
      },
    }),
    [formik],
  );

  // Set form values when saved selections load
  useEffect(() => {
    if (savedSelections) {
      formik.setValues({
        userIds: savedSelections.userIds || [],
        projectIds: savedSelections.projectIds || [],
        taskIds: savedSelections.taskIds || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSelections]);

  // Handle reset
  const handleReset = () => {
    formik.resetForm({
      values: {
        userIds: [],
        projectIds: [],
        taskIds: [],
      },
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
      <Title level={4}>SmartSelect - Formik Demo</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        User → Project → Task cascading selects with infinite scroll using Formik.
      </Text>

      <FormikProvider value={formik}>
        <DependentSelectProvider
          configs={fieldConfigs}
          adapter={adapter}
          initialValues={savedSelections || {}}
        >
          <form onSubmit={formik.handleSubmit}>
            {/* User Select */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Users {formik.touched.userIds && formik.errors.userIds && <span style={{ color: 'red' }}>*</span>}
              </label>
              <SmartSelect.Dependent name="userIds" value={formik.values.userIds}
                  onChange={(value) => {
                    formik.setFieldValue('userIds', value);
                    formik.setFieldTouched('userIds', true);
                  }}>
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
                    status={formik.touched.userIds && formik.errors.userIds ? 'error' : undefined}
                    onBlur={() => formik.setFieldTouched('userIds', true)}
                  />
                </SmartSelect.Infinite>
              </SmartSelect.Dependent>
              {formik.touched.userIds && formik.errors.userIds && (
                <Text type="danger" style={{ fontSize: 12 }}>
                  {formik.errors.userIds}
                </Text>
              )}
            </div>

            {/* Project Select */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Projects</label>
              <SmartSelect.Dependent name="projectIds" value={formik.values.projectIds}
                  onChange={(value) => formik.setFieldValue('projectIds', value)}>
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
            </div>

            {/* Task Select */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Tasks</label>
              <SmartSelect.Dependent name="taskIds" value={formik.values.taskIds}
                  onChange={(value) => formik.setFieldValue('taskIds', value)}>
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
            </div>

            {/* Actions */}
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={saveMutation.isPending}
                disabled={!formik.isValid}
              >
                Save Selections
              </Button>
              <Button onClick={handleReset}>Reset</Button>
              <Button
                onClick={() => {
                  console.log('Current values:', formik.values);
                  console.log('Errors:', formik.errors);
                  console.log('Touched:', formik.touched);
                  message.info('Check console for values');
                }}
              >
                Log Values
              </Button>
            </Space>
          </form>
        </DependentSelectProvider>
      </FormikProvider>

      {/* Debug Info */}
      <div style={{ marginTop: 24 }}>
        <Text type="secondary">Saved selections: {JSON.stringify(savedSelections || {})}</Text>
      </div>
    </Card>
  );
}

export default FormikDemo;