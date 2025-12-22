import { BasicDemo } from '@/libs/x-dynamic-form/examples';
import { BasicRHFFormExample } from '@/libs/x-dynamic-form/examples/ReactHookFormDemo';
import { PageContainer } from '@ant-design/pro-components';

const AccessPage: React.FC = () => {
  return (
    <PageContainer
      ghost
      header={{
        title: 'Access Control',
      }}
    >
      {/* <BasicDemo /> */}
      <BasicRHFFormExample />
    </PageContainer>
  );
};

export default AccessPage;
