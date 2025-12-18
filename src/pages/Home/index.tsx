import { SmartSelectDemo } from '@/components/Dependents/Basic/SmartSelect';
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
