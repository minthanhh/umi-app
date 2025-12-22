import XSelectIntegrationDemo from '@/libs/x-dynamic-form/examples/XSelectIntegrationDemo';
import XSelectDemo from '@/libs/x-select/examples';
import { PageContainer } from '@ant-design/pro-components';
import { Flex } from 'antd';
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <PageContainer>
      <Flex vertical gap="large">
        <XSelectDemo />
        {/* <SmartSelectDemo /> */}
        {/* <XSelectIntegrationDemo /> */}
      </Flex>
    </PageContainer>
  );
};

export default HomePage;
