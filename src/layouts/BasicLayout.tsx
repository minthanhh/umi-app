import {
  FormOutlined,
  HomeOutlined,
  ProjectOutlined,
  SafetyOutlined,
  TableOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, Outlet, useLocation } from '@umijs/max';
import { Layout, Menu } from 'antd';
import React, { useMemo, useState } from 'react';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: 'Home',
    path: '/home',
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: 'Users',
    path: '/users',
  },
  {
    key: 'projects',
    icon: <ProjectOutlined />,
    label: 'Projects',
    path: '/projects',
  },
  {
    key: 'access',
    icon: <SafetyOutlined />,
    label: 'Access',
    path: '/access',
  },
  {
    key: 'table',
    icon: <TableOutlined />,
    label: 'Table',
    path: '/table',
  },
  {
    key: 'dynamic',
    icon: <FormOutlined />,
    label: 'Dynamic',
    path: '/dynamic',
  },
  {
    key: 'service-worker',
    icon: <FormOutlined />,
    label: 'Service Worker',
    path: '/service-worker',
  },
  {
    key: 'formik',
    icon: <FormOutlined />,
    label: 'Formik Demo',
    path: '/formik',
  },
  {
    key: 'rhf',
    icon: <FormOutlined />,
    label: 'RHF Demo',
    path: '/rhf',
  },
  {
    key: 'dependent-field',
    icon: <FormOutlined />,
    label: 'Dependent Field',
    path: '/dependent-field',
  },
];

const BasicLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const selectedKey = useMemo(() => {
    const currentPath = location.pathname;
    const matchedItem = menuItems.find((item) =>
      currentPath.startsWith(item.path),
    );
    return matchedItem?.key || 'home';
  }, [location.pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const menuItem = menuItems.find((item) => item.key === key);
    if (menuItem) {
      history.push(menuItem.path);
    }
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="shadow-md"
        theme="light"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <span
            className={`font-bold text-xl text-blue-600 ${collapsed ? 'hidden' : ''}`}
          >
            UMI App
          </span>
          {collapsed && (
            <span className="font-bold text-xl text-blue-600">U</span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          className="border-r-0"
        />
      </Sider>
      <Layout>
        <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800 m-0">
            {menuItems.find((item) => item.key === selectedKey)?.label ||
              'Dashboard'}
          </h1>
        </Header>
        <Content className="m-4 p-6 bg-white rounded-lg shadow-sm min-h-[calc(100vh-112px)]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
