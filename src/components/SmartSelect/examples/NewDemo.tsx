import { createAntdAdapter } from '@/lib/dependent-field';
import { Form } from 'antd';
import { Select } from '..';
import { SmartSelectProvider } from '../context';

const configs = [
  {
    name: 'userIds',
    placeholder: 'Select users',
    mode: 'multiple',
    apiConfig: {
      url: '/users/',
      params: {
        current: 1,
        pageSize: 10,
      },
    },
  },
  {
    name: 'projectIds',
    placeholder: 'Select projects',
    mode: 'multiple',
    apiConfig: {
      url: '/projects/',
      params: {
        current: 1,
        pageSize: 10,
      },
    },
  },
];

export const NewDemo = () => {
  const [form] = Form.useForm();
  const adapter = createAntdAdapter(form);

  return (
    <SmartSelectProvider config={configs} adapter={adapter} initialValues={{}}>
      <Form form={form}>
        <Form.Item name={'userIds'}>
          <Select.Dependent>{() => <Select />}</Select.Dependent>
        </Form.Item>
        <Form.Item>
          <Select.Dependent>
            <Select.Infinite>{() => <Select />}</Select.Infinite>
          </Select.Dependent>
        </Form.Item>
        <Form.Item>
          <Select.Dependent
            dependsOn={['userIds']}
            onDependsOnChange={() => {}}
          >
            <Select.Infinite>{() => <Select />}</Select.Infinite>
          </Select.Dependent>
        </Form.Item>
      </Form>
    </SmartSelectProvider>
  );
};
