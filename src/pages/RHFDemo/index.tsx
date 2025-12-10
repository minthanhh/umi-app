import {
  Button,
  Card,
  Checkbox,
  Divider,
  Input,
  InputNumber,
  message,
  Radio,
  Select,
  Spin,
  Typography,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';

import type {
  DependentFieldConfig,
  FormAdapter,
  SelectOption,
} from '@/components/Dependents/Basic';
import {
  DependentFieldWrapper,
  DependentSelectProvider,
} from '@/components/Dependents/Basic';

const { TextArea } = Input;
const { Title } = Typography;

// ============ DEPENDENT SELECT DATA ============
const countries: SelectOption[] = [
  { label: 'Vietnam', value: 'VN' },
  { label: 'United States', value: 'US' },
  { label: 'Japan', value: 'JP' },
];

const provinces: SelectOption[] = [
  // Vietnam
  { label: 'Ho Chi Minh City', value: 'HCM', parentValue: 'VN' },
  { label: 'Hanoi', value: 'HN', parentValue: 'VN' },
  { label: 'Da Nang', value: 'DN', parentValue: 'VN' },
  // USA
  { label: 'California', value: 'CA', parentValue: 'US' },
  { label: 'New York', value: 'NY', parentValue: 'US' },
  { label: 'Texas', value: 'TX', parentValue: 'US' },
  // Japan
  { label: 'Tokyo', value: 'TK', parentValue: 'JP' },
  { label: 'Osaka', value: 'OS', parentValue: 'JP' },
  { label: 'Kyoto', value: 'KY', parentValue: 'JP' },
];

const cities: SelectOption[] = [
  // Ho Chi Minh City
  { label: 'District 1', value: 'D1', parentValue: 'HCM' },
  { label: 'District 2', value: 'D2', parentValue: 'HCM' },
  { label: 'District 7', value: 'D7', parentValue: 'HCM' },
  { label: 'Binh Thanh', value: 'BT', parentValue: 'HCM' },
  // Hanoi
  { label: 'Hoan Kiem', value: 'HK', parentValue: 'HN' },
  { label: 'Ba Dinh', value: 'BD', parentValue: 'HN' },
  { label: 'Dong Da', value: 'DD', parentValue: 'HN' },
  // Da Nang
  { label: 'Hai Chau', value: 'HC', parentValue: 'DN' },
  { label: 'Son Tra', value: 'ST', parentValue: 'DN' },
  // California
  { label: 'Los Angeles', value: 'LA', parentValue: 'CA' },
  { label: 'San Francisco', value: 'SF', parentValue: 'CA' },
  { label: 'San Diego', value: 'SD', parentValue: 'CA' },
  // New York
  { label: 'New York City', value: 'NYC', parentValue: 'NY' },
  { label: 'Buffalo', value: 'BUF', parentValue: 'NY' },
  // Texas
  { label: 'Houston', value: 'HOU', parentValue: 'TX' },
  { label: 'Dallas', value: 'DAL', parentValue: 'TX' },
  { label: 'Austin', value: 'AUS', parentValue: 'TX' },
  // Tokyo
  { label: 'Shibuya', value: 'SHI', parentValue: 'TK' },
  { label: 'Shinjuku', value: 'SHJ', parentValue: 'TK' },
  { label: 'Minato', value: 'MIN', parentValue: 'TK' },
  // Osaka
  { label: 'Namba', value: 'NAM', parentValue: 'OS' },
  { label: 'Umeda', value: 'UME', parentValue: 'OS' },
  // Kyoto
  { label: 'Gion', value: 'GIO', parentValue: 'KY' },
  { label: 'Arashiyama', value: 'ARA', parentValue: 'KY' },
];

const wards: SelectOption[] = [
  // District 1
  { label: 'Ben Nghe Ward', value: 'BN', parentValue: 'D1' },
  { label: 'Ben Thanh Ward', value: 'BTW', parentValue: 'D1' },
  { label: 'Da Kao Ward', value: 'DK', parentValue: 'D1' },
  // District 7
  { label: 'Tan Phong Ward', value: 'TP', parentValue: 'D7' },
  { label: 'Phu My Ward', value: 'PM', parentValue: 'D7' },
  // Hoan Kiem
  { label: 'Hang Bai Ward', value: 'HB', parentValue: 'HK' },
  { label: 'Trang Tien Ward', value: 'TT', parentValue: 'HK' },
  // Los Angeles
  { label: 'Hollywood', value: 'HOL', parentValue: 'LA' },
  { label: 'Downtown LA', value: 'DTLA', parentValue: 'LA' },
  { label: 'Venice', value: 'VEN', parentValue: 'LA' },
  // San Francisco
  { label: 'Mission District', value: 'MIS', parentValue: 'SF' },
  { label: 'SOMA', value: 'SOMA', parentValue: 'SF' },
  // Shibuya
  { label: 'Harajuku', value: 'HAR', parentValue: 'SHI' },
  { label: 'Ebisu', value: 'EBI', parentValue: 'SHI' },
];

// ============ DEPENDENT SELECT CONFIG ============
const dependentFieldConfigs: DependentFieldConfig[] = [
  {
    name: 'country',
    label: 'Country',
    placeholder: 'Select a country',
    options: countries,
  },
  {
    name: 'province',
    label: 'Province/State',
    placeholder: 'Select provinces',
    mode: 'multiple',
    dependsOn: 'country',
    options: provinces,
  },
  {
    name: 'city',
    label: 'City/District',
    placeholder: 'Select cities',
    mode: 'multiple',
    dependsOn: 'province',
    options: cities,
  },
  {
    name: 'ward',
    label: 'Ward',
    placeholder: 'Select wards',
    mode: 'multiple',
    dependsOn: 'city',
    options: wards,
  },
];

// ============ ZOD SCHEMA ============
const formSchema = z.object({
  // Basic fields
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  age: z
    .number({ error: 'Age is required' })
    .min(18, 'Must be 18+')
    .max(100, 'Invalid age'),
  gender: z.string().min(1, 'Gender is required'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  // Dependent select fields
  country: z.string().min(1, 'Country is required'),
  province: z.array(z.string()).min(1, 'Province is required'),
  city: z.array(z.string()).min(1, 'City is required'),
  ward: z.array(z.string()).optional(),
  // Terms
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

type FormData = z.infer<typeof formSchema>;

const defaultValues: FormData = {
  fullName: '',
  email: '',
  age: 0,
  gender: '',
  bio: '',
  country: '',
  province: [],
  city: [],
  ward: [],
  terms: false,
};

// ============ MAIN COMPONENT ============
const RHFDemo = () => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues,
    mode: 'onChange',
  });

  // React Hook Form adapter for DependentSelect
  // This syncs Store changes (including cascade deletes) to RHF
  const rhfAdapter: FormAdapter = {
    onFieldChange: (name, value) => {
      console.log(`[RHF Adapter] Setting "${name}" to:`, value);
      setValue(name as keyof FormData, value, { shouldValidate: true });
    },
    onFieldsChange: (changedFields) => {
      console.log('[RHF Adapter] Setting multiple fields:', changedFields);
      changedFields.forEach(({ name, value }) => {
        setValue(name as keyof FormData, value, { shouldValidate: true });
      });
    },
  };

  const onSubmit = (data: FormData) => {
    console.log('Form values:', data);
    message.success('Form submitted successfully!');
  };

  return (
    <div className="p-6">
      <Card
        title="React Hook Form + DependentSelect Integration"
        className="max-w-2xl mx-auto"
      >
        <DependentSelectProvider
          configs={dependentFieldConfigs}
          adapter={rhfAdapter}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Fields */}
            <Title level={5}>Basic Information</Title>

            {/* Full Name */}
            <div>
              <label className="block mb-1 font-medium">Full Name *</label>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter your full name"
                    // status={errors.fullName ? 'error' : ''}
                  />
                )}
              />
              {/* {errors.fullName && (
                <div className="text-red-500 text-sm mt-1">{errors.fullName.message}</div>
              )} */}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1 font-medium">Email *</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter your email"
                    // status={errors.email ? 'error' : ''}
                  />
                )}
              />
              {/* {errors.email && (
                <div className="text-red-500 text-sm mt-1">{errors.email.message}</div>
              )} */}
            </div>

            {/* Age */}
            <div>
              <label className="block mb-1 font-medium">Age *</label>
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    placeholder="Enter your age"
                    min={0}
                    max={150}
                    // status={errors.age ? 'error' : ''}
                    style={{ width: '100%' }}
                  />
                )}
              />
              {/* {errors.age && (
                <div className="text-red-500 text-sm mt-1">{errors.age.message}</div>
              )} */}
            </div>

            {/* Gender */}
            <div>
              <label className="block mb-1 font-medium">Gender *</label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => {
                  console.log({field})
                  return (
                  <Radio.Group {...field}>
                    <Radio value="male">Male</Radio>
                    <Radio value="female">Female</Radio>
                    <Radio value="other">Other</Radio>
                  </Radio.Group>
                )
                }}
              />
              {/* {errors.gender && (
                <div className="text-red-500 text-sm mt-1">{errors.gender.message}</div>
              )} */}
            </div>

            {/* Bio */}
            <div>
              <label className="block mb-1 font-medium">Bio</label>
              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    placeholder="Tell us about yourself"
                    rows={3}
                    // status={errors.bio ? 'error' : ''}
                  />
                )}
              />
              {/* {errors.bio && (
                <div className="text-red-500 text-sm mt-1">{errors.bio.message}</div>
              )} */}
            </div>

            <Divider />

            {/* Dependent Select Fields */}
            <Title level={5}>Location (Cascading Selects)</Title>
            <p className="text-gray-500 text-sm mb-4">
              Select Country → Province → City → Ward. Supports multiple
              selection with cascade delete.
            </p>

            {/* Country - using DependentFieldWrapper */}
            <div>
              <label className="block mb-1 font-medium">Country *</label>
              <DependentFieldWrapper name="country">
                {({
                  storeValue,
                  onStoreChange,
                  options,
                  isLoading,
                  isDisabledByParent,
                  config,
                }) => (
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={(v) => {
                          onStoreChange(v); // Update store (cascade logic)
                          field.onChange(v); // Update RHF
                        }}
                        onBlur={field.onBlur}
                        options={options}
                        mode={config?.mode}
                        placeholder={config?.placeholder}
                        disabled={isDisabledByParent}
                        loading={isLoading}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        notFoundContent={
                          isLoading ? <Spin size="small" /> : undefined
                        }
                        style={{ width: '100%' }}
                        // status={errors.country ? 'error' : ''}
                      />
                    )}
                  />
                )}
              </DependentFieldWrapper>
              {/* {errors.country && (
                <div className="text-red-500 text-sm mt-1">{errors.country.message}</div>
              )} */}
            </div>

            {/* Province */}
            <div>
              <label className="block mb-1 font-medium">Province/State *</label>
              <DependentFieldWrapper name="province">
                {({
                  onStoreChange,
                  options,
                  isLoading,
                  isDisabledByParent,
                  config,
                }) => (
                  <Controller
                    name="province"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={(v) => {
                          onStoreChange(v);
                          field.onChange(v);
                        }}
                        onBlur={field.onBlur}
                        options={options}
                        mode={config?.mode}
                        placeholder={config?.placeholder}
                        disabled={isDisabledByParent}
                        loading={isLoading}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        notFoundContent={
                          isLoading ? <Spin size="small" /> : undefined
                        }
                        style={{ width: '100%' }}
                        // status={errors.province ? 'error' : ''}
                      />
                    )}
                  />
                )}
              </DependentFieldWrapper>
              {/* {errors.province && (
                <div className="text-red-500 text-sm mt-1">{errors.province.message}</div>
              )} */}
            </div>

            {/* City */}
            <div>
              <label className="block mb-1 font-medium">City/District *</label>
              <DependentFieldWrapper name="city">
                {({
                  onStoreChange,
                  options,
                  isLoading,
                  isDisabledByParent,
                  config,
                }) => (
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={(v) => {
                          onStoreChange(v);
                          field.onChange(v);
                        }}
                        onBlur={field.onBlur}
                        options={options}
                        mode={config?.mode}
                        placeholder={config?.placeholder}
                        disabled={isDisabledByParent}
                        loading={isLoading}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        notFoundContent={
                          isLoading ? <Spin size="small" /> : undefined
                        }
                        style={{ width: '100%' }}
                        // status={errors.city ? 'error' : ''}
                      />
                    )}
                  />
                )}
              </DependentFieldWrapper>
              {/* {errors.city && (
                <div className="text-red-500 text-sm mt-1">{errors.city.message}</div>
              )} */}
            </div>

            {/* Ward */}
            <div>
              <label className="block mb-1 font-medium">Ward</label>
              <DependentFieldWrapper name="ward">
                {({
                  onStoreChange,
                  options,
                  isLoading,
                  isDisabledByParent,
                  config,
                }) => (
                  <Controller
                    name="ward"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={(v) => {
                          onStoreChange(v);
                          field.onChange(v);
                        }}
                        onBlur={field.onBlur}
                        options={options}
                        mode={config?.mode}
                        placeholder={config?.placeholder}
                        disabled={isDisabledByParent}
                        loading={isLoading}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        notFoundContent={
                          isLoading ? <Spin size="small" /> : undefined
                        }
                        style={{ width: '100%' }}
                        // status={errors.ward ? 'error' : ''}
                      />
                    )}
                  />
                )}
              </DependentFieldWrapper>
              {/* {errors.ward && (
                <div className="text-red-500 text-sm mt-1">{errors.ward.message}</div>
              )} */}
            </div>

            <Divider />

            {/* Terms */}
            <div>
              <Controller
                name="terms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  >
                    I agree to the terms and conditions *
                  </Checkbox>
                )}
              />
              {/* {errors.terms && (
                <div className="text-red-500 text-sm mt-1">{errors.terms.message}</div>
              )} */}
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
          </form>
        </DependentSelectProvider>
      </Card>
    </div>
  );
};

export default RHFDemo;
