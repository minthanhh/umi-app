/**
 * SmartSelect Demo - Shows different usage patterns
 */

import { Select as AntdSelect, Card, Divider, Space, Typography } from 'antd';
import { useMemo } from 'react';

import {
  Select,
  SmartSelectProvider,
  type FetchRequest,
  type FetchResponse,
  type InfiniteConfig,
} from '../index';

const { Title, Text } = Typography;

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

interface District {
  id: number;
  name: string;
  cityId: number;
  [key: string]: unknown;
}

// Generate mock data
const mockCountries: Country[] = Array.from({ length: 100 }, (_, i) => ({
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

const mockDistricts: District[] = mockCities.flatMap((city) =>
  Array.from({ length: 10 }, (_, i) => ({
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

// ============================================================================
// API Functions
// ============================================================================

async function fetchCountries(
  req: FetchRequest,
): Promise<FetchResponse<Country>> {
  await delay(300);
  const start = (req.current - 1) * req.pageSize;
  const data = mockCountries.slice(start, start + req.pageSize);
  return { data, hasMore: start + req.pageSize < mockCountries.length };
}

async function fetchCities(
  req: FetchRequest & { countryId?: number | number[] },
): Promise<FetchResponse<City>> {
  await delay(300);
  let filtered = mockCities;

  if (req.countryId) {
    const countryIds = Array.isArray(req.countryId)
      ? req.countryId
      : [req.countryId];
    filtered = mockCities.filter((c) => countryIds.includes(c.countryId));
  }

  const start = (req.current - 1) * req.pageSize;
  const data = filtered.slice(start, start + req.pageSize);
  return { data, hasMore: start + req.pageSize < filtered.length };
}

async function fetchDistricts(
  req: FetchRequest & { cityId?: number | number[] },
): Promise<FetchResponse<District>> {
  await delay(300);
  let filtered = mockDistricts;

  if (req.cityId) {
    const cityIds = Array.isArray(req.cityId) ? req.cityId : [req.cityId];
    filtered = mockDistricts.filter((d) => cityIds.includes(d.cityId));
  }

  const start = (req.current - 1) * req.pageSize;
  const data = filtered.slice(start, start + req.pageSize);
  return { data, hasMore: start + req.pageSize < filtered.length };
}

// ============================================================================
// Demo 1: Standalone Infinite Select
// ============================================================================

function InfiniteOnlyDemo() {
  const config: InfiniteConfig<Country> = useMemo(
    () => ({
      queryKey: 'countries-standalone',
      fetchList: fetchCountries,
      pageSize: 20,
      getItemId: (item) => item.id,
      getItemLabel: (item) => item.name,
    }),
    [],
  );

  return (
    <Card title="1. Standalone Infinite Select" size="small">
      <Text type="secondary">No dependencies, just infinite scroll</Text>
      <div style={{ marginTop: 16 }}>
        <Select.Infinite config={config}>
          {({
            options,
            isLoading,
            isFetchingMore,
            onScroll,
            onOpenChange,
            onChange,
            value,
          }) => (
            <AntdSelect
              style={{ width: 300 }}
              placeholder="Select a country..."
              options={options.map((o) => ({ label: o.label, value: o.value }))}
              loading={isLoading || isFetchingMore}
              value={value as any}
              onChange={onChange}
              onPopupScroll={onScroll}
              onDropdownVisibleChange={onOpenChange}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          )}
        </Select.Infinite>
      </div>
    </Card>
  );
}

// ============================================================================
// Demo 2: Standalone Dependent Select (no infinite)
// ============================================================================

function DependentOnlyDemo() {
  return (
    <SmartSelectProvider>
      <Card title="2. Standalone Dependent Select" size="small">
        <Text type="secondary">Simple dependency, no infinite scroll</Text>
        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
          {/* Parent: Country */}
          <Select.Dependent name="country2">
            {({ value, onChange }) => (
              <AntdSelect
                style={{ width: 300 }}
                placeholder="Select country..."
                value={value as any}
                onChange={onChange}
                options={mockCountries.slice(0, 10).map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            )}
          </Select.Dependent>

          {/* Child: City (depends on country) */}
          <Select.Dependent
            name="city2"
            dependsOn="country2"
            config={{
              onDependencyChange: (params) => {
                console.log({ params });

                return undefined;
              }, // Reset when country changes
            }}
          >
            {({
              value,
              onChange,
              dependencyValues,
              isDisabledByDependency,
            }) => {
              const countryId = dependencyValues.country2 as number | undefined;
              const cityOptions = countryId
                ? mockCities
                    .filter((c) => c.countryId === countryId)
                    .slice(0, 10)
                : [];

              return (
                <AntdSelect
                  style={{ width: 300 }}
                  placeholder={
                    isDisabledByDependency
                      ? 'Select country first'
                      : 'Select city...'
                  }
                  value={value as any}
                  onChange={onChange}
                  disabled={isDisabledByDependency}
                  options={cityOptions.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              );
            }}
          </Select.Dependent>
        </Space>
      </Card>
    </SmartSelectProvider>
  );
}

// ============================================================================
// Demo 3: Combined - Dependent + Infinite
// ============================================================================

function CombinedDemo() {
  return (
    <SmartSelectProvider>
      <Card title="3. Combined: Dependent + Infinite" size="small">
        <Text type="secondary">
          Both dependency tracking AND infinite scroll
        </Text>
        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
          {/* Parent: Country with Infinite */}
          <Select.Dependent name="country3">
            {({ value, onChange }) => (
              <Select.Infinite<Country>
                config={{
                  queryKey: 'countries-combined',
                  fetchList: fetchCountries,
                  pageSize: 20,
                  getItemId: (item) => item.id,
                  getItemLabel: (item) => item.name,
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

          {/* Child: City with Infinite (depends on country) */}
          <Select.Dependent
            name="city3"
            dependsOn="country3"
            config={{ onDependencyChange: () => undefined }}
          >
            {({
              value,
              onChange,
              dependencyValues,
              isDisabledByDependency,
            }) => {
              const countryId = dependencyValues.country3 as number | undefined;

              return (
                <Select.Infinite<City>
                  config={{
                    queryKey: `cities-combined-${countryId ?? 'none'}`,
                    fetchList: (req) => fetchCities({ ...req, countryId }),
                    pageSize: 20,
                    getItemId: (item) => item.id,
                    getItemLabel: (item) => item.name,
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
            }}
          </Select.Dependent>

          {/* Grandchild: District (depends on city) */}
          <Select.Dependent
            name="district3"
            dependsOn="city3"
            config={{ onDependencyChange: () => undefined }}
          >
            {({
              value,
              onChange,
              dependencyValues,
              isDisabledByDependency,
            }) => {
              const cityId = dependencyValues.city3 as number | undefined;

              return (
                <Select.Infinite<District>
                  config={{
                    queryKey: `districts-combined-${cityId ?? 'none'}`,
                    fetchList: (req) => fetchDistricts({ ...req, cityId }),
                    pageSize: 20,
                    getItemId: (item) => item.id,
                    getItemLabel: (item) => item.name,
                  }}
                  value={value}
                  onChange={onChange}
                >
                  {({ options, isLoading, onScroll, onOpenChange }) => (
                    <AntdSelect
                      style={{ width: 300 }}
                      placeholder={
                        isDisabledByDependency
                          ? 'Select city first'
                          : 'Select district...'
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
            }}
          </Select.Dependent>
        </Space>
      </Card>
    </SmartSelectProvider>
  );
}

// ============================================================================
// Demo 4: Multiple Dependencies
// ============================================================================

function MultipleDependenciesDemo() {
  return (
    <SmartSelectProvider>
      <Card title="4. Multiple Dependencies" size="small">
        <Text type="secondary">Field depends on multiple parents</Text>
        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
          {/* Parent 1: Country */}
          <Select.Dependent name="countryMulti">
            {({ value, onChange }) => (
              <AntdSelect
                style={{ width: 300 }}
                placeholder="Select country..."
                value={value as any}
                onChange={onChange}
                options={mockCountries.slice(0, 5).map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            )}
          </Select.Dependent>

          {/* Parent 2: Category */}
          <Select.Dependent name="categoryMulti">
            {({ value, onChange }) => (
              <AntdSelect
                style={{ width: 300 }}
                placeholder="Select category..."
                value={value as any}
                onChange={onChange}
                options={[
                  { label: 'Category A', value: 'A' },
                  { label: 'Category B', value: 'B' },
                  { label: 'Category C', value: 'C' },
                ]}
              />
            )}
          </Select.Dependent>

          {/* Child: Depends on BOTH country AND category */}
          <Select.Dependent
            name="itemMulti"
            dependsOn={['countryMulti', 'categoryMulti']}
            config={{ onDependencyChange: () => undefined }}
          >
            {({
              value,
              onChange,
              dependencyValues,
              isDisabledByDependency,
            }) => {
              const country = dependencyValues.countryMulti;
              const category = dependencyValues.categoryMulti;

              return (
                <AntdSelect
                  style={{ width: 300 }}
                  placeholder={
                    isDisabledByDependency
                      ? 'Select country AND category first'
                      : `Items for Country ${country}, Category ${category}`
                  }
                  value={value as any}
                  onChange={onChange}
                  disabled={isDisabledByDependency}
                  options={[
                    { label: `Item ${country}-${category}-1`, value: 1 },
                    { label: `Item ${country}-${category}-2`, value: 2 },
                    { label: `Item ${country}-${category}-3`, value: 3 },
                  ]}
                />
              );
            }}
          </Select.Dependent>
        </Space>
      </Card>
    </SmartSelectProvider>
  );
}

// ============================================================================
// Main Demo Component
// ============================================================================

export function SmartSelectDemo() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>SmartSelect Demo</Title>
      <Text>
        Compound component with independent Infinite and Dependent wrappers that
        can be composed together.
      </Text>

      <Divider />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <InfiniteOnlyDemo />
        <DependentOnlyDemo />
        <CombinedDemo />
        <MultipleDependenciesDemo />
      </Space>
    </div>
  );
}

export default SmartSelectDemo;
