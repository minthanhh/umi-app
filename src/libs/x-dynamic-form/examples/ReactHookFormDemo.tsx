/**
 * X-Dynamic-Form with React Hook Form Demo
 *
 * Shows how to use the core dynamic form components with React Hook Form
 * instead of Ant Design Form state management.
 */

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Button, Card, Space, Typography, Divider, Row, Col } from 'antd';
import { FormProvider, Field } from '../core';
import type { FieldConfig } from '../core';
import { antdRegistry } from '../antd/registry';

const { Title, Paragraph, Text } = Typography;

// =============================================================================
// CUSTOM FORM ITEM WRAPPER FOR RHF (No name binding, just styling)
// =============================================================================

interface RHFFormItemWrapperProps {
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}

function RHFFormItemWrapper({ label, required, error, help, children }: RHFFormItemWrapperProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          {required && <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>}
          {label}
        </label>
      )}
      {children}
      {error && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
          {error}
        </div>
      )}
      {help && !error && (
        <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          {help}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXAMPLE 1: Basic RHF Form
// =============================================================================

interface BasicFormValues {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
}

const basicSchema: FieldConfig[] = [
  {
    type: 'input',
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter first name',
    required: true,
  },
  {
    type: 'input',
    name: 'lastName',
    label: 'Last Name',
    placeholder: 'Enter last name',
    required: true,
  },
  {
    type: 'input',
    name: 'email',
    label: 'Email',
    placeholder: 'Enter email',
    inputType: 'email',
  },
  {
    type: 'select',
    name: 'country',
    label: 'Country',
    placeholder: 'Select country',
    options: [
      { label: 'Vietnam', value: 'vn' },
      { label: 'United States', value: 'us' },
      { label: 'Japan', value: 'jp' },
    ],
    showSearch: true,
    allowClear: true,
  },
];

export function BasicRHFFormExample() {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BasicFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: '',
    },
  });

  const onSubmit = (data: BasicFormValues) => {
    console.log('Form submitted:', data);
    alert(`Form submitted!\n${JSON.stringify(data, null, 2)}`);
  };

  return (
    <Card title="Example 1: Basic Form with React Hook Form">
      <Paragraph type="secondary">
        Form state is managed by React Hook Form. Uses Controller to connect
        DynamicForm fields with RHF state.
      </Paragraph>

      <FormProvider registry={antdRegistry} FormItemWrapper={undefined}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Row gutter={16}>
            {basicSchema.map((config) => (
              <Col key={config.name} span={12}>
                <Controller
                  name={config.name as keyof BasicFormValues}
                  control={control}
                  rules={{
                    required: config.required ? `${config.label || config.name} is required` : undefined,
                  }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <RHFFormItemWrapper
                      label={config.label}
                      required={config.required}
                      error={errors[config.name as keyof BasicFormValues]?.message}
                    >
                      <Field
                        config={config}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        error={errors[config.name as keyof BasicFormValues]?.message}
                      />
                    </RHFFormItemWrapper>
                  )}
                />
              </Col>
            ))}
          </Row>

          <Divider />

          <Space>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
            <Button onClick={() => reset()}>Reset</Button>
            <Button onClick={() => {
              setValue('firstName', 'John');
              setValue('lastName', 'Doe');
            }}>
              Set Values
            </Button>
          </Space>
        </form>
      </FormProvider>
    </Card>
  );
}

// =============================================================================
// EXAMPLE 2: All Field Types with RHF
// =============================================================================

interface AllFieldTypesValues {
  input: string;
  textarea: string;
  number: number | null;
  select: string;
  checkbox: boolean;
  radio: string;
  switch: boolean;
  date: unknown;
  slider: number;
  rate: number;
}

const allFieldTypesSchema: FieldConfig[] = [
  { type: 'input', name: 'input', label: 'Input', placeholder: 'Text input' },
  { type: 'textarea', name: 'textarea', label: 'Textarea', rows: 3 },
  { type: 'number', name: 'number', label: 'Number', min: 0, max: 100 },
  {
    type: 'select',
    name: 'select',
    label: 'Select',
    options: [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ],
  },
  { type: 'checkbox', name: 'checkbox', label: 'Checkbox', checkboxLabel: 'I agree to terms' },
  {
    type: 'radio',
    name: 'radio',
    label: 'Radio',
    options: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
    ],
  },
  { type: 'switch', name: 'switch', label: 'Switch' },
  { type: 'date', name: 'date', label: 'Date Picker' },
  { type: 'slider', name: 'slider', label: 'Slider', min: 0, max: 100 },
  { type: 'rate', name: 'rate', label: 'Rate' },
];

function AllFieldTypesRHFExample() {
  const { control, watch } = useForm<AllFieldTypesValues>({
    defaultValues: {
      input: '',
      textarea: '',
      number: null,
      select: '',
      checkbox: false,
      radio: '',
      switch: false,
      date: null,
      slider: 50,
      rate: 3,
    },
  });

  const values = watch();

  return (
    <Card title="Example 2: All Field Types with RHF">
      <Paragraph type="secondary">
        All built-in field types working with React Hook Form Controller pattern.
      </Paragraph>

      <FormProvider registry={antdRegistry} FormItemWrapper={undefined}>
        <Row gutter={[16, 0]}>
          {allFieldTypesSchema.map((config) => (
            <Col key={config.name} span={12}>
              <Controller
                name={config.name as keyof AllFieldTypesValues}
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <RHFFormItemWrapper label={config.label}>
                    <Field
                      config={config}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                    />
                  </RHFFormItemWrapper>
                )}
              />
            </Col>
          ))}
        </Row>
      </FormProvider>

      <Divider />
      <Text strong>Current Values:</Text>
      <pre style={{ background: '#f5f5f5', padding: 12, marginTop: 8, fontSize: 12 }}>
        {JSON.stringify(values, null, 2)}
      </pre>
    </Card>
  );
}

// =============================================================================
// EXAMPLE 3: Field Array with RHF
// =============================================================================

interface User {
  name: string;
  email: string;
}

interface FieldArrayFormValues {
  users: User[];
}

function FieldArrayRHFExample() {
  const { control, watch, formState: { errors } } = useForm<FieldArrayFormValues>({
    defaultValues: {
      users: [{ name: '', email: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'users',
  });

  const values = watch();

  return (
    <Card title="Example 3: Field Array with RHF">
      <Paragraph type="secondary">
        Dynamic field arrays using React Hook Form useFieldArray hook.
      </Paragraph>

      <FormProvider registry={antdRegistry} FormItemWrapper={undefined}>
        {fields.map((field, index) => (
          <Card
            key={field.id}
            size="small"
            title={`User ${index + 1}`}
            extra={
              <Button danger size="small" onClick={() => remove(index)}>
                Remove
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Controller
                  name={`users.${index}.name`}
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <RHFFormItemWrapper
                      label="Name"
                      required
                      error={errors.users?.[index]?.name?.message}
                    >
                      <Field
                        config={{ type: 'input', name: `users.${index}.name`, placeholder: 'Enter name' }}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                      />
                    </RHFFormItemWrapper>
                  )}
                />
              </Col>
              <Col span={12}>
                <Controller
                  name={`users.${index}.email`}
                  control={control}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <RHFFormItemWrapper label="Email">
                      <Field
                        config={{ type: 'input', name: `users.${index}.email`, placeholder: 'Enter email', inputType: 'email' }}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                      />
                    </RHFFormItemWrapper>
                  )}
                />
              </Col>
            </Row>
          </Card>
        ))}
        <Button type="dashed" onClick={() => append({ name: '', email: '' })} block>
          + Add User
        </Button>
      </FormProvider>

      <Divider />
      <Text strong>Current Values:</Text>
      <pre style={{ background: '#f5f5f5', padding: 12, marginTop: 8 }}>
        {JSON.stringify(values, null, 2)}
      </pre>
    </Card>
  );
}

// =============================================================================
// EXAMPLE 4: Validation with RHF
// =============================================================================

interface ValidationFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  age: number | null;
  email: string;
}

function ValidationRHFExample() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ValidationFormValues>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      age: null,
      email: '',
    },
  });

  const password = watch('password');
  const values = watch();

  const onSubmit = (data: ValidationFormValues) => {
    alert(`Form is valid!\n${JSON.stringify(data, null, 2)}`);
  };

  return (
    <Card title="Example 4: Form Validation with RHF">
      <Paragraph type="secondary">
        Advanced validation using React Hook Form validation rules.
      </Paragraph>

      <FormProvider registry={antdRegistry} FormItemWrapper={undefined}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Row gutter={16}>
            <Col span={12}>
              <Controller
                name="username"
                control={control}
                rules={{
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' },
                  maxLength: { value: 20, message: 'Username must be less than 20 characters' },
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <RHFFormItemWrapper
                    label="Username"
                    required
                    error={errors.username?.message}
                  >
                    <Field
                      config={{ type: 'input', name: 'username', placeholder: 'Enter username (3-20 chars)' }}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={errors.username?.message}
                    />
                  </RHFFormItemWrapper>
                )}
              />
            </Col>
            <Col span={12}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <RHFFormItemWrapper
                    label="Email"
                    required
                    error={errors.email?.message}
                  >
                    <Field
                      config={{ type: 'input', name: 'email', placeholder: 'Enter valid email' }}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                    />
                  </RHFFormItemWrapper>
                )}
              />
            </Col>
            <Col span={12}>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <RHFFormItemWrapper
                    label="Password"
                    required
                    error={errors.password?.message}
                  >
                    <Field
                      config={{ type: 'input', name: 'password', placeholder: 'Enter password', inputType: 'password' }}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                    />
                  </RHFFormItemWrapper>
                )}
              />
            </Col>
            <Col span={12}>
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <RHFFormItemWrapper
                    label="Confirm Password"
                    required
                    error={errors.confirmPassword?.message}
                  >
                    <Field
                      config={{ type: 'input', name: 'confirmPassword', placeholder: 'Confirm password', inputType: 'password' }}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                    />
                  </RHFFormItemWrapper>
                )}
              />
            </Col>
            <Col span={12}>
              <Controller
                name="age"
                control={control}
                rules={{
                  required: 'Age is required',
                  min: { value: 18, message: 'Must be at least 18 years old' },
                  max: { value: 120, message: 'Please enter a valid age' },
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <RHFFormItemWrapper
                    label="Age"
                    required
                    error={errors.age?.message}
                  >
                    <Field
                      config={{ type: 'number', name: 'age', placeholder: 'Enter age (18+)', min: 0 }}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={errors.age?.message}
                    />
                  </RHFFormItemWrapper>
                )}
              />
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button type="primary" htmlType="submit" disabled={!isValid}>
              Submit {!isValid && '(Form Invalid)'}
            </Button>
          </Space>
        </form>
      </FormProvider>

      <Divider />
      <Text strong>Current Values:</Text>
      <pre style={{ background: '#f5f5f5', padding: 12, marginTop: 8, fontSize: 12 }}>
        {JSON.stringify(values, null, 2)}
      </pre>
      <Text strong>Errors:</Text>
      <pre style={{ background: '#fff0f0', padding: 12, marginTop: 8, fontSize: 12 }}>
        {JSON.stringify(errors, null, 2)}
      </pre>
    </Card>
  );
}

// =============================================================================
// MAIN DEMO
// =============================================================================

export function ReactHookFormDemo() {
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Title level={2}>X-Dynamic-Form with React Hook Form</Title>

      <Paragraph>
        This demo shows how to use the core dynamic form components with React Hook Form
        for state management instead of Ant Design Form.
      </Paragraph>

      <ul>
        <li>
          <Text strong>Controller Pattern:</Text> Uses RHF Controller to connect fields
        </li>
        <li>
          <Text strong>Same Field Components:</Text> Reuses the same antd field registry
        </li>
        <li>
          <Text strong>Advanced Validation:</Text> Leverages RHF powerful validation
        </li>
        <li>
          <Text strong>Field Arrays:</Text> Dynamic fields with useFieldArray
        </li>
      </ul>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <BasicRHFFormExample />
        <AllFieldTypesRHFExample />
        <FieldArrayRHFExample />
        <ValidationRHFExample />
      </Space>
    </div>
  );
}

export default ReactHookFormDemo;
