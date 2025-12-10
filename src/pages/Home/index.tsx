import DependentSelectDemo from '@/components/Dependents/Basic/DependentSelectDemo';
import { PageContainer } from '@ant-design/pro-components';
import { Flex } from 'antd';
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <PageContainer>
      <Flex vertical gap="large">
        <DependentSelectDemo />
      </Flex>
    </PageContainer>
  );
};

export default HomePage;
