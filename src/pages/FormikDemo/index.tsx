import { Button, Card, Checkbox, Input, Radio, Select, message } from 'antd';
import type { FieldProps } from 'formik';
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik';
import * as Yup from 'yup';

const { TextArea } = Input;

// Validation Schema
const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, 'Username phải có ít nhất 3 ký tự')
    .max(20, 'Username không được quá 20 ký tự')
    .required('Username là bắt buộc'),
  email: Yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  password: Yup.string()
    .min(6, 'Password phải có ít nhất 6 ký tự')
    .required('Password là bắt buộc'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Password không khớp')
    .required('Xác nhận password là bắt buộc'),
  age: Yup.number()
    .min(18, 'Phải từ 18 tuổi trở lên')
    .max(100, 'Tuổi không hợp lệ')
    .required('Tuổi là bắt buộc'),
  gender: Yup.string().required('Giới tính là bắt buộc'),
  country: Yup.string().required('Quốc gia là bắt buộc'),
  bio: Yup.string().max(500, 'Bio không được quá 500 ký tự'),
  terms: Yup.boolean().oneOf([true], 'Bạn phải đồng ý với điều khoản'),
  skills: Yup.array()
    .of(Yup.string().required('Skill không được để trống'))
    .min(1, 'Phải có ít nhất 1 skill'),
});

// Initial values
const initialValues = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
  gender: '',
  country: '',
  bio: '',
  terms: false,
  skills: [''],
};

// Custom Field Components for Ant Design
const AntInput = ({
  field,
  form,
  ...props
}: FieldProps & { placeholder?: string }) => {
  const hasError = form.touched[field.name] && form.errors[field.name];
  return <Input {...field} {...props} status={hasError ? 'error' : ''} />;
};

const AntPassword = ({
  field,
  form,
  ...props
}: FieldProps & { placeholder?: string }) => {
  const hasError = form.touched[field.name] && form.errors[field.name];
  return (
    <Input.Password {...field} {...props} status={hasError ? 'error' : ''} />
  );
};

const AntTextArea = ({
  field,
  form,
  ...props
}: FieldProps & { placeholder?: string; rows?: number }) => {
  const hasError = form.touched[field.name] && form.errors[field.name];
  return <TextArea {...field} {...props} status={hasError ? 'error' : ''} />;
};

const AntSelect = ({
  field,
  form,
  options,
  ...props
}: FieldProps & {
  options: { value: string; label: string }[];
  placeholder?: string;
}) => {
  const hasError = form.touched[field.name] && form.errors[field.name];
  return (
    <Select
      {...props}
      value={field.value || undefined}
      onChange={(value) => form.setFieldValue(field.name, value)}
      onBlur={() => form.setFieldTouched(field.name, true)}
      status={hasError ? 'error' : ''}
      options={options}
      style={{ width: '100%' }}
    />
  );
};

const AntCheckbox = ({
  field,
  form,
  children,
}: FieldProps & { children?: React.ReactNode }) => {
  return (
    <Checkbox
      checked={field.value}
      onChange={(e) => form.setFieldValue(field.name, e.target.checked)}
    >
      {children}
    </Checkbox>
  );
};

const AntRadioGroup = ({
  field,
  form,
  options,
}: FieldProps & { options: { value: string; label: string }[] }) => {
  return (
    <Radio.Group
      value={field.value}
      onChange={(e) => form.setFieldValue(field.name, e.target.value)}
    >
      {options.map((opt) => (
        <Radio key={opt.value} value={opt.value}>
          {opt.label}
        </Radio>
      ))}
    </Radio.Group>
  );
};

const FormikDemo = () => {
  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: any,
  ) => {
    console.log('Form values:', values);
    message.success('Form submitted successfully!');
    setSubmitting(false);
  };

  return (
    <div className="p-6">
      <Card title="Formik Demo - Basic Form" className="max-w-2xl mx-auto">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, errors, touched }) => (
            <Form className="space-y-4">
              {/* Username */}
              <div>
                <label className="block mb-1 font-medium">Username *</label>
                <Field
                  name="username"
                  component={AntInput}
                  placeholder="Enter username"
                />
                <ErrorMessage
                  name="username"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-1 font-medium">Email *</label>
                <Field
                  name="email"
                  component={AntInput}
                  placeholder="Enter email"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block mb-1 font-medium">Password *</label>
                <Field
                  name="password"
                  component={AntPassword}
                  placeholder="Enter password"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block mb-1 font-medium">
                  Confirm Password *
                </label>
                <Field
                  name="confirmPassword"
                  component={AntPassword}
                  placeholder="Confirm password"
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block mb-1 font-medium">Age *</label>
                <Field
                  name="age"
                  component={AntInput}
                  type="number"
                  placeholder="Enter age"
                />
                <ErrorMessage
                  name="age"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block mb-1 font-medium">Gender *</label>
                <Field
                  name="gender"
                  component={AntRadioGroup}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
                <ErrorMessage
                  name="gender"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block mb-1 font-medium">Country *</label>
                <Field
                  name="country"
                  component={AntSelect}
                  placeholder="Select country"
                  options={[
                    { value: 'vn', label: 'Vietnam' },
                    { value: 'us', label: 'United States' },
                    { value: 'uk', label: 'United Kingdom' },
                    { value: 'jp', label: 'Japan' },
                    { value: 'kr', label: 'Korea' },
                  ]}
                />
                <ErrorMessage
                  name="country"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block mb-1 font-medium">Bio</label>
                <Field
                  name="bio"
                  component={AntTextArea}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
                <ErrorMessage
                  name="bio"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Skills - Dynamic Field Array */}
              <div>
                <label className="block mb-1 font-medium">Skills *</label>
                <FieldArray name="skills">
                  {({ push, remove }) => (
                    <div className="space-y-2">
                      {values.skills.map((_, index) => (
                        <div key={index} className="flex gap-2">
                          <Field
                            name={`skills.${index}`}
                            component={AntInput}
                            placeholder={`Skill ${index + 1}`}
                          />
                          {values.skills.length > 1 && (
                            <Button danger onClick={() => remove(index)}>
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="dashed" onClick={() => push('')} block>
                        + Add Skill
                      </Button>
                    </div>
                  )}
                </FieldArray>
                <ErrorMessage
                  name="skills"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Terms */}
              <div>
                <Field name="terms" component={AntCheckbox}>
                  I agree to the terms and conditions *
                </Field>
                <ErrorMessage
                  name="terms"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  block
                  size="large"
                >
                  Submit
                </Button>
              </div>

              {/* Debug */}
              <div className="mt-6 p-4 bg-gray-100 rounded">
                <h4 className="font-medium mb-2">Form State (Debug):</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify({ values, errors, touched }, null, 2)}
                </pre>
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default FormikDemo;
