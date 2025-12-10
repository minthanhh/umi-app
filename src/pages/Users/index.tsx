import {
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation } from '@umijs/max';
import {
  Avatar,
  Button,
  message,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';

const { Text } = Typography;

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  _count?: {
    ownedProjects: number;
    assignedTasks: number;
  };
}

interface UserFormValues {
  name: string;
  email: string;
}

const UsersPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const createMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, action: 'create' }),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      message.success('User created successfully');
      actionRef.current?.reload();
    },
    onError: () => {
      message.error('Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: UserFormValues;
    }) => {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      message.success('User updated successfully');
      actionRef.current?.reload();
    },
    onError: () => {
      message.error('Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response;
    },
    onSuccess: () => {
      message.success('User deleted successfully');
      actionRef.current?.reload();
    },
    onError: () => {
      message.error('Failed to delete user');
    },
  });

  const handleOpenModal = (user?: User) => {
    setEditingUser(user || null);
    setModalOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setModalOpen(false);
    setEditingUser(null);
    return true;
  };

  return (
    <PageContainer
      header={{
        title: 'Users Management',
        subTitle: 'Manage all users in your system',
      }}
    >
      <ProTable<User>
        actionRef={actionRef}
        rowKey="id"
        headerTitle="Users List"
        cardBordered
        request={async (params) => {
          const { current = 1, pageSize = 10, name, email } = params;
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              current,
              pageSize,
              name,
              email,
              sorter: { createdAt: 'desc' },
            }),
          });
          const result = await response.json();
          return {
            data: result.data,
            total: result.total,
            success: true,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [5, 10, 20, 50],
        }}
        search={{
          labelWidth: 'auto',
          filterType: 'light',
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Add User
          </Button>,
        ]}
        columns={[
          {
            title: 'User',
            dataIndex: 'name',
            key: 'user',
            width: 280,
            render: (_, record) => (
              <Space size="middle">
                <Avatar
                  src={record.avatar}
                  size={48}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: record.avatar ? undefined : '#1890ff',
                    flexShrink: 0,
                  }}
                >
                  {!record.avatar && record.name?.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 15, display: 'block' }}>
                    {record.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <MailOutlined style={{ marginRight: 4 }} />
                    {record.email}
                  </Text>
                </div>
              </Space>
            ),
          },
          {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            hideInTable: true,
          },
          {
            title: 'Projects',
            dataIndex: ['_count', 'ownedProjects'],
            key: 'projects',
            width: 120,
            search: false,
            render: (count) => (
              <Tag
                color="blue"
                style={{
                  borderRadius: 12,
                  padding: '2px 12px',
                  fontWeight: 500,
                }}
              >
                {count || 0} owned
              </Tag>
            ),
          },
          {
            title: 'Tasks',
            dataIndex: ['_count', 'assignedTasks'],
            key: 'tasks',
            width: 120,
            search: false,
            render: (count) => (
              <Tag
                color="green"
                style={{
                  borderRadius: 12,
                  padding: '2px 12px',
                  fontWeight: 500,
                }}
              >
                {count || 0} assigned
              </Tag>
            ),
          },
          {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            search: false,
            valueType: 'date',
            render: (_, record) => (
              <Text type="secondary">
                {new Date(record.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            ),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 100,
            search: false,
            render: (_, record) => (
              <Space size="small">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenModal(record)}
                  style={{ color: '#1890ff' }}
                />
                <Popconfirm
                  title="Delete User"
                  description={
                    <div>
                      Are you sure you want to delete{' '}
                      <strong>{record.name}</strong>?
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        This action cannot be undone.
                      </Text>
                    </div>
                  }
                  onConfirm={() => deleteMutation.mutate(record.id)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteMutation.isPending}
                  />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <ModalForm<UserFormValues>
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingUser(null);
        }}
        initialValues={
          editingUser
            ? { name: editingUser.name, email: editingUser.email }
            : {}
        }
        onFinish={handleSubmit}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
        submitter={{
          searchConfig: {
            submitText: editingUser ? 'Update' : 'Create',
          },
        }}
        width={480}
      >
        <ProFormText
          name="name"
          label="Full Name"
          placeholder="Enter user's full name"
          rules={[
            { required: true, message: 'Please enter name' },
            { min: 2, message: 'Name must be at least 2 characters' },
          ]}
          fieldProps={{
            prefix: <UserOutlined style={{ color: '#bfbfbf' }} />,
            size: 'large',
          }}
        />
        <ProFormText
          name="email"
          label="Email Address"
          placeholder="Enter email address"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
          fieldProps={{
            prefix: <MailOutlined style={{ color: '#bfbfbf' }} />,
            size: 'large',
          }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default UsersPage;
