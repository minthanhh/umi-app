import UserSelect from '@/components/Select/UserSelect';
import {
  PageContainer,
} from '@ant-design/pro-components';
import { useState } from 'react';

const HomePage: React.FC = () => {
  const [userIds, setUserIds] = useState([1]);

  const handleSetUserIds = (value: number[]) => {
    setUserIds(value);
  };

  return (
    <PageContainer>
      <UserSelect value={userIds} onChange={handleSetUserIds} />
    </PageContainer>
  );
};

export default HomePage;
