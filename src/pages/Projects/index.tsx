import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ProjectOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { history, useMutation, useQuery, useQueryClient } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

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

interface CloneFormValues {
  name: string;
  ownerId: number;
  includeTasks: boolean;
  includeMembers: boolean;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Active' },
  completed: { color: 'blue', label: 'Completed' },
  archived: { color: 'default', label: 'Archived' },
};

const ProjectsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [cloningProject, setCloningProject] = useState<Project | null>(null);
  const [form] = Form.useForm<ProjectFormValues>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects?current=${currentPage}&pageSize=${pageSize}`,
      );
      const result = await response.json();
      return result as { data: Project[]; total: number };
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
      if (!response.ok) throw new Error('Failed to create project');
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
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: Partial<ProjectFormValues>;
    }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('Failed to update project');
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
      if (!response.ok) throw new Error('Failed to delete project');
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

  const cloneMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: CloneFormValues;
    }) => {
      const response = await fetch(`/api/projects/${id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('Failed to clone project');
      return response.json();
    },
    onSuccess: () => {
      message.success('Project cloned successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCloneModalOpen(false);
      setCloningProject(null);
    },
    onError: () => {
      message.error('Failed to clone project');
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

  const handleOpenCloneModal = (project: Project) => {
    setCloningProject(project);
    setCloneModalOpen(true);
  };

  const handleClone = async (values: CloneFormValues) => {
    if (!cloningProject) return false;
    await cloneMutation.mutateAsync({ id: cloningProject.id, values });
    return true;
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const projects = projectsData?.data || [];
  const total = projectsData?.total || 0;

  return (
    <PageContainer
      header={{
        title: 'Projects',
        subTitle: 'Manage your projects and track progress',
      }}
      extra={[
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          New Project
        </Button>,
      ]}
    >
      <Spin spinning={isLoading}>
        {projects.length === 0 && !isLoading ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No projects found"
            >
              <Button type="primary" onClick={() => handleOpenModal()}>
                Create First Project
              </Button>
            </Empty>
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {projects.map((project) => (
                <Col xs={24} sm={12} lg={8} key={project.id}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    actions={[
                      <Tooltip title="View Details" key="view">
                        <EyeOutlined
                          onClick={() =>
                            history.push(`/projects/${project.id}`)
                          }
                        />
                      </Tooltip>,
                      <Tooltip title="Clone Project" key="clone">
                        <CopyOutlined
                          onClick={() => handleOpenCloneModal(project)}
                          style={{ color: '#722ed1' }}
                        />
                      </Tooltip>,
                      <Tooltip title="Edit" key="edit">
                        <EditOutlined
                          onClick={() => handleOpenModal(project)}
                          style={{ color: '#1890ff' }}
                        />
                      </Tooltip>,
                      <Popconfirm
                        key="delete"
                        title="Delete Project"
                        description={
                          <div>
                            This will delete all tasks and comments.
                            <br />
                            <Text type="danger">This cannot be undone!</Text>
                          </div>
                        }
                        onConfirm={() => deleteMutation.mutate(project.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        cancelText="Cancel"
                      >
                        <DeleteOutlined style={{ color: '#ff4d4f' }} />
                      </Popconfirm>,
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <Avatar
                          src={project.owner.avatar}
                          size={48}
                          style={{
                            backgroundColor: project.owner.avatar
                              ? undefined
                              : '#1890ff',
                          }}
                        >
                          {project.owner.name.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <Text
                            strong
                            style={{
                              fontSize: 16,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {project.name}
                          </Text>
                          <Tag
                            color={statusConfig[project.status]?.color}
                            style={{ flexShrink: 0 }}
                          >
                            {statusConfig[project.status]?.label ||
                              project.status}
                          </Tag>
                        </div>
                      }
                      description={
                        <Text
                          type="secondary"
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {project.description || 'No description'}
                        </Text>
                      }
                    />
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid #f0f0f0',
                      }}
                    >
                      <Space size="large">
                        <Tooltip title="Team Members">
                          <Space size={4}>
                            <TeamOutlined style={{ color: '#1890ff' }} />
                            <Text type="secondary">
                              {project._count.members}
                            </Text>
                          </Space>
                        </Tooltip>
                        <Tooltip title="Tasks">
                          <Space size={4}>
                            <UnorderedListOutlined
                              style={{ color: '#52c41a' }}
                            />
                            <Text type="secondary">{project._count.tasks}</Text>
                          </Space>
                        </Tooltip>
                      </Space>
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Progress
                        </Text>
                        <Progress
                          percent={
                            project._count.tasks > 0
                              ? Math.floor(Math.random() * 100)
                              : 0
                          }
                          size="small"
                          status={
                            project.status === 'completed'
                              ? 'success'
                              : 'active'
                          }
                        />
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(t, range) =>
                  `${range[0]}-${range[1]} of ${t} projects`
                }
                pageSizeOptions={[6, 9, 12, 24]}
              />
            </div>
          </>
        )}
      </Spin>

      {/* Create/Edit Modal */}
      <Modal
        title={editingProject ? 'Edit Project' : 'New Project'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input
              placeholder="Enter project name"
              prefix={<ProjectOutlined style={{ color: '#bfbfbf' }} />}
              size="large"
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Enter project description"
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Form.Item
            name="ownerId"
            label="Owner"
            rules={[{ required: true, message: 'Please select an owner' }]}
          >
            <Select placeholder="Select project owner" size="large">
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
            <Select size="large">
              <Select.Option value="active">
                <Tag color="green">Active</Tag>
              </Select.Option>
              <Select.Option value="completed">
                <Tag color="blue">Completed</Tag>
              </Select.Option>
              <Select.Option value="archived">
                <Tag color="default">Archived</Tag>
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Clone Modal */}
      <ModalForm<CloneFormValues>
        title={
          <Space>
            <CopyOutlined style={{ color: '#722ed1' }} />
            Clone Project
          </Space>
        }
        open={cloneModalOpen}
        onOpenChange={(open) => {
          setCloneModalOpen(open);
          if (!open) setCloningProject(null);
        }}
        initialValues={{
          name: cloningProject ? `${cloningProject.name} (Copy)` : '',
          ownerId: cloningProject?.owner.id,
          includeTasks: true,
          includeMembers: true,
        }}
        onFinish={handleClone}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
        submitter={{
          searchConfig: {
            submitText: 'Clone Project',
          },
        }}
        width={480}
      >
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
          }}
        >
          <Text type="secondary">
            Cloning from: <Text strong>{cloningProject?.name}</Text>
          </Text>
        </div>

        <ProFormText
          name="name"
          label="New Project Name"
          placeholder="Enter new project name"
          rules={[{ required: true, message: 'Please enter project name' }]}
          fieldProps={{
            prefix: <ProjectOutlined style={{ color: '#bfbfbf' }} />,
            size: 'large',
          }}
        />

        <ProFormSelect
          name="ownerId"
          label="Project Owner"
          placeholder="Select project owner"
          rules={[{ required: true, message: 'Please select an owner' }]}
          options={users?.map((user) => ({
            label: (
              <Space>
                <Avatar src={user.avatar} size="small">
                  {user.name.charAt(0)}
                </Avatar>
                {user.name}
              </Space>
            ),
            value: user.id,
          }))}
          fieldProps={{ size: 'large' }}
        />

        <div style={{ marginTop: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            Clone Options
          </Text>
          <Form.Item name="includeTasks" valuePropName="checked" noStyle>
            <Checkbox style={{ marginBottom: 8 }}>
              <Space>
                <UnorderedListOutlined />
                Include Tasks ({cloningProject?._count.tasks || 0} tasks)
              </Space>
            </Checkbox>
          </Form.Item>
          <br />
          <Form.Item name="includeMembers" valuePropName="checked" noStyle>
            <Checkbox>
              <Space>
                <TeamOutlined />
                Include Members ({cloningProject?._count.members || 0} members)
              </Space>
            </Checkbox>
          </Form.Item>
        </div>
      </ModalForm>
    </PageContainer>
  );
};

export default ProjectsPage;
