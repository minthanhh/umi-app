/**
 * XSelect Demo - User → Project → Task → Comment with Infinite Scroll
 *
 * Features:
 * - 4 cascading selects: User → Project → Task, Comment (depends on User + Task)
 * - All selects use infinite scroll
 * - Comment select demonstrates MULTIPLE parent dependencies (userIds AND taskIds)
 * - Selections are saved to database and restored on page load
 * - Uses XSelect compound components
 */

import { useQuery, useMutation, useQueryClient } from '@umijs/max';
import { Button, Card, Form, message, Select, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useMemo } from 'react';

import { XSelectProvider, XSelect, ErrorDisplay, XSelectErrorBoundary } from '../index';
import type { FieldConfig, FormAdapter, FetchRequest, FetchResponse, StaticOption } from '../index';

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

interface Comment {
  id: number;
  content: string;
  authorId: number;
  taskId: number;
  author?: { id: number; name: string };
  task?: { id: number; title: string };
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
  commentIds?: number[];
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
 * NOTE: First 2 calls will fail if SIMULATE_ERROR is true (to demo Error Recovery)
 */
async function fetchUsers(request: FetchRequest): Promise<FetchResponse<User>> {
  // Simulate error for first 2 requests to demo Error Recovery UI
  const { current, pageSize, search } = request;
  const cacheKey = `users-${search || ''}`;
  const cursors = getCursorCache(cacheKey);
  const cursor = current > 1 ? cursors.get(current - 1) : undefined;

  const params = new URLSearchParams({ limit: String(pageSize) });
  if (cursor) params.set('cursor', cursor);
  if (search) params.set('keyword', search);

  const res = await fetch(`/api/v2/users/options?${params}`);
  const data = await res.json();

  if (res.ok) {
    if (data.pageInfo?.endCursor) {
      cursors.set(current, data.pageInfo.endCursor);
    }

    return {
      data: data.data || [],
      total: data.pageInfo?.total,
      hasMore: data.pageInfo?.hasNextPage ?? false,
    };
  }

  return data;
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
 * Fetch comments with cursor pagination (depends on userIds AND taskIds)
 */
async function fetchComments(request: FetchRequest): Promise<FetchResponse<Comment>> {
  const { current, pageSize, parentValue, search } = request;

  // parentValue is an object { userIds: [...], taskIds: [...] } for multiple dependencies
  const parents = parentValue as { userIds?: number[]; taskIds?: number[] } | undefined;
  const userIds = parents?.userIds || [];
  const taskIds = parents?.taskIds || [];

  // Need at least one parent to have values
  if (!userIds.length && !taskIds.length) {
    return { data: [], hasMore: false };
  }

  const cacheKey = `comments-${userIds.join(',')}-${taskIds.join(',')}-${search || ''}`;
  const cursors = getCursorCache(cacheKey);
  const cursor = current > 1 ? cursors.get(current - 1) : undefined;

  const params = new URLSearchParams({ limit: String(pageSize) });
  if (userIds.length) params.set('authorId', userIds.join(','));
  if (taskIds.length) params.set('taskId', taskIds.join(','));
  if (cursor) params.set('cursor', cursor);
  if (search) params.set('keyword', search);

  const res = await fetch(`/api/v2/comments/options?${params}`);
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
 * Fetch comments by IDs (hydration)
 */
async function fetchCommentsByIds(ids: Array<string | number>): Promise<Comment[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/v2/comments/options?ids=${ids.join(',')}`);
  const data = await res.json();
  return data.data || [];
}

/**
 * Load saved selections from API
 */
async function loadSelections(): Promise<Selections | null> {
  const res = await fetch('/api/selections?page=x-select-demo');
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
      page: 'x-select-demo',
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
// Static Options - Small datasets with metadata
// ============================================================================

const priorityOptions: StaticOption<{ level: number }>[] = [
  { label: 'Critical', value: 'critical', color: '#f5222d', description: 'Urgent attention required', meta: { level: 4 } },
  { label: 'High', value: 'high', color: '#fa8c16', description: 'Important task', meta: { level: 3 } },
  { label: 'Medium', value: 'medium', color: '#1890ff', description: 'Normal priority', meta: { level: 2 } },
  { label: 'Low', value: 'low', color: '#52c41a', description: 'Can wait', meta: { level: 1 } },
];

const statusOptions: StaticOption[] = [
  { label: 'Active', value: 'active', color: 'green', description: 'Currently active' },
  { label: 'Pending', value: 'pending', color: 'orange', description: 'Waiting for action' },
  { label: 'Completed', value: 'completed', color: 'blue', description: 'Task finished' },
  { label: 'Cancelled', value: 'cancelled', color: 'red', description: 'Task cancelled' },
];

const categoryOptions: StaticOption[] = [
  { label: 'Bug', value: 'bug', color: '#f5222d', group: 'Issues' },
  { label: 'Feature', value: 'feature', color: '#1890ff', group: 'Issues' },
  { label: 'Improvement', value: 'improvement', color: '#52c41a', group: 'Issues' },
  { label: 'Documentation', value: 'docs', color: '#722ed1', group: 'Other' },
  { label: 'Testing', value: 'testing', color: '#13c2c2', group: 'Other' },
];

// Sub-status options - depends on status (parentValue = status value)
const subStatusOptions: StaticOption[] = [
  // Active sub-statuses
  { label: 'In Progress', value: 'in_progress', color: 'green', parentValue: 'active' },
  { label: 'Under Review', value: 'under_review', color: 'cyan', parentValue: 'active' },
  { label: 'On Hold', value: 'on_hold', color: 'orange', parentValue: 'active' },
  // Pending sub-statuses
  { label: 'Awaiting Approval', value: 'awaiting_approval', color: 'gold', parentValue: 'pending' },
  { label: 'Scheduled', value: 'scheduled', color: 'purple', parentValue: 'pending' },
  { label: 'Blocked', value: 'blocked', color: 'red', parentValue: 'pending' },
  // Completed sub-statuses
  { label: 'Verified', value: 'verified', color: 'blue', parentValue: 'completed' },
  { label: 'Deployed', value: 'deployed', color: 'geekblue', parentValue: 'completed' },
  { label: 'Archived', value: 'archived', color: 'default', parentValue: 'completed' },
  // Cancelled sub-statuses
  { label: 'Rejected', value: 'rejected', color: 'red', parentValue: 'cancelled' },
  { label: 'Obsolete', value: 'obsolete', color: 'default', parentValue: 'cancelled' },
  { label: 'Duplicate', value: 'duplicate', color: 'volcano', parentValue: 'cancelled' },
];

// ============================================================================
// Field Configs
// ============================================================================

const fieldConfigs: FieldConfig[] = [
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
    name: 'commentIds',
    label: 'Comments',
    placeholder: 'Select comments...',
    mode: 'multiple',
    dependsOn: ['userIds', 'taskIds'],
  },
  // Static dependent fields
  {
    name: 'status',
    label: 'Status',
    placeholder: 'Select status...',
  },
  {
    name: 'subStatus',
    label: 'Sub Status',
    placeholder: 'Select sub status...',
    dependsOn: 'status',
  },
];

// ============================================================================
// Main Demo Component
// ============================================================================

export function XSelectDemo() {
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
  const adapter: FormAdapter = useMemo(
    () => ({
      onFieldChange: (name, value) => {
        console.log({name, value});
        form.setFieldValue(name, value)
      },
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
      <Title level={4}>XSelect Demo - Error Recovery UI</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        User → Project → Task → Comment cascading selects with infinite scroll.
        Comment depends on BOTH Users AND Tasks (multiple parent dependencies).
      </Text>

      {/* Error Simulation Info */}
      <div style={{
        padding: '12px 16px',
        marginBottom: 24,
        backgroundColor: '#e6f4ff',
        border: '1px solid #91caff',
        borderRadius: 6,
        fontSize: 13,
      }}>
        <strong>Error Simulation Active:</strong> The first 2 API calls for Users will fail.
        <br />
        Click <strong>Retry</strong> button twice to recover. After that, API will work normally.
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Console commands: <code>window.toggleXSelectError()</code> to toggle,{' '}
          <code>window.resetXSelectError()</code> to reset error count
        </Text>
      </div>

      <XSelectErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        <XSelectProvider
          configs={fieldConfigs}
          adapter={adapter}
          initialValues={savedSelections || {}}
        >
          <Form form={form} layout="vertical">
          {/* User Select - Infinite with Error Recovery UI */}
          <Form.Item name="userIds" label="Users (with Error Recovery UI)">
            <XSelect.Dependent name="userIds">
              <XSelect.Infinite
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
                {({ value, onChange, options, loading, error, isRetrying, retry, onScroll, onOpenChange, onSearch }) => (
                  <div>
                    {error && (
                      <ErrorDisplay
                        error={error}
                        onRetry={retry}
                        isRetrying={isRetrying}
                        style={{ marginBottom: 8 }}
                      />
                    )}
                    <Select
                      mode="multiple"
                      value={value as number[]}
                      onChange={onChange}
                      options={options}
                      loading={loading}
                      placeholder="Select users..."
                      style={{ width: '100%' }}
                      onPopupScroll={onScroll}
                      onDropdownVisibleChange={onOpenChange}
                      showSearch
                      onSearch={onSearch}
                      filterOption={false}
                      allowClear
                      status={error ? 'error' : undefined}
                    />
                  </div>
                )}
              </XSelect.Infinite>
            </XSelect.Dependent>
          </Form.Item>

          {/* Project Select - Dependent + Infinite */}
          <Form.Item name="projectIds" label="Projects">
            <XSelect.Dependent name="projectIds">
              <XSelect.Infinite
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
              </XSelect.Infinite>
            </XSelect.Dependent>
          </Form.Item>

          {/* Task Select - Dependent + Infinite */}
          <Form.Item name="taskIds" label="Tasks">
            <XSelect.Dependent name="taskIds">
              <XSelect.Infinite
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
              </XSelect.Infinite>
            </XSelect.Dependent>
          </Form.Item>

          {/* Comment Select - Depends on userIds AND taskIds */}
          <Form.Item name="commentIds" label="Comments (depends on Users + Tasks)">
            <XSelect.Dependent name="commentIds">
              <XSelect.Infinite
                queryKey="comments"
                fetchList={fetchComments}
                fetchByIds={fetchCommentsByIds}
                pageSize={10}
                getItemId={(item) => (item as unknown as Comment).id}
                getItemLabel={(item) => {
                  const comment = item as unknown as Comment;
                  const authorName = comment.author?.name || `User ${comment.authorId}`;
                  const taskTitle = comment.task?.title || `Task ${comment.taskId}`;
                  const contentPreview = comment.content.length > 30
                    ? `${comment.content.slice(0, 30)}...`
                    : comment.content;
                  return `${contentPreview} (by ${authorName} on ${taskTitle})`;
                }}
                getItemParentValue={(item) => {
                  const comment = item as unknown as Comment;
                  return { userIds: [comment.authorId], taskIds: [comment.taskId] };
                }}
              >
                <Select
                  mode="multiple"
                  placeholder="Select comments..."
                  style={{ width: '100%' }}
                />
              </XSelect.Infinite>
            </XSelect.Dependent>
          </Form.Item>

          {/* Filter Select - Infinite only (no dependency) */}
          <Form.Item name="filterIds" label="Filters">
            <XSelect.Infinite
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
            </XSelect.Infinite>
          </Form.Item>

          {/* Priority Select - Static with metadata */}
          <Form.Item name="priority" label="Priority (Static with metadata)">
            <XSelect.Static options={priorityOptions}>
              {({ options, getOption, onChange, value }) => (
                <Select
                  value={value}
                  onChange={onChange}
                  options={options}
                  placeholder="Select priority..."
                  style={{ width: '100%' }}
                  allowClear
                  tagRender={({ value: tagValue, closable, onClose }) => {
                    const opt = getOption(tagValue as string);
                    return (
                      <Tag
                        color={opt?.color}
                        closable={closable}
                        onClose={onClose}
                        style={{ marginRight: 3 }}
                      >
                        {opt?.label}
                      </Tag>
                    );
                  }}
                  optionRender={(option) => {
                    const opt = getOption(option.value as string);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: opt?.color,
                          }}
                        />
                        <span>{opt?.label}</span>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {opt?.description}
                        </span>
                      </div>
                    );
                  }}
                />
              )}
            </XSelect.Static>
          </Form.Item>

          {/* Status Select - Static simple (parent of subStatus) */}
          <Form.Item name="status" label="Status (Static simple)">
            <XSelect.Dependent name="status">
              <XSelect.Static options={statusOptions}>
                <Select
                  placeholder="Select status..."
                  style={{ width: '100%' }}
                  allowClear
                />
              </XSelect.Static>
            </XSelect.Dependent>
          </Form.Item>

          {/* Sub Status Select - Static with dependency on status */}
          <Form.Item name="subStatus" label="Sub Status (depends on Status)">
            <XSelect.Dependent name="subStatus">
              <XSelect.Static options={subStatusOptions}>
                {({ options, getOption, onChange, value, disabled }) => (
                  <Select
                    value={value}
                    onChange={onChange}
                    options={options}
                    disabled={disabled}
                    placeholder="Select sub status..."
                    style={{ width: '100%' }}
                    allowClear
                    tagRender={({ value: tagValue, closable, onClose }) => {
                      const opt = getOption(tagValue as string);
                      return (
                        <Tag
                          color={opt?.color}
                          closable={closable}
                          onClose={onClose}
                          style={{ marginRight: 3 }}
                        >
                          {opt?.label}
                        </Tag>
                      );
                    }}
                  />
                )}
              </XSelect.Static>
            </XSelect.Dependent>
          </Form.Item>

          {/* Category Select - Static multiple */}
          <Form.Item name="categories" label="Categories (Static multiple)">
            <XSelect.Static options={categoryOptions}>
              {({ options, getOption, onChange, value }) => (
                <Select
                  mode="multiple"
                  value={value}
                  onChange={onChange}
                  options={options}
                  placeholder="Select categories..."
                  style={{ width: '100%' }}
                  allowClear
                  tagRender={({ value: tagValue, closable, onClose }) => {
                    const opt = getOption(tagValue as string);
                    return (
                      <Tag
                        color={opt?.color}
                        closable={closable}
                        onClose={onClose}
                        style={{ marginRight: 3 }}
                      >
                        {opt?.label}
                      </Tag>
                    );
                  }}
                />
              )}
            </XSelect.Static>
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
        </XSelectProvider>
      </XSelectErrorBoundary>

      {/* Debug Info */}
      <div style={{ marginTop: 24 }}>
        <Text type="secondary">
          Saved selections: {JSON.stringify(savedSelections || {})}
        </Text>
      </div>
    </Card>
  );
}

export default XSelectDemo;