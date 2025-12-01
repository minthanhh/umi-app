import Select from '@/components/Select/Select';
import { PageContainer } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';

const AccessPage: React.FC = () => {
  const access = useAccess();
  return (
    <PageContainer
      ghost
      header={{
        title: '权限示例',
      }}
    >
      <Select
        mode="multiple"
        placeholder="Select an option"
        options={[
          { label: 'Option 1', value: '1' },
          { label: 'Option 2', value: '2' },
        ]}
      />
    </PageContainer>
  );
};

export default AccessPage;
