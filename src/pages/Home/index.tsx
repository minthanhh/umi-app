import UserSelect from '@/components/Select/UserSelect';
import { AntdUserSelect } from '@/components/Select/DefaultSelect/examples';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Divider, Typography } from 'antd';
import { useState } from 'react';

const { Title, Text } = Typography;

const HomePage: React.FC = () => {
  const [userIds, setUserIds] = useState<Array<string | number>>([1]);
  const [defaultSelectIds, setDefaultSelectIds] = useState<Array<string | number>>([2, 3]);

  const handleSetUserIds = (value: Array<string | number>) => {
    setUserIds(value);
  };

  const handleDefaultSelectChange = (value: Array<string | number>) => {
    setDefaultSelectIds(value);
  };

  return (
    <PageContainer>
      <Card>
        <Title level={4}>Original UserSelect</Title>
        <Text type="secondary">Component gốc với logic tích hợp sẵn</Text>
        <div className="mt-4">
          <UserSelect value={userIds} onChange={handleSetUserIds} />
        </div>
        <Text className="mt-2 block">Selected IDs: {JSON.stringify(userIds)}</Text>
      </Card>

      <Divider />

      <Card>
        <Title level={4}>New DefaultSelect (with Wrapper)</Title>
        <Text type="secondary">
          Component mới sử dụng SelectWrapper - tách logic khỏi UI
        </Text>
        <div className="mt-4">
          <AntdUserSelect
            value={defaultSelectIds}
            onChange={handleDefaultSelectChange}
            placeholder="Select users (DefaultSelect)"
          />
        </div>
        <Text className="mt-2 block">Selected IDs: {JSON.stringify(defaultSelectIds)}</Text>
      </Card>
    </PageContainer>
  );
};

export default HomePage;
