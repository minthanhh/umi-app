/**
 * SmartSelect + React Hook Form Integration Demo
 *
 * Note: This is a reference implementation.
 * Install react-hook-form to use: npm install react-hook-form
 */

import { Select as AntdSelect, Card, Space, Typography } from 'antd';
import { useMemo } from 'react';

import {
  Select,
  SmartSelectProvider,
  createRHFAdapter,
  type FetchRequest,
  type FetchResponse,
} from '../index';

const { Title, Text, Paragraph } = Typography;

// ============================================================================
// Mock Data
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
// Demo Component (Simulated RHF - for reference)
// ============================================================================

/**
 * This demo shows the pattern for React Hook Form integration.
 *
 * In a real app with RHF installed, you would use:
 *
 * ```tsx
 * import { useForm, Controller } from 'react-hook-form';
 *
 * function MyForm() {
 *   const { control, handleSubmit, setValue, getValues } = useForm();
 *   const adapter = createRHFAdapter({ setValue, getValues });
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <SmartSelectProvider adapter={adapter}>
 *         <Controller
 *           name="country"
 *           control={control}
 *           render={({ field }) => (
 *             <Select.Dependent name="country" value={field.value} onChange={field.onChange}>
 *               {(props) => <AntdSelect {...props} />}
 *             </Select.Dependent>
 *           )}
 *         />
 *       </SmartSelectProvider>
 *     </form>
 *   );
 * }
 * ```
 */
export function RHFDemo() {
  // Simulate RHF's useForm
  const formValues = useMemo(
    () => ({ country: undefined, city: undefined }),
    [],
  );

  const simulatedRHF = useMemo(
    () => ({
      setValue: (name: string, value: any) => {
        console.log(`RHF setValue: ${name} = ${value}`);
        (formValues as any)[name] = value;
      },
      getValues: (name?: string) => {
        if (name) return (formValues as any)[name];
        return formValues;
      },
    }),
    [formValues],
  );

  const adapter = useMemo(() => createRHFAdapter(simulatedRHF), [simulatedRHF]);

  return (
    <Card>
      <Title level={4}>React Hook Form Integration (Reference)</Title>
      <Text type="secondary">
        Pattern for integrating SmartSelect with React Hook Form
      </Text>

      <Paragraph style={{ marginTop: 16 }}>
        <Text code>npm install react-hook-form</Text>
      </Paragraph>

      <Card size="small" style={{ background: '#f6ffed', marginBottom: 16 }}>
        <pre style={{ margin: 0, fontSize: 12 }}>
          {`import { useForm, Controller } from 'react-hook-form';
import { Select, SmartSelectProvider, createRHFAdapter } from '@/components/SmartSelect';

function MyForm() {
  const { control, handleSubmit, setValue, getValues } = useForm();
  const adapter = createRHFAdapter({ setValue, getValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SmartSelectProvider adapter={adapter}>
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <Select.Dependent name="country" value={field.value} onChange={field.onChange}>
              {({ value, onChange, isDisabledByDependency }) => (
                <Select.Infinite config={countryConfig} value={value} onChange={onChange}>
                  {({ options, isLoading, onScroll }) => (
                    <AntdSelect
                      options={options}
                      loading={isLoading}
                      value={value}
                      onChange={onChange}
                      onPopupScroll={onScroll}
                    />
                  )}
                </Select.Infinite>
              )}
            </Select.Dependent>
          )}
        />

        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <Select.Dependent
              name="city"
              dependsOn="country"
              value={field.value}
              onChange={field.onChange}
            >
              {({ dependencyValues, isDisabledByDependency }) => (
                <Select.Infinite
                  config={{
                    queryKey: \`cities-\${dependencyValues.country}\`,
                    fetchList: (req) => fetchCities({ ...req, countryId: dependencyValues.country })
                  }}
                >
                  {({ options, isLoading }) => (
                    <AntdSelect
                      disabled={isDisabledByDependency}
                      options={options}
                      loading={isLoading}
                    />
                  )}
                </Select.Infinite>
              )}
            </Select.Dependent>
          )}
        />
      </SmartSelectProvider>
    </form>
  );
}`}
        </pre>
      </Card>

      {/* Live demo with simulated RHF */}
      <SmartSelectProvider adapter={adapter}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Country (simulated RHF field):</Text>
            <Select.Dependent name="country">
              {({ value, onChange }) => (
                <Select.Infinite
                  config={{
                    queryKey: 'rhf-countries',
                    fetchList: fetchCountries,
                    pageSize: 20,
                    getItemId: (item: Country) => item.id,
                    getItemLabel: (item: Country) => item.name,
                  }}
                  value={value}
                  onChange={onChange}
                >
                  {({ options, isLoading, onScroll, onOpenChange }) => (
                    <AntdSelect
                      style={{ width: 300 }}
                      placeholder="Select country..."
                      options={options.map((o) => ({
                        label: o.label,
                        value: o.value,
                      }))}
                      loading={isLoading}
                      value={value as any}
                      onChange={onChange}
                      onPopupScroll={onScroll}
                      onDropdownVisibleChange={onOpenChange}
                    />
                  )}
                </Select.Infinite>
              )}
            </Select.Dependent>
          </div>

          <div>
            <Text strong>City (depends on Country):</Text>
            <Select.Dependent
              name="city"
              dependsOn="country"
              config={{ onDependencyChange: () => undefined }}
            >
              {({
                value,
                onChange,
                dependencyValues,
                isDisabledByDependency,
              }) => {
                const countryId = dependencyValues.country as
                  | number
                  | undefined;

                return (
                  <Select.Infinite
                    config={{
                      queryKey: `rhf-cities-${countryId ?? 'none'}`,
                      fetchList: (req: FetchRequest) =>
                        fetchCities({ ...req, countryId }),
                      pageSize: 20,
                      getItemId: (item: City) => item.id,
                      getItemLabel: (item: City) => item.name,
                    }}
                    value={value}
                    onChange={onChange}
                  >
                    {({ options, isLoading, onScroll, onOpenChange }) => (
                      <AntdSelect
                        style={{ width: 300 }}
                        placeholder={
                          isDisabledByDependency
                            ? 'Select country first'
                            : 'Select city...'
                        }
                        options={options.map((o) => ({
                          label: o.label,
                          value: o.value,
                        }))}
                        loading={isLoading}
                        value={value as any}
                        onChange={onChange}
                        disabled={isDisabledByDependency}
                        onPopupScroll={onScroll}
                        onDropdownVisibleChange={onOpenChange}
                      />
                    )}
                  </Select.Infinite>
                );
              }}
            </Select.Dependent>
          </div>
        </Space>
      </SmartSelectProvider>
    </Card>
  );
}

export default RHFDemo;
