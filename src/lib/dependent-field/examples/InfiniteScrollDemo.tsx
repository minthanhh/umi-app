/**
 * Demo: Infinite Scroll with Dependent Fields
 *
 * Example: Country → City → District
 * Each select has infinite scroll and depends on parent
 */

import { Card, Form, Space, Typography } from 'antd';
import { useMemo } from 'react';

import { createAntdAdapter } from '../adapters';
import { InfiniteDependentSelect } from '../components/InfiniteDependentSelect';
import { DependentFieldProvider } from '../context';
import type { BaseItem, InfiniteFieldConfig } from '../hooks';
import type { DependentFieldConfig } from '../types';

const { Title, Text } = Typography;

// ============================================================================
// Mock Data Types
// ============================================================================

interface Country extends BaseItem {
  id: number;
  name: string;
  code: string;
}

interface City extends BaseItem {
  id: number;
  name: string;
  countryId: number;
}

interface District extends BaseItem {
  id: number;
  name: string;
  cityId: number;
}

// ============================================================================
// Mock API Functions
// ============================================================================

// Generate mock countries
const mockCountries: Country[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Country ${i + 1}`,
  code: `C${i + 1}`,
}));

// Generate mock cities (10 cities per country)
const mockCities: City[] = mockCountries.flatMap((country) =>
  Array.from({ length: 10 }, (_, i) => ({
    id: country.id * 100 + i + 1,
    name: `City ${country.id}-${i + 1}`,
    countryId: country.id,
  })),
);

// Generate mock districts (5 districts per city)
const mockDistricts: District[] = mockCities.flatMap((city) =>
  Array.from({ length: 5 }, (_, i) => ({
    id: city.id * 100 + i + 1,
    name: `District ${city.id}-${i + 1}`,
    cityId: city.id,
  })),
);

// Simulate API delay
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

// API: Fetch countries with pagination
async function fetchCountries(params: {
  current: number;
  pageSize: number;
  ids?: Array<string | number>;
}) {
  await delay(500);

  let data = mockCountries;

  // Filter by IDs if provided (for hydration)
  if (params.ids?.length) {
    data = data.filter((c) => params.ids!.includes(c.id));
  }

  // Paginate
  const start = (params.current - 1) * params.pageSize;
  const end = start + params.pageSize;
  const pageData = data.slice(start, end);

  return {
    data: pageData,
    total: data.length,
    hasMore: end < data.length,
  };
}

// API: Fetch cities with pagination and parent filter
async function fetchCities(params: {
  current: number;
  pageSize: number;
  parentValue?: number | number[];
  ids?: Array<string | number>;
}) {
  await delay(500);

  let data = mockCities;

  // Filter by parent country
  if (params.parentValue) {
    const countryIds = Array.isArray(params.parentValue)
      ? params.parentValue
      : [params.parentValue];
    data = data.filter((c) => countryIds.includes(c.countryId));
  }

  // Filter by IDs if provided (for hydration)
  if (params.ids?.length) {
    data = data.filter((c) => params.ids!.includes(c.id));
  }

  // Paginate
  const start = (params.current - 1) * params.pageSize;
  const end = start + params.pageSize;
  const pageData = data.slice(start, end);

  return {
    data: pageData,
    total: data.length,
    hasMore: end < data.length,
  };
}

// API: Fetch districts with pagination and parent filter
async function fetchDistricts(params: {
  current: number;
  pageSize: number;
  parentValue?: number | number[];
  ids?: Array<string | number>;
}) {
  await delay(500);

  let data = mockDistricts;

  // Filter by parent city
  if (params.parentValue) {
    const cityIds = Array.isArray(params.parentValue)
      ? params.parentValue
      : [params.parentValue];
    data = data.filter((d) => cityIds.includes(d.cityId));
  }

  // Filter by IDs if provided (for hydration)
  if (params.ids?.length) {
    data = data.filter((d) => params.ids!.includes(d.id));
  }

  // Paginate
  const start = (params.current - 1) * params.pageSize;
  const end = start + params.pageSize;
  const pageData = data.slice(start, end);

  return {
    data: pageData,
    total: data.length,
    hasMore: end < data.length,
  };
}

// ============================================================================
// Demo Component
// ============================================================================

export function InfiniteScrollDemo() {
  const [form] = Form.useForm();

  // Create Antd adapter
  const adapter = useMemo(() => createAntdAdapter(form), [form]);

  // Define field configs for dependency tracking
  const fieldConfigs: DependentFieldConfig[] = useMemo(
    () => [
      { name: 'country' },
      {
        name: 'city',
        dependsOn: 'country',
        onDependencyChange: ({ setValue, hasChanged }) => {
          if (hasChanged('country')) {
            setValue(undefined); // Reset when country changes
          }
        },
      },
      {
        name: 'district',
        dependsOn: 'city',
        onDependencyChange: ({ setValue, hasChanged }) => {
          if (hasChanged('city')) {
            setValue(undefined); // Reset when city changes
          }
        },
      },
    ],
    [],
  );

  // Infinite scroll configs for each field
  const countryConfig: InfiniteFieldConfig<Country> = useMemo(
    () => ({
      queryKey: 'countries',
      fetchList: fetchCountries,
      pageSize: 10,
      fetchStrategy: 'lazy',
      getItemId: (item) => item.id,
      getItemLabel: (item) => item.name,
    }),
    [],
  );

  const cityConfig: InfiniteFieldConfig<City> = useMemo(
    () => ({
      queryKey: 'cities',
      fetchList: fetchCities,
      pageSize: 10,
      fetchStrategy: 'lazy',
      getItemId: (item) => item.id,
      getItemLabel: (item) => item.name,
    }),
    [],
  );

  const districtConfig: InfiniteFieldConfig<District> = useMemo(
    () => ({
      queryKey: 'districts',
      fetchList: fetchDistricts,
      pageSize: 10,
      fetchStrategy: 'lazy',
      getItemId: (item) => item.id,
      getItemLabel: (item) => item.name,
    }),
    [],
  );

  const handleValuesChange = (_changedValues: any, allValues: any) => {
    console.log('Form values:', allValues);
  };

  return (
    <Card>
      <Title level={4}>Infinite Scroll + Dependent Fields Demo</Title>
      <Text type="secondary">
        Each select loads data on scroll. City depends on Country, District
        depends on City.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        style={{ marginTop: 24 }}
      >
        <DependentFieldProvider configs={fieldConfigs} adapter={adapter}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item label="Country" name="country">
              <InfiniteDependentSelect<Country>
                name="country"
                infiniteConfig={countryConfig}
                placeholder="Select a country..."
                style={{ width: 300 }}
              />
            </Form.Item>

            <Form.Item label="City" name="city">
              <InfiniteDependentSelect<City>
                name="city"
                infiniteConfig={cityConfig}
                placeholder="Select a city..."
                style={{ width: 300 }}
              />
            </Form.Item>

            <Form.Item label="District" name="district">
              <InfiniteDependentSelect<District>
                name="district"
                infiniteConfig={districtConfig}
                placeholder="Select a district..."
                style={{ width: 300 }}
              />
            </Form.Item>
          </Space>
        </DependentFieldProvider>
      </Form>
    </Card>
  );
}

export default InfiniteScrollDemo;
