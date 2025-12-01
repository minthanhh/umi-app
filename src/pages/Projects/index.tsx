import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient, history } from '@umijs/max';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
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

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  owner: User;
  _count: {
    tasks: number;
    members: number;
  };
}

interface ProjectFormValues {
  name: string;
  description?: string;
  status: string;
  ownerId: number;
}

const statusColors: Record<string, string> = {
  active: 'green',
  completed: 'blue',
  archived: 'default',
};

const ProjectsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm<ProjectFormValues>();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      const result = await response.json();
      return result.data as Project[];
    },
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

  const createMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      return response.json();
    },
    onSuccess: () => {
      message.success('Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleCloseModal();
    },
    onError: () => {
      message.error('Failed to create project');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<ProjectFormValues> }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      return response.json();
    },
    onSuccess: () => {
      message.success('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleCloseModal();
    },
    onError: () => {
      message.error('Failed to update project');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      message.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => {
      message.error('Failed to delete project');
    },
  });

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        status: project.status,
        ownerId: project.owner.id,
      });
    } else {
      setEditingProject(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold m-0">Projects</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          New Project
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {isLoading ? (
          <Col span={24}>
            <Card loading />
          </Col>
        ) : (
          projects?.map((project) => (
            <Col xs={24} sm={12} lg={8} key={project.id}>
              <Card
                hoverable
                actions={[
                  <Tooltip title="View Details" key="view">
                    <EyeOutlined onClick={() => history.push(`/projects/${project.id}`)} />
                  </Tooltip>,
                  <Tooltip title="Edit" key="edit">
                    <EditOutlined onClick={() => handleOpenModal(project)} />
                  </Tooltip>,
                  <Popconfirm
                    key="delete"
                    title="Delete project"
                    description="This will delete all tasks and comments. Continue?"
                    onConfirm={() => deleteMutation.mutate(project.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <DeleteOutlined className="text-red-500" />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <Avatar src={project.owner.avatar} size="large">
                      {project.owner.name.charAt(0)}
                    </Avatar>
                  }
                  title={
                    <div className="flex items-center justify-between">
                      <span className="truncate">{project.name}</span>
                      <Tag color={statusColors[project.status]}>{project.status}</Tag>
                    </div>
                  }
                  description={
                    <div className="text-gray-500 text-sm truncate">
                      {project.description || 'No description'}
                    </div>
                  }
                />
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Space size="large">
                    <Tooltip title="Team Members">
                      <Badge count={project._count.members} showZero color="blue">
                        <TeamOutlined className="text-lg" />
                      </Badge>
                    </Tooltip>
                    <Tooltip title="Tasks">
                      <Badge count={project._count.tasks} showZero color="green">
                        <UnorderedListOutlined className="text-lg" />
                      </Badge>
                    </Tooltip>
                  </Space>
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-1">Progress</div>
                    <Progress
                      percent={Math.floor(Math.random() * 100)}
                      size="small"
                      status={project.status === 'completed' ? 'success' : 'active'}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          ))
        )}
      </Row>

      <Modal
        title={editingProject ? 'Edit Project' : 'New Project'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter project description" />
          </Form.Item>
          <Form.Item
            name="ownerId"
            label="Owner"
            rules={[{ required: true, message: 'Please select an owner' }]}
          >
            <Select placeholder="Select project owner">
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
          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="archived">Archived</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;