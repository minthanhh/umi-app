import UserSelect from '@/components/Select/UserSelect';
import { normalizeSort } from '@/utils/normalize';
import { PlusOutlined } from '@ant-design/icons';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation } from '@umijs/max';
import { Avatar, Button, message } from 'antd';
import { SortOrder } from 'antd/es/table/interface';
import { User } from 'generated/prisma/client';
import { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const requestUsers = async (
  params: {
    current?: number;
    pageSize?: number;
  },
  sort?: Record<string, SortOrder>,
) => {
  const { current, pageSize } = params;
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current,
      pageSize,
      sorter: normalizeSort(sort),
    }),
  });
  if (!res.ok) {
    message.error('Failed to fetch users');
    return { data: [], total: 0, success: false };
  }
  return res.json();
};

const createUser = async (user: Partial<User>) => {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    throw new Error('Failed to create user');
  }
  return res.json();
};

const updateUser = async (user: Partial<User>) => {
  const res = await fetch(`/api/users?id=${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    throw new Error('Failed to update user');
  }
  return res.json();
};

const deleteUser = async (id: number) => {
  const res = await fetch(`/api/users?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete user');
  }
};

const HomePage: React.FC = () => {
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<User>();

  const mutationConfig = (successMessage: string) => ({
    onSuccess: () => {
      actionRef.current?.reload();
      message.success(successMessage);
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    ...mutationConfig('User created successfully'),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    ...mutationConfig('User updated successfully'),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    ...mutationConfig('User deleted successfully'),
  });

  const handleAdd = async (fields: Partial<User>) => {
    await createMutation.mutateAsync(fields);
    handleModalOpen(false);
  };

  const handleUpdate = async (fields: Partial<User>) => {
    await updateMutation.mutateAsync({ ...currentRow, ...fields });
    handleUpdateModalOpen(false);
    setCurrentRow(undefined);
  };

  const handleRemove = async (record: User) => {
    await deleteMutation.mutateAsync(record.id);
  };

  const columns: ProColumns<User>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      tip: 'The name of the user',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      sorter: true,
      hideInForm: true,
    },
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      sorter: true,
      hideInForm: true,
      render: (avatar, record) => {
        return <Avatar src={avatar as string} alt={record.name} />;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      sorter: true,
      hideInForm: true,
      valueType: 'dateTime',
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      sorter: true,
      hideInForm: true,
      valueType: 'dateTime',
    },
    {
      title: 'Actions',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="config"
          onClick={() => {
            handleUpdateModalOpen(true);
            setCurrentRow(record);
          }}
        >
          Edit
        </a>,
        <a
          key="delete"
          onClick={async () => {
            await handleRemove(record);
          }}
        >
          Delete
        </a>,
      ],
    },
  ];

  const jobDetail = {
    userIds: [14, 2],
  };

  const [userIds, setUserIds] = useState([14]);

  const handleSetUserIds = (value: number[]) => {
    setUserIds(value);
  }


  return (
    <PageContainer>
      <ProTable<User>
        headerTitle="Users"
        tableStyle={{
          height: 657,
        }}
        pagination={{
          pageSize: 10,
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined /> Create
          </Button>,
        ]}
        request={(params, sort) => requestUsers(params, sort)}
        columns={columns}
      />

      <CreateForm
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={handleAdd}
      />

      <UpdateForm
        open={updateModalOpen}
        onOpenChange={handleUpdateModalOpen}
        onFinish={handleUpdate}
        initialValues={currentRow}
      />

      <UserSelect value={userIds} onChange={handleSetUserIds} />
    </PageContainer>
  );
};

export default HomePage;
