import { PageContainer } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';

const AccessPage: React.FC = () => {
  const access = useAccess();
  return (
    <PageContainer
      ghost
      header={{
        title: 'Access Control',
      }}
    >
      <p>Current access permissions:</p>
      <pre className="bg-gray-50 p-4 rounded mt-2 overflow-auto">
        {JSON.stringify(access, null, 2)}
      </pre>
    </PageContainer>
  );
};

export default AccessPage;
