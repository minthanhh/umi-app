import { useServiceWorker } from '@/hooks/useServiceWorker';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudDownloadOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  List,
  message,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function ServiceWorkerPage() {
  const {
    status,
    caches,
    isLoading,
    update,
    unregister,
    skipWaiting,
    clearCache,
    refreshCaches,
  } = useServiceWorker();

  const handleUpdate = async () => {
    message.loading({ content: 'Checking for updates...', key: 'sw-update' });
    await update();
    message.success({ content: 'Update check complete', key: 'sw-update' });
  };

  const handleUnregister = () => {
    Modal.confirm({
      title: 'Unregister Service Worker?',
      icon: <ExclamationCircleOutlined />,
      content:
        'This will disable offline functionality until you reload the page. Are you sure?',
      okText: 'Yes, Unregister',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        const success = await unregister();
        if (success) {
          message.success('Service Worker unregistered successfully');
        } else {
          message.error('Failed to unregister Service Worker');
        }
      },
    });
  };

  const handleClearCache = (cacheName?: string) => {
    Modal.confirm({
      title: cacheName ? `Clear "${cacheName}" cache?` : 'Clear all caches?',
      icon: <ExclamationCircleOutlined />,
      content: cacheName
        ? `This will remove all cached items from "${cacheName}".`
        : 'This will remove all cached data. The page may need to reload.',
      okText: 'Yes, Clear',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await clearCache(cacheName);
        message.success(
          cacheName ? `Cache "${cacheName}" cleared` : 'All caches cleared',
        );
      },
    });
  };

  const handleSkipWaiting = () => {
    skipWaiting();
    message.info('Activating new version... Page will reload.');
    setTimeout(() => window.location.reload(), 1000);
  };

  const getStatusColor = () => {
    if (!status.isSupported) return 'default';
    if (status.error) return 'error';
    if (status.isActive) return 'success';
    if (status.isInstalling) return 'processing';
    return 'warning';
  };

  const getStatusText = () => {
    if (!status.isSupported) return 'Not Supported';
    if (status.error) return 'Error';
    if (!status.isRegistered) return 'Not Registered';
    if (status.isInstalling) return 'Installing';
    if (status.isWaiting) return 'Waiting to Activate';
    if (status.isActive) return 'Active';
    return 'Unknown';
  };

  const totalCacheItems = caches.reduce((sum, c) => sum + c.count, 0);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>
          Loading Service Worker status...
        </Paragraph>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <CloudSyncOutlined style={{ marginRight: 8 }} />
        Service Worker Manager
      </Title>

      <Paragraph type="secondary">
        Manage your application&apos;s Service Worker and cache storage for
        offline functionality.
      </Paragraph>

      {!status.isSupported && (
        <Alert
          message="Service Worker Not Supported"
          description="Your browser does not support Service Workers. Please use a modern browser for offline functionality."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {status.error && (
        <Alert
          message="Service Worker Error"
          description={status.error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {status.isWaiting && (
        <Alert
          message="New Version Available"
          description="A new version of the app is ready. Click the button below to activate it."
          type="info"
          showIcon
          action={
            <Button type="primary" size="small" onClick={handleSkipWaiting}>
              Activate Now
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Status"
              value={getStatusText()}
              prefix={
                <Badge
                  status={
                    getStatusColor() as
                      | 'default'
                      | 'success'
                      | 'error'
                      | 'warning'
                      | 'processing'
                  }
                />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cache Storage"
              value={caches.length}
              suffix="caches"
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cached Items"
              value={totalCacheItems}
              suffix="items"
              prefix={<CloudDownloadOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Controller"
              value={status.controller ? 'Active' : 'None'}
              prefix={
                status.controller ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Service Worker Details"
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleUpdate}
                  disabled={!status.isRegistered}
                >
                  Check Updates
                </Button>
              </Space>
            }
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Browser Support">
                <Tag color={status.isSupported ? 'green' : 'red'}>
                  {status.isSupported ? 'Supported' : 'Not Supported'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Registration">
                <Tag color={status.isRegistered ? 'green' : 'orange'}>
                  {status.isRegistered ? 'Registered' : 'Not Registered'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="State">
                {status.isInstalling && (
                  <Tag icon={<SyncOutlined spin />} color="processing">
                    Installing
                  </Tag>
                )}
                {status.isWaiting && (
                  <Tag icon={<ExclamationCircleOutlined />} color="warning">
                    Waiting
                  </Tag>
                )}
                {status.isActive && (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    Active
                  </Tag>
                )}
                {!status.isRegistered && <Tag color="default">N/A</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Scope">
                <Text code>{status.registration?.scope || 'N/A'}</Text>
              </Descriptions.Item>
            </Descriptions>

            {status.isRegistered && (
              <div style={{ marginTop: 16 }}>
                <Button danger onClick={handleUnregister}>
                  Unregister Service Worker
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Cache Storage"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={refreshCaches}>
                  Refresh
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleClearCache()}
                  disabled={caches.length === 0}
                >
                  Clear All
                </Button>
              </Space>
            }
          >
            {caches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <DatabaseOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Paragraph type="secondary" style={{ marginTop: 16 }}>
                  No caches found
                </Paragraph>
              </div>
            ) : (
              <List
                dataSource={caches}
                renderItem={(cache) => (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleClearCache(cache.name)}
                      >
                        Clear
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <DatabaseOutlined
                          style={{ fontSize: 24, color: '#1890ff' }}
                        />
                      }
                      title={<Text strong>{cache.name}</Text>}
                      description={`${cache.count} cached items`}
                    />
                    <Progress
                      type="circle"
                      percent={Math.min((cache.count / 100) * 100, 100)}
                      size={50}
                      format={() => cache.count}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Quick Actions" style={{ marginTop: 16 }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
          <Button
            icon={<CloudSyncOutlined />}
            onClick={handleUpdate}
            disabled={!status.isRegistered}
          >
            Force Update Check
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleClearCache()}
            disabled={caches.length === 0}
          >
            Clear All Caches
          </Button>
          {status.isWaiting && (
            <Button type="primary" danger onClick={handleSkipWaiting}>
              Activate Waiting Worker
            </Button>
          )}
        </Space>
      </Card>

      <Card title="About Service Workers" style={{ marginTop: 16 }}>
        <Paragraph>
          Service Workers are scripts that run in the background, separate from
          your web page. They enable features like:
        </Paragraph>
        <ul>
          <li>
            <Text strong>Offline Support:</Text> Cache resources to work without
            internet
          </li>
          <li>
            <Text strong>Background Sync:</Text> Sync data when connectivity is
            restored
          </li>
          <li>
            <Text strong>Push Notifications:</Text> Receive notifications even
            when the app is closed
          </li>
          <li>
            <Text strong>Performance:</Text> Faster load times through
            intelligent caching
          </li>
        </ul>
      </Card>
    </div>
  );
}
