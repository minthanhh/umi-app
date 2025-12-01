import { ModalForm, ProFormText } from '@ant-design/pro-components';

export type CreateFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (value: any) => Promise<void>;
};

const CreateForm: React.FC<CreateFormProps> = (props) => {
  const { open, onOpenChange, onFinish } = props;
  return (
    <ModalForm
      title="Create User"
      width="400px"
      open={open}
      onOpenChange={onOpenChange}
      onFinish={onFinish}
    >
      <ProFormText
        rules={[
          {
            required: true,
            message: 'Name is required',
          },
        ]}
        width="md"
        name="name"
        placeholder="Name"
      />
      <ProFormText
        rules={[
          {
            required: true,
            message: 'Email is required',
          },
        ]}
        width="md"
        name="email"
        placeholder="Email"
      />
    </ModalForm>
  );
};

export default CreateForm;
