import {
  ArrowLeftOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  history,
  useMutation,
  useParams,
  useQuery,
  useQueryClient,
} from '@umijs/max';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import React, { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: User;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  creator: User;
  assignee?: User;
  comments: Comment[];
}

interface ProjectMember {
  id: number;
  role: string;
  joinedAt: string;
  user: User;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  owner: User;
  members: ProjectMember[];
  tasks: Task[];
}

interface TaskFormValues {
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: number;
}

const statusColors: Record<string, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'warning',
  done: 'success',
};

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [form] = Form.useForm<TaskFormValues>();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      const result = await response.json();
      return result.data as Project;
    },
    enabled: !!id,
  });

  const { data: users } = useQuery({
    queryKey: ['users-select'],
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

  const createTaskMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          projectId: id,
          creatorId: project?.owner.id,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      message.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      handleCloseTaskModal();
    },
    onError: () => {
      message.error('Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      values,
    }: {
      taskId: number;
      values: Partial<TaskFormValues>;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      return response.json();
    },
    onSuccess: () => {
      message.success('Task updated successfully');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      handleCloseTaskModal();
    },
    onError: () => {
      message.error('Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      message.success('Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: () => {
      message.error('Failed to delete task');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({
      taskId,
      content,
    }: {
      taskId: number;
      content: string;
    }) => {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          taskId,
          authorId: project?.owner.id,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      message.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setCommentContent('');
    },
    onError: () => {
      message.error('Failed to add comment');
    },
  });

  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee?.id,
      });
    } else {
      setEditingTask(null);
      form.resetFields();
    }
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    form.resetFields();
  };

  const handleSubmitTask = async () => {
    const values = await form.validateFields();
    if (editingTask) {
      updateTaskMutation.mutate({ taskId: editingTask.id, values });
    } else {
      createTaskMutation.mutate(values);
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const tasksByStatus = {
    todo: project.tasks.filter((t) => t.status === 'todo'),
    in_progress: project.tasks.filter((t) => t.status === 'in_progress'),
    review: project.tasks.filter((t) => t.status === 'review'),
    done: project.tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => history.push('/projects')}
        className="mb-4 p-0"
      >
        Back to Projects
      </Button>

      <Card className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
            <p className="text-gray-500">
              {project.description || 'No description'}
            </p>
          </div>
          <Tag color={statusColors[project.status] || 'default'}>
            {project.status}
          </Tag>
        </div>

        <Divider />

        <Descriptions column={3}>
          <Descriptions.Item label="Owner">
            <Space>
              <Avatar src={project.owner.avatar} size="small">
                {project.owner.name.charAt(0)}
              </Avatar>
              {project.owner.name}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(project.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Members">
            <Avatar.Group maxCount={5}>
              {project.members.map((m) => (
                <Tooltip key={m.id} title={`${m.user.name} (${m.role})`}>
                  <Avatar src={m.user.avatar}>{m.user.name.charAt(0)}</Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold m-0">
          Tasks ({project.tasks.length})
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenTaskModal()}
        >
          Add Task
        </Button>
      </div>

      <Row gutter={16}>
        {Object.entries(tasksByStatus).map(([status, tasks]) => (
          <Col xs={24} sm={12} lg={6} key={status}>
            <Card
              title={
                <Badge
                  status={
                    statusColors[status] as
                      | 'default'
                      | 'processing'
                      | 'success'
                      | 'warning'
                  }
                  text={status.replace('_', ' ').toUpperCase()}
                  className="font-medium"
                />
              }
              className="h-full"
              styles={{ body: { padding: '12px' } }}
            >
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    size="small"
                    hoverable
                    className="cursor-pointer"
                    onClick={() => handleViewTask(task)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{task.title}</span>
                      <Tag
                        color={priorityColors[task.priority]}
                        className="text-xs"
                      >
                        {task.priority}
                      </Tag>
                    </div>
                    <div className="flex justify-between items-center">
                      {task.assignee ? (
                        <Tooltip title={task.assignee.name}>
                          <Avatar src={task.assignee.avatar} size="small">
                            {task.assignee.name.charAt(0)}
                          </Avatar>
                        </Tooltip>
                      ) : (
                        <Avatar size="small" icon={<UserOutlined />} />
                      )}
                      {(task.comments?.length ?? 0) > 0 && (
                        <Space size={4} className="text-gray-400 text-xs">
                          <CommentOutlined />
                          {task.comments.length}
                        </Space>
                      )}
                    </div>
                  </Card>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center text-gray-400 py-4">No tasks</div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Task Modal */}
      <Modal
        title={editingTask ? 'Edit Task' : 'New Task'}
        open={isTaskModalOpen}
        onOk={handleSubmitTask}
        onCancel={handleCloseTaskModal}
        confirmLoading={
          createTaskMutation.isPending || updateTaskMutation.isPending
        }
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter task title' }]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue="todo">
                <Select>
                  <Select.Option value="todo">To Do</Select.Option>
                  <Select.Option value="in_progress">In Progress</Select.Option>
                  <Select.Option value="review">Review</Select.Option>
                  <Select.Option value="done">Done</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" initialValue="medium">
                <Select>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="urgent">Urgent</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="assigneeId" label="Assignee">
            <Select placeholder="Select assignee" allowClear>
              {users?.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  <Space>
                    <Avatar src={user.avatar} size="small">
                      {user.name.charAt(0)}
                    </Avatar>
                    {user.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Task Detail Drawer */}
      <Drawer
        title={selectedTask?.title}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => handleOpenTaskModal(selectedTask!)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete task"
              description="Are you sure you want to delete this task?"
              onConfirm={() => {
                deleteTaskMutation.mutate(selectedTask!.id);
                setIsDrawerOpen(false);
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        }
      >
        {selectedTask && (
          <>
            <Descriptions column={1} className="mb-4">
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedTask.status]}>
                  {selectedTask.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={priorityColors[selectedTask.priority]}>
                  {selectedTask.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Assignee">
                {selectedTask.assignee ? (
                  <Space>
                    <Avatar src={selectedTask.assignee.avatar} size="small">
                      {selectedTask.assignee.name.charAt(0)}
                    </Avatar>
                    {selectedTask.assignee.name}
                  </Space>
                ) : (
                  'Unassigned'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(selectedTask.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {selectedTask.description && (
              <>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600 mb-4">{selectedTask.description}</p>
              </>
            )}

            <Divider />

            <h4 className="font-medium mb-4">
              Comments ({selectedTask.comments?.length ?? 0})
            </h4>

            <List
              dataSource={selectedTask.comments ?? []}
              locale={{ emptyText: 'No comments yet' }}
              renderItem={(comment) => (
                <List.Item className="!px-0">
                  <List.Item.Meta
                    avatar={
                      <Avatar src={comment.author.avatar}>
                        {comment.author.name.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <span>{comment.author.name}</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </Space>
                    }
                    description={comment.content}
                  />
                </List.Item>
              )}
            />

            <div className="mt-4">
              <Input.TextArea
                rows={2}
                placeholder="Add a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />
              <Button
                type="primary"
                className="mt-2"
                disabled={!commentContent.trim()}
                loading={addCommentMutation.isPending}
                onClick={() =>
                  addCommentMutation.mutate({
                    taskId: selectedTask.id,
                    content: commentContent,
                  })
                }
              >
                Add Comment
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default ProjectDetailPage;
