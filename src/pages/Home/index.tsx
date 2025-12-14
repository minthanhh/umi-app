import { InfiniteSelectDemo, RealApiDemo } from '@/components/Dependents/Basic';
import { SmartSelectDemo } from '@/components/Dependents/Basic/SmartSelect';
import MultipleDemo from '@/components/SmartSelect/examples/MultipleDemo';
import { PageContainer } from '@ant-design/pro-components';
import { Flex } from 'antd';
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <PageContainer>
      <Flex vertical gap="large">
        <SmartSelectDemo />
        {/* <InfiniteSelectDemo /> */}
        {/* <RealApiDemo /> */}
        {/* <DependentSelectDemo /> */}
        {/* <AntdFormDemo /> */}
        {/* <MultipleDemo /> */}
      </Flex>
    </PageContainer>
  );
};

export default HomePage;
