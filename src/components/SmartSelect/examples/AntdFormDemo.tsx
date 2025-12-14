/**
 * SmartSelect + Ant Design Form Integration Demo
 */

import {
  Select as AntdSelect,
  Button,
  Card,
  Form,
  Space,
  Typography,
  message,
} from 'antd';
import { useMemo } from 'react';

import {
  Select,
  SmartSelectProvider,
  useAntdFormAdapter,
  type FetchRequest,
  type FetchResponse,
} from '../index';

const { Title, Text } = Typography;

// ============================================================================
// Mock Data (same as Demo.tsx)
// ============================================================================

interface Country {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface City {
  id: number;
  name: string;
  countryId: number;
  [key: string]: unknown;
}

const mockCountries: Country[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Country ${i + 1}`,
}));

const mockCities: City[] = mockCountries.flatMap((country) =>
  Array.from({ length: 20 }, (_, i) => ({
    id: country.id * 100 + i + 1,
    name: `City ${country.id}-${i + 1}`,
    countryId: country.id,
  })),
);

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

async function fetchCountries(
  req: FetchRequest,
): Promise<FetchResponse<Country>> {
  await delay(300);
  const start = (req.current - 1) * req.pageSize;
  const data = mockCountries.slice(start, start + req.pageSize);
  return { data, hasMore: start + req.pageSize < mockCountries.length };
}

async function fetchCities(
  req: FetchRequest & { countryId?: number },
): Promise<FetchResponse<City>> {
  await delay(300);
  let filtered = mockCities;
  if (req.countryId) {
    filtered = mockCities.filter((c) => c.countryId === req.countryId);
  }
  const start = (req.current - 1) * req.pageSize;
  const data = filtered.slice(start, start + req.pageSize);
  return { data, hasMore: start + req.pageSize < filtered.length };
}

// ============================================================================
// Demo Component
// ============================================================================

export function AntdFormDemo() {
  const [form] = Form.useForm();

  // Create adapter that syncs SmartSelect with Ant Design Form
  const adapter = useAntdFormAdapter(form);

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success(`Submitted: ${JSON.stringify(values)}`);
  };

  const handleReset = () => {
    form.resetFields();
    message.info('Form reset');
  };

  return (
    <Card>
      <Title level={4}>Ant Design Form Integration</Title>
      <Text type="secondary">
        SmartSelect syncs with Ant Design Form. Values are managed by Form, not
        SmartSelect.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ country: undefined, city: undefined }}
        style={{ marginTop: 24 }}
      >
        <SmartSelectProvider adapter={adapter}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Country Field */}
            <Form.Item
              name="country"
              label="Country"
              rules={[{ required: true, message: 'Please select a country' }]}
            >
              <CountrySelect />
            </Form.Item>

            {/* City Field - depends on Country */}
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: 'Please select a city' }]}
            >
              <CitySelect />
            </Form.Item>

            {/* Actions */}
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
                <Button onClick={handleReset}>Reset</Button>
                <Button
                  onClick={() => {
                    form.setFieldsValue({ country: 1, city: 101 });
                    message.info('Set Country=1, City=101');
                  }}
                >
                  Set Values Programmatically
                </Button>
              </Space>
            </Form.Item>
          </Space>
        </SmartSelectProvider>
      </Form>

      {/* Debug: Show current form values */}
      <Form.Item noStyle shouldUpdate>
        {() => (
          <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
            <Text code>
              Form Values: {JSON.stringify(form.getFieldsValue())}
            </Text>
          </Card>
        )}
      </Form.Item>
    </Card>
  );
}

// ============================================================================
// Field Components
// ============================================================================

/**
 * Country Select - standalone with infinite scroll
 * Uses Form.Item's value/onChange via Ant Design's field injection
 */
function CountrySelect({
  value,
  onChange,
}: {
  value?: number;
  onChange?: (v: any) => void;
}) {
  const config = useMemo(
    () => ({
      queryKey: 'antd-form-countries',
      fetchList: fetchCountries,
      pageSize: 20,
      getItemId: (item: Country) => item.id,
      getItemLabel: (item: Country) => item.name,
    }),
    [],
  );

  return (
    <Select.Dependent name="country" value={value} onChange={onChange}>
      {({ value: depValue, onChange: depOnChange }) => (
        <Select.Infinite
          config={config}
          value={depValue}
          onChange={depOnChange}
        >
          {({ options, isLoading, onScroll, onOpenChange }) => (
            <AntdSelect
              style={{ width: '100%' }}
              placeholder="Select country..."
              options={options.map((o) => ({ label: o.label, value: o.value }))}
              loading={isLoading}
              value={depValue as any}
              onChange={depOnChange}
              onPopupScroll={onScroll}
              onDropdownVisibleChange={onOpenChange}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          )}
        </Select.Infinite>
      )}
    </Select.Dependent>
  );
}

/**
 * City Select - depends on country, with infinite scroll
 */
function CitySelect({
  value,
  onChange,
}: {
  value?: number;
  onChange?: (v: any) => void;
}) {
  return (
    <Select.Dependent
      name="city"
      dependsOn="country"
      value={value}
      onChange={onChange}
      config={{ onDependencyChange: () => undefined }} // Reset when country changes
    >
      {({
        value: depValue,
        onChange: depOnChange,
        dependencyValues,
        isDisabledByDependency,
      }) => (
        <CitySelectInner
          depValue={depValue}
          depOnChange={depOnChange}
          countryId={dependencyValues.country as number | undefined}
          isDisabledByDependency={isDisabledByDependency}
        />
      )}
    </Select.Dependent>
  );
}

// Extract inner component to properly use hooks
function CitySelectInner({
  depValue,
  depOnChange,
  countryId,
  isDisabledByDependency,
}: {
  depValue: any;
  depOnChange: any;
  countryId: number | undefined;
  isDisabledByDependency: boolean;
}) {
  const config = useMemo(
    () => ({
      queryKey: `antd-form-cities-${countryId ?? 'none'}`,
      fetchList: (req: FetchRequest) => fetchCities({ ...req, countryId }),
      pageSize: 20,
      getItemId: (item: City) => item.id,
      getItemLabel: (item: City) => item.name,
    }),
    [countryId],
  );

  return (
    <Select.Infinite config={config} value={depValue} onChange={depOnChange}>
      {({ options, isLoading, onScroll, onOpenChange }) => (
        <AntdSelect
          style={{ width: '100%' }}
          placeholder={
            isDisabledByDependency ? 'Select country first' : 'Select city...'
          }
          options={options.map((o) => ({ label: o.label, value: o.value }))}
          loading={isLoading}
          value={depValue as any}
          onChange={depOnChange}
          disabled={isDisabledByDependency}
          onPopupScroll={onScroll}
          onDropdownVisibleChange={onOpenChange}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label as string)
              ?.toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      )}
    </Select.Infinite>
  );
}

export default AntdFormDemo;
