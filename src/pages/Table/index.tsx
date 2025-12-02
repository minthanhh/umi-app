import {
  DeleteOutlined,
  SaveOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  owner: User;
  _count: {
    tasks: number;
    members: number;
  };
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  assignee?: User;
  creator: User;
  _count?: {
    comments: number;
  };
}

interface FilterValues {
  userId: number | null;
  projectId: number | null;
}

interface SavedFilter {
  id: number;
  name: string;
  page: string;
  filters: FilterValues;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Constants
// ============================================================================

const PAGE_ID = 'table-dependent-selects';

const statusColors: Record<string, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'warning',
  done: 'success',
  active: 'green',
  completed: 'blue',
  archived: 'default',
};

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

// ============================================================================
// Component
// ============================================================================

const DependentSelectsPage: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [pendingProjectId, setPendingProjectId] = useState<number | null>(null); // For loading from saved filter
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isDefaultFilter, setIsDefaultFilter] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: 1, pageSize: 100 }),
      });
      const result = await response.json();
      return result.data as User[];
    },
  });

  // Fetch saved filters for this page
  const { data: savedFiltersRaw, isLoading: isLoadingSavedFilters } = useQuery({
    queryKey: ['saved-filters', PAGE_ID],
    queryFn: async () => {
      const response = await fetch(`/api/filters?page=${PAGE_ID}`);
      const result = await response.json();
      return result.data;
    },
  });

  // Ensure savedFilters is always an array
  const savedFilters = useMemo(() => {
    if (!savedFiltersRaw) return [];
    if (Array.isArray(savedFiltersRaw)) return savedFiltersRaw as SavedFilter[];
    // If it's a single object, wrap in array
    return [savedFiltersRaw] as SavedFilter[];
  }, [savedFiltersRaw]);

  // Load default filter on mount - wait for both users AND savedFilters to be ready
  useEffect(() => {
    // Only initialize once both users and savedFilters have loaded
    if (
      !isInitialized &&
      !isLoadingUsers &&
      !isLoadingSavedFilters &&
      users &&
      users.length > 0
    ) {
      const defaultFilter = savedFilters.find((f) => f.isDefault);
      if (defaultFilter?.filters?.userId) {
        // Verify the user exists in our loaded users
        const userExists = users.some(
          (u) => u.id === defaultFilter.filters.userId,
        );
        if (userExists) {
          setSelectedUserId(defaultFilter.filters.userId);
          // Store projectId as pending - will be applied after projects load
          setPendingProjectId(defaultFilter.filters.projectId);
          message.info(`Loaded default filter: "${defaultFilter.name}"`);
        }
      }
      setIsInitialized(true);
    }
  }, [
    savedFilters,
    users,
    isLoadingUsers,
    isLoadingSavedFilters,
    isInitialized,
  ]);

  // Fetch projects for selected user
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects-by-user', selectedUserId],
    queryFn: async () => {
      const response = await fetch(`/api/projects?ownerId=${selectedUserId}`);
      const result = await response.json();
      return result.data as Project[];
    },
    enabled: !!selectedUserId,
  });

  // Apply pending projectId once projects are loaded (not loading anymore)
  useEffect(() => {
    // Only apply when we have a pending project and projects have finished loading
    if (pendingProjectId && !isLoadingProjects && projects) {
      // Check if the pending project exists in the loaded projects
      const projectExists = projects.some((p) => p.id === pendingProjectId);
      if (projectExists) {
        setSelectedProjectId(pendingProjectId);
      }
      setPendingProjectId(null); // Clear pending regardless
    }
  }, [projects, pendingProjectId, isLoadingProjects]);

  // Fetch tasks for selected project
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks-by-project', selectedProjectId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?projectId=${selectedProjectId}`);
      const result = await response.json();
      return result.data as Task[];
    },
    enabled: !!selectedProjectId,
  });

  // Save filter mutation
  const saveFilterMutation = useMutation({
    mutationFn: async ({
      name,
      filters,
      isDefault,
    }: {
      name: string;
      filters: FilterValues;
      isDefault: boolean;
    }) => {
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          page: PAGE_ID,
          filters,
          isDefault,
        }),
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      message.success(`Filter "${variables.name}" saved successfully`);
      queryClient.invalidateQueries({ queryKey: ['saved-filters', PAGE_ID] });
      setIsSaveModalOpen(false);
      setFilterName('');
      setIsDefaultFilter(false);
    },
    onError: () => {
      message.error('Failed to save filter');
    },
  });

  // Delete filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/filters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, page: PAGE_ID }),
      });
      return response;
    },
    onSuccess: () => {
      message.success('Filter deleted');
      queryClient.invalidateQueries({ queryKey: ['saved-filters', PAGE_ID] });
    },
    onError: () => {
      message.error('Failed to delete filter');
    },
  });

  // Set default filter mutation
  const setDefaultFilterMutation = useMutation({
    mutationFn: async (filter: SavedFilter) => {
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: filter.name,
          page: PAGE_ID,
          filters: filter.filters,
          isDefault: true,
        }),
      });
      return response.json();
    },
    onSuccess: (_, filter) => {
      message.success(`"${filter.name}" set as default filter`);
      queryClient.invalidateQueries({ queryKey: ['saved-filters', PAGE_ID] });
    },
    onError: () => {
      message.error('Failed to set default filter');
    },
  });

  // Get selected user details
  const selectedUser = useMemo(
    () => users?.find((u) => u.id === selectedUserId),
    [users, selectedUserId],
  );

  // Get selected project details
  const selectedProject = useMemo(
    () => projects?.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  // Handle user selection change
  const handleUserChange = (userId: number | null) => {
    setSelectedUserId(userId);
    setSelectedProjectId(null);
  };

  // Handle project selection change
  const handleProjectChange = (projectId: number | null) => {
    setSelectedProjectId(projectId);
  };

  // Load a saved filter
  const handleLoadFilter = (filter: SavedFilter) => {
    // If user is changing, reset project and set it as pending
    if (filter.filters.userId !== selectedUserId) {
      setSelectedUserId(filter.filters.userId);
      setSelectedProjectId(null);
      setPendingProjectId(filter.filters.projectId);
    } else {
      // Same user, can directly set project
      setSelectedProjectId(filter.filters.projectId);
    }
    message.success(`Loaded filter: "${filter.name}"`);
  };

  // Save current filter
  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      message.warning('Please enter a filter name');
      return;
    }
    saveFilterMutation.mutate({
      name: filterName.trim(),
      filters: { userId: selectedUserId, projectId: selectedProjectId },
      isDefault: isDefaultFilter,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedUserId(null);
    setSelectedProjectId(null);
  };

  // Task table columns
  const taskColumns: ColumnsType<Task> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priorityColors[priority]}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee: User | undefined) =>
        assignee ? (
          <Space>
            <Avatar src={assignee.avatar} size="small">
              {assignee.name.charAt(0)}
            </Avatar>
            {assignee.name}
          </Space>
        ) : (
          <span className="text-gray-400">Unassigned</span>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            Dependent Selects with Saved Filters
          </h2>
          <p className="text-gray-500 text-sm m-0">
            Select User → Project → View Tasks. Save your filter selections to
            reload later.
          </p>
        </div>
        <Space>
          <Button onClick={handleClearFilters}>Clear Filters</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => setIsSaveModalOpen(true)}
            disabled={!selectedUserId && !selectedProjectId}
          >
            Save Filter
          </Button>
        </Space>
      </div>

      {/* Saved Filters */}
      {savedFilters && savedFilters.length > 0 && (
        <Card size="small" className="mb-4" title="Saved Filters">
          <Space wrap>
            {savedFilters.map((filter) => (
              <Tag
                key={filter.id}
                className="cursor-pointer py-1 px-3"
                color={filter.isDefault ? 'blue' : 'default'}
                onClick={() => handleLoadFilter(filter)}
              >
                <Space>
                  {filter.isDefault ? (
                    <StarFilled className="text-yellow-500" />
                  ) : (
                    <Tooltip title="Set as default">
                      <StarOutlined
                        className="hover:text-yellow-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultFilterMutation.mutate(filter);
                        }}
                      />
                    </Tooltip>
                  )}
                  <span>{filter.name}</span>
                  <Popconfirm
                    title="Delete this filter?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      deleteFilterMutation.mutate(filter.name);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    <DeleteOutlined
                      className="text-gray-400 hover:text-red-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </Space>
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* Select Controls */}
      <Card className="mb-6">
        <Row gutter={24}>
          <Col xs={24} sm={8}>
            <div className="mb-2 font-medium">1. Select User</div>
            <Select
              placeholder="Select a user..."
              style={{ width: '100%' }}
              loading={isLoadingUsers}
              allowClear
              value={selectedUserId}
              onChange={handleUserChange}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={users?.map((user) => ({
                value: user.id,
                label: user.name,
              }))}
              optionRender={(option) => {
                const user = users?.find((u) => u.id === option.value);
                return (
                  <Space>
                    <Avatar src={user?.avatar} size="small">
                      {user?.name.charAt(0)}
                    </Avatar>
                    <div>
                      <div>{user?.name}</div>
                      <div className="text-xs text-gray-400">{user?.email}</div>
                    </div>
                  </Space>
                );
              }}
            />
          </Col>

          <Col xs={24} sm={8}>
            <div className="mb-2 font-medium">2. Select Project</div>
            <Select
              placeholder={
                selectedUserId ? 'Select a project...' : 'Select a user first'
              }
              style={{ width: '100%' }}
              loading={isLoadingProjects}
              allowClear
              disabled={!selectedUserId}
              value={selectedProjectId}
              onChange={handleProjectChange}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={projects?.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              optionRender={(option) => {
                const project = projects?.find((p) => p.id === option.value);
                return (
                  <div>
                    <div className="flex justify-between items-center">
                      <span>{project?.name}</span>
                      <Tag
                        color={statusColors[project?.status || 'active']}
                        className="ml-2"
                      >
                        {project?.status}
                      </Tag>
                    </div>
                    <div className="text-xs text-gray-400">
                      {project?._count.tasks} tasks • {project?._count.members}{' '}
                      members
                    </div>
                  </div>
                );
              }}
              notFoundContent={
                selectedUserId && !isLoadingProjects ? (
                  <Empty description="No projects found for this user" />
                ) : null
              }
            />
          </Col>

          <Col xs={24} sm={8}>
            <div className="mb-2 font-medium">3. View Tasks</div>
            <div className="h-8 flex items-center">
              {selectedProjectId ? (
                <Tag color="blue">{tasks?.length ?? 0} tasks loaded</Tag>
              ) : (
                <span className="text-gray-400">
                  Select a project to view tasks
                </span>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Selected Info Cards */}
      <Row gutter={16} className="mb-6">
        {selectedUser && (
          <Col xs={24} md={12}>
            <Card title="Selected User" size="small">
              <Space>
                <Avatar src={selectedUser.avatar} size="large">
                  {selectedUser.name.charAt(0)}
                </Avatar>
                <div>
                  <div className="font-semibold">{selectedUser.name}</div>
                  <div className="text-gray-500 text-sm">
                    {selectedUser.email}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        )}

        {selectedProject && (
          <Col xs={24} md={12}>
            <Card title="Selected Project" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Name">
                  {selectedProject.name}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={statusColors[selectedProject.status]}>
                    {selectedProject.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tasks">
                  {selectedProject._count.tasks}
                </Descriptions.Item>
                <Descriptions.Item label="Members">
                  {selectedProject._count.members}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        )}
      </Row>

      {/* Tasks Table */}
      <Card title="Tasks">
        {!selectedProjectId ? (
          <Empty description="Select a user and project to view tasks" />
        ) : isLoadingTasks ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={taskColumns}
            dataSource={tasks}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: <Empty description="No tasks in this project" />,
            }}
          />
        )}
      </Card>

      {/* Save Filter Modal */}
      <Modal
        title="Save Filter"
        open={isSaveModalOpen}
        onOk={handleSaveFilter}
        onCancel={() => {
          setIsSaveModalOpen(false);
          setFilterName('');
          setIsDefaultFilter(false);
        }}
        confirmLoading={saveFilterMutation.isPending}
      >
        <div className="py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Filter Name
            </label>
            <Input
              placeholder="Enter a name for this filter"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onPressEnter={handleSaveFilter}
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefaultFilter}
                onChange={(e) => setIsDefaultFilter(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                Set as default filter (auto-load on page visit)
              </span>
            </label>
          </div>
          <Divider />
          <div className="text-sm text-gray-500">
            <div className="font-medium mb-2">Current Filter Values:</div>
            <ul className="list-disc list-inside">
              <li>User: {selectedUser?.name || 'None'}</li>
              <li>Project: {selectedProject?.name || 'None'}</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DependentSelectsPage;
