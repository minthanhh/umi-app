import { PageContainer } from '@ant-design/pro-components';
import { Flex } from 'antd';
import React from 'react';
import { CascadingSelectCard } from './components';

const HomePage: React.FC = () => {
  return (
    <PageContainer>
      <Flex vertical gap="large">
        <CascadingSelectCard mode="single" />
        <CascadingSelectCard mode="multiple" />
      </Flex>
    </PageContainer>
  );
};

export default HomePage;