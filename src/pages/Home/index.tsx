import { SmartSelectDemo } from '@/components/Dependents/Basic/SmartSelect';
import { PageContainer } from '@ant-design/pro-components';
import { Flex } from 'antd';
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <PageContainer>
      <Flex vertical gap="large">
        <SmartSelectDemo />
        {/* <ReactHookFormDemo /> */}
        {/* <FormikDemo /> */}
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
