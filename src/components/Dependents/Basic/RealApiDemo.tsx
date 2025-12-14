/**
 * DependentSelect - Real API Demo
 *
 * Demo showing how to use DependentSelect with real APIs:
 * User (multiple) -> Project (multiple) -> Task (multiple)
 *
 * Features demonstrated:
 * - External options fetched from real APIs
 * - User controls data fetching
 * - Cascade delete when parent values change
 * - Multiple select at all levels
 */

import { useQuery } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Space,
  Typography,
} from 'antd';
import { useCallback, useMemo } from 'react';

import {
  DependentSelectProvider,
  FormDependentSelectField,
  useDependentField,
} from './index';
import type { FieldConfig, FormAdapter, SelectOption } from './types';

const { Title, Text } = Typography;

// ============================================================================
// API Functions
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
}

interface ProjectMember {
  userId: number;
  role: string;
  user: { id: number; name: string; avatar?: string };
}

interface Project {
  id: number;
  name: string;
  ownerId: number;
  members?: ProjectMember[];
  memberRole?: string;
}

interface Task {
  id: number;
  title: string;
  projectId: number;
  status: string;
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageSize: 100 }),
  });
  const data = await res.json();
  return data.data || [];
}

async function fetchProjectsByUserIds(userIds: number[]): Promise<Project[]> {
  if (!userIds.length) return [];

  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'by-members',
      memberIds: userIds,
      pageSize: 100,
    }),
  });
  const data = await res.json();
  return data.data || [];
}

async function fetchTasksByProjectIds(projectIds: number[]): Promise<Task[]> {
  if (!projectIds.length) return [];

  const res = await fetch('/api/tasks/by-projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectIds,
      pageSize: 100,
    }),
  });
  const data = await res.json();
  return data.data || [];
}

// ============================================================================
// Config - Only defines structure (no options)
// ============================================================================

const fieldConfigs: FieldConfig[] = [
  {
    name: 'userIds',
    label: 'Users',
    placeholder: 'Select users...',
    mode: 'multiple',
    // No options - will be provided externally
  },
  {
    name: 'projectIds',
    label: 'Projects',
    placeholder: 'Select projects...',
    mode: 'multiple',
    dependsOn: 'userIds',
    // No options - will be provided externally
  },
  {
    name: 'taskIds',
    label: 'Tasks',
    placeholder: 'Select tasks...',
    mode: 'multiple',
    dependsOn: 'projectIds',
    // No options - will be provided externally
  },
];

// ============================================================================
// Custom Select Components with Data Fetching
// ============================================================================

function UserSelect() {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const options: SelectOption[] = useMemo(
    () =>
      users.map((user) => ({
        label: `${user.name} (${user.email})`,
        value: user.id,
      })),
    [users],
  );

  return (
    <FormDependentSelectField
      name="userIds"
      label="Users"
      options={options}
      loading={isLoading}
    />
  );
}

function ProjectSelect() {
  // Get parent value from hook
  const { parentValue: userIds } = useDependentField('projectIds');

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', userIds],
    queryFn: () => fetchProjectsByUserIds((userIds as number[]) || []),
    enabled: Array.isArray(userIds) && userIds.length > 0,
  });

  const options: SelectOption[] = useMemo(
    () =>
      projects.map((project) => {
        // Get member IDs from project
        const memberIds = project.members?.map((m) => m.userId) ?? [];
        // IMPORTANT: parentValue should be an ARRAY of all member IDs
        // This allows cascade delete to work correctly when ANY member is removed
        // A project belongs to multiple users (members), not just the owner
        // If no members, fall back to ownerId
        const parentValue = memberIds.length > 0 ? memberIds : [project.ownerId];

        return {
          label: project.name,
          value: project.id,
          parentValue,
        };
      }),
    [projects],
  );

  return (
    <FormDependentSelectField
      name="projectIds"
      label="Projects"
      options={options}
      loading={isLoading}
    />
  );
}

function TaskSelect() {
  // Get parent value from hook
  const { parentValue: projectIds } = useDependentField('taskIds');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectIds],
    queryFn: () => fetchTasksByProjectIds((projectIds as number[]) || []),
    enabled: Array.isArray(projectIds) && projectIds.length > 0,
  });

  const options: SelectOption[] = useMemo(
    () =>
      tasks.map((task) => ({
        label: `${task.title} [${task.status}]`,
        value: task.id,
        // IMPORTANT: parentValue is needed for cascade delete
        parentValue: task.projectId,
      })),
    [tasks],
  );

  return (
    <FormDependentSelectField
      name="taskIds"
      label="Tasks"
      options={options}
      loading={isLoading}
    />
  );
}

// ============================================================================
// Main Demo Component
// ============================================================================

export function RealApiDemo() {
  const [form] = Form.useForm();

  // Create Ant Design Form adapter (memoized to prevent re-renders)
  const onFieldChange = useCallback(
    (name: string, value: any) => {
      console.log(`[Adapter] Setting field "${name}" to:`, value);
      form.setFieldValue(name, value);
    },
    [form],
  );

  const onFieldsChange = useCallback(
    (changedFields: Array<{ name: string; value: any }>) => {
      console.log('[Adapter] Setting multiple fields:', changedFields);
      form.setFieldsValue(
        Object.fromEntries(changedFields.map((f) => [f.name, f.value])),
      );
    },
    [form],
  );

  const adapter: FormAdapter = useMemo(
    () => ({ onFieldChange, onFieldsChange }),
    [onFieldChange, onFieldsChange],
  );

  const handleSubmit = (values: Record<string, any>) => {
    console.log('[Demo] Form submitted with values:', values);
  };

  return (
    <Card>
      <Title level={4}>Real API Demo: User → Project → Task</Title>

      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        This demo fetches data from real APIs. Select users to see their
        projects, then select projects to see their tasks. When you deselect a
        user or project, related items will be automatically removed (cascade
        delete).
      </Text>

      <DependentSelectProvider configs={fieldConfigs} adapter={adapter}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Flex vertical gap="middle">
            <UserSelect />
            <ProjectSelect />
            <TaskSelect />
          </Flex>

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit">
              Submit Form
            </Button>
            <Button onClick={() => form.resetFields()}>Reset Form</Button>
          </Space>
        </Form>

        {/* Debug: Show form values */}
        <Form.Item noStyle shouldUpdate>
          {() => (
            <Descriptions
              title="Current Form Values"
              bordered
              column={1}
              size="small"
              style={{ marginTop: 24 }}
            >
              <Descriptions.Item label="Users">
                {JSON.stringify(form.getFieldValue('userIds') || [])}
              </Descriptions.Item>
              <Descriptions.Item label="Projects">
                {JSON.stringify(form.getFieldValue('projectIds') || [])}
              </Descriptions.Item>
              <Descriptions.Item label="Tasks">
                {JSON.stringify(form.getFieldValue('taskIds') || [])}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Form.Item>
      </DependentSelectProvider>
    </Card>
  );
}

export default RealApiDemo;