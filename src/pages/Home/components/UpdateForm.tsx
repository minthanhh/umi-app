import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { User } from 'generated/prisma/client';

export type UpdateFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (value: any) => Promise<void>;
  initialValues?: User;
};

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const { open, onOpenChange, onFinish, initialValues } = props;

  return (
    <ModalForm
      title="Update User"
      width="400px"
      open={open}
      onOpenChange={onOpenChange}
      onFinish={onFinish}
      initialValues={initialValues}
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

export default UpdateForm;
