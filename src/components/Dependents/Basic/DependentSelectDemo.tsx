/**
 * DependentSelect - Demo Component
 *
 * Example showing how to use DependentSelect for cascading selects:
 * Country -> Province/State -> City -> District
 *
 * Features demonstrated:
 * - Single select (Country)
 * - Multiple select with cascade delete (Province, City)
 * - Async options loading
 * - Custom filter logic
 * - Dynamic configs change (to test store lifecycle)
 * - Controlled mode with value prop
 * - Fake API fetching when switching configs
 */

import { useEffect, useState } from 'react';

import {
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  Radio,
  Space,
  Spin,
  Typography,
} from 'antd';

import {
  DependentSelectProvider,
  FormDependentSelectField,
} from './index';
import type { DependentFieldConfig, FormAdapter, SelectOption } from './types';

const { Title, Text } = Typography;

// ============================================================================
// Sample Data - Config Set 1: Location (Country -> Province -> City -> Ward)
// ============================================================================

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
  // Ho Chi Minh City districts (as cities for demo)
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
  { label: 'HK', value: 'HK', parentValue: 'HK' },
  // District 7
  { label: 'Tan Phong Ward', value: 'TP', parentValue: 'D7' },
  { label: 'Phu My Ward', value: 'PM', parentValue: 'D7' },
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

// ============================================================================
// Sample Data - Config Set 2: Category (Category -> SubCategory -> Product)
// ============================================================================

const categories: SelectOption[] = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Books', value: 'books' },
];

const subCategories: SelectOption[] = [
  // Electronics
  { label: 'Phones', value: 'phones', parentValue: 'electronics' },
  { label: 'Laptops', value: 'laptops', parentValue: 'electronics' },
  { label: 'Tablets', value: 'tablets', parentValue: 'electronics' },
  // Clothing
  { label: 'Men', value: 'men', parentValue: 'clothing' },
  { label: 'Women', value: 'women', parentValue: 'clothing' },
  { label: 'Kids', value: 'kids', parentValue: 'clothing' },
  // Books
  { label: 'Fiction', value: 'fiction', parentValue: 'books' },
  { label: 'Non-Fiction', value: 'nonfiction', parentValue: 'books' },
  { label: 'Technical', value: 'technical', parentValue: 'books' },
];

const products: SelectOption[] = [
  // Phones
  { label: 'iPhone 15', value: 'iphone15', parentValue: 'phones' },
  { label: 'Samsung Galaxy S24', value: 'galaxy24', parentValue: 'phones' },
  { label: 'Google Pixel 8', value: 'pixel8', parentValue: 'phones' },
  // Laptops
  { label: 'MacBook Pro', value: 'mbp', parentValue: 'laptops' },
  { label: 'Dell XPS', value: 'xps', parentValue: 'laptops' },
  { label: 'ThinkPad X1', value: 'x1', parentValue: 'laptops' },
  // Tablets
  { label: 'iPad Pro', value: 'ipadpro', parentValue: 'tablets' },
  { label: 'Galaxy Tab', value: 'gtab', parentValue: 'tablets' },
  // Men
  { label: 'T-Shirts', value: 'tshirts_m', parentValue: 'men' },
  { label: 'Jeans', value: 'jeans_m', parentValue: 'men' },
  // Women
  { label: 'Dresses', value: 'dresses', parentValue: 'women' },
  { label: 'Blouses', value: 'blouses', parentValue: 'women' },
  // Fiction
  { label: 'Harry Potter', value: 'hp', parentValue: 'fiction' },
  { label: 'Lord of the Rings', value: 'lotr', parentValue: 'fiction' },
  // Technical
  { label: 'Clean Code', value: 'cleancode', parentValue: 'technical' },
  { label: 'Design Patterns', value: 'patterns', parentValue: 'technical' },
];

// ============================================================================
// Sample Data - Config Set 3: Simple 2-level (Brand -> Model)
// ============================================================================

const brands: SelectOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Samsung', value: 'samsung' },
  { label: 'Sony', value: 'sony' },
];

const models: SelectOption[] = [
  { label: 'iPhone', value: 'iphone', parentValue: 'apple' },
  { label: 'iPad', value: 'ipad', parentValue: 'apple' },
  { label: 'MacBook', value: 'macbook', parentValue: 'apple' },
  { label: 'Galaxy S', value: 'galaxys', parentValue: 'samsung' },
  { label: 'Galaxy Note', value: 'galaxynote', parentValue: 'samsung' },
  { label: 'PlayStation', value: 'ps', parentValue: 'sony' },
  { label: 'Xperia', value: 'xperia', parentValue: 'sony' },
];

// ============================================================================
// Configuration Sets
// ============================================================================

type ConfigSetType = 'location' | 'category' | 'brand';

const CONFIG_SETS: Record<ConfigSetType, DependentFieldConfig[]> = {
  location: [
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
  ],
  category: [
    {
      name: 'category',
      label: 'Category',
      placeholder: 'Select a category',
      options: categories,
    },
    {
      name: 'subCategory',
      label: 'Sub Category',
      placeholder: 'Select sub categories',
      mode: 'multiple',
      dependsOn: 'category',
      options: subCategories,
    },
    {
      name: 'product',
      label: 'Product',
      placeholder: 'Select products',
      mode: 'multiple',
      dependsOn: 'subCategory',
      options: products,
    },
  ],
  brand: [
    {
      name: 'brand',
      label: 'Brand',
      placeholder: 'Select a brand',
      options: brands,
    },
    {
      name: 'model',
      label: 'Model',
      placeholder: 'Select models',
      mode: 'multiple',
      dependsOn: 'brand',
      options: models,
    },
  ],
};

const CONFIG_LABELS: Record<ConfigSetType, string> = {
  location: 'Location (4 levels)',
  category: 'Category (3 levels)',
  brand: 'Brand (2 levels)',
};

// ============================================================================
// Initial Values for each config set
// ============================================================================

const INITIAL_VALUES: Record<ConfigSetType, Record<string, any>> = {
  location: {
    country: 'VN',
    province: ['HCM', 'HN'],
    city: ['D1', 'D7', 'HK'],
    ward: ['BN', 'TP'],
  },
  category: {
    category: 'electronics',
    subCategory: ['phones', 'laptops'],
    product: ['iphone15', 'mbp'],
  },
  brand: {
    brand: 'apple',
    model: ['iphone', 'macbook'],
  },
};

// ============================================================================
// Fake API - Simulates fetching data from server
// ============================================================================

interface FetchedData {
  configs: DependentFieldConfig[];
  values: Record<string, any>;
}

/**
 * Fake API that simulates fetching config and values from server
 * Returns different data based on configType
 */
const fakeApi = {
  /**
   * Fetch both configs and values (full data)
   */
  fetchData: (configType: ConfigSetType): Promise<FetchedData> => {
    return new Promise((resolve) => {
      const delay = 500 + Math.random() * 1000;

      console.log(
        `[Fake API] Fetching configs + values for "${configType}"... (delay: ${delay.toFixed(0)}ms)`,
      );

      setTimeout(() => {
        console.log(`[Fake API] Data fetched for "${configType}"`);
        resolve({
          configs: CONFIG_SETS[configType],
          values: INITIAL_VALUES[configType],
        });
      }, delay);
    });
  },

  /**
   * Fetch only configs (simulates dynamic form configuration from server)
   */
  fetchConfigs: (configType: ConfigSetType): Promise<DependentFieldConfig[]> => {
    return new Promise((resolve) => {
      const delay = 400 + Math.random() * 600;

      console.log(
        `[Fake API] Fetching CONFIGS for "${configType}"... (delay: ${delay.toFixed(0)}ms)`,
      );

      setTimeout(() => {
        console.log(`[Fake API] Configs fetched for "${configType}"`);
        resolve(CONFIG_SETS[configType]);
      }, delay);
    });
  },

  /**
   * Fetch only values (simulates loading saved form data)
   */
  fetchValues: (configType: ConfigSetType): Promise<Record<string, any>> => {
    return new Promise((resolve) => {
      const delay = 300 + Math.random() * 500;

      console.log(
        `[Fake API] Fetching VALUES for "${configType}"... (delay: ${delay.toFixed(0)}ms)`,
      );

      setTimeout(() => {
        console.log(`[Fake API] Values fetched for "${configType}"`);
        resolve(INITIAL_VALUES[configType]);
      }, delay);
    });
  },

  /**
   * Fetch configs first, then values (sequential - simulates real scenario)
   */
  fetchConfigsThenValues: async (
    configType: ConfigSetType,
  ): Promise<FetchedData> => {
    console.log(`[Fake API] Starting sequential fetch for "${configType}"...`);

    // Step 1: Fetch configs first
    const configs = await fakeApi.fetchConfigs(configType);

    // Step 2: Then fetch values (depends on configs being ready)
    const values = await fakeApi.fetchValues(configType);

    console.log(`[Fake API] Sequential fetch completed for "${configType}"`);
    return { configs, values };
  },
};

// ============================================================================
// Demo Component
// ============================================================================

type ValueMode = 'none' | 'initialValues' | 'controlled';
type FetchMode = 'static' | 'fetchAll' | 'fetchConfigsFirst' | 'fetchSeparate';

export function DependentSelectDemo() {
  const [configType, setConfigType] = useState<ConfigSetType>('location');
  const [valueMode, setValueMode] = useState<ValueMode>('initialValues');
  const [fetchMode, setFetchMode] = useState<FetchMode>('static');

  // Loading states
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [isLoadingValues, setIsLoadingValues] = useState(false);

  // Fetched data
  const [fetchedConfigs, setFetchedConfigs] = useState<DependentFieldConfig[] | null>(null);
  const [fetchedValues, setFetchedValues] = useState<Record<string, any> | null>(null);

  // Controlled value state (only used when valueMode === 'controlled')
  const [controlledValue, setControlledValue] = useState<Record<string, any>>({});

  const [form] = Form.useForm();

  // Create Ant Design Form adapter
  // This syncs Store changes to Form (especially cascade deletes)
  const adapter: FormAdapter = {
    onFieldChange: (name, value) => {
      console.log(`[Adapter] Setting field "${name}" to:`, value);
      form.setFieldValue(name, value);
    },
    onFieldsChange: (changedFields) => {
      console.log('[Adapter] Setting multiple fields:', changedFields);
      form.setFieldsValue(
        Object.fromEntries(changedFields.map((f) => [f.name, f.value])),
      );
    },
  };

  // Fetch data when configType or fetchMode changes
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      // Reset states
      setFetchedConfigs(null);
      setFetchedValues(null);
      form.resetFields();

      if (fetchMode === 'static') {
        // Use static data, no API call
        console.log('[Demo] Using static configs and values');
        return;
      }

      try {
        if (fetchMode === 'fetchAll') {
          // Fetch configs + values in one call
          setIsLoadingConfigs(true);
          setIsLoadingValues(true);

          const data = await fakeApi.fetchData(configType);

          if (!cancelled) {
            setFetchedConfigs(data.configs);
            setFetchedValues(data.values);

            if (valueMode === 'controlled') {
              setControlledValue(data.values);
            }
            form.setFieldsValue(data.values);
          }
        } else if (fetchMode === 'fetchConfigsFirst') {
          // Sequential: configs first, then values
          setIsLoadingConfigs(true);

          const configs = await fakeApi.fetchConfigs(configType);
          if (cancelled) return;

          setFetchedConfigs(configs);
          setIsLoadingConfigs(false);

          // Now fetch values
          setIsLoadingValues(true);
          const values = await fakeApi.fetchValues(configType);

          if (!cancelled) {
            setFetchedValues(values);
            if (valueMode === 'controlled') {
              setControlledValue(values);
            }
            form.setFieldsValue(values);
          }
        } else if (fetchMode === 'fetchSeparate') {
          // Parallel: fetch configs and values separately
          setIsLoadingConfigs(true);
          setIsLoadingValues(true);

          const [configs, values] = await Promise.all([
            fakeApi.fetchConfigs(configType),
            fakeApi.fetchValues(configType),
          ]);

          if (!cancelled) {
            setFetchedConfigs(configs);
            setFetchedValues(values);

            if (valueMode === 'controlled') {
              setControlledValue(values);
            }
            form.setFieldsValue(values);
          }
        }
      } catch (error) {
        console.error('[Demo] Error fetching data:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingConfigs(false);
          setIsLoadingValues(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [configType, fetchMode, form, valueMode]);

  // Current configs (from fetched data or fallback to static)
  const currentConfigs = fetchedConfigs ?? CONFIG_SETS[configType];

  // Current initial values
  const currentInitialValues = fetchedValues ?? INITIAL_VALUES[configType];

  // Determine what to pass to provider based on mode
  const getProviderProps = () => {
    switch (valueMode) {
      case 'none':
        return {};
      case 'initialValues':
        return { initialValues: currentInitialValues };
      case 'controlled':
        return { value: controlledValue };
      default:
        return {};
    }
  };

  const handleSubmit = (values: Record<string, any>) => {
    console.log('[Demo] Form submitted with values:', values);
  };

  const handleConfigChange = (newType: ConfigSetType) => {
    console.log(`[Demo] Switching config from "${configType}" to "${newType}"`);
    form.resetFields();
    setControlledValue({});
    setConfigType(newType);
  };

  const handleValueModeChange = (newMode: ValueMode) => {
    console.log(`[Demo] Switching value mode from "${valueMode}" to "${newMode}"`);
    setValueMode(newMode);

    // Reset and refetch when mode changes
    if (newMode === 'controlled' && fetchedValues) {
      setControlledValue(fetchedValues);
    } else if (newMode === 'controlled' && fetchMode === 'static') {
      setControlledValue(INITIAL_VALUES[configType]);
    } else if (newMode === 'none') {
      setControlledValue({});
      form.resetFields();
    }
  };

  const handleFetchModeChange = (newMode: FetchMode) => {
    console.log(`[Demo] Switching fetch mode from "${fetchMode}" to "${newMode}"`);
    setFetchMode(newMode);
  };

  const handleRefetchValues = async () => {
    setIsLoadingValues(true);
    try {
      const values = await fakeApi.fetchValues(configType);
      setFetchedValues(values);
      if (valueMode === 'controlled') {
        setControlledValue(values);
      }
      form.setFieldsValue(values);
    } finally {
      setIsLoadingValues(false);
    }
  };

  const handleRefetchConfigs = async () => {
    setIsLoadingConfigs(true);
    setFetchedConfigs(null);
    try {
      const configs = await fakeApi.fetchConfigs(configType);
      setFetchedConfigs(configs);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  // Don't render provider until configs are ready (when fetching)
  const shouldRenderProvider =
    fetchMode === 'static' || (fetchedConfigs !== null && !isLoadingConfigs);

  return (
    <Card>
      <Title level={4}>Dependent Select Demo (Store Lifecycle Test)</Title>

      {/* Config Switcher */}
      <Flex vertical gap="middle" style={{ marginBottom: 24 }}>
        <div>
          <Text strong>1. Select Config Set:</Text>
          <div style={{ marginTop: 8 }}>
            <Radio.Group
              value={configType}
              onChange={(e) => handleConfigChange(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              {(Object.keys(CONFIG_SETS) as ConfigSetType[]).map((key) => (
                <Radio.Button key={key} value={key}>
                  {CONFIG_LABELS[key]}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </div>

        {/* Fetch Mode Switcher */}
        <div>
          <Text strong>2. Select Fetch Mode (how to get configs/values):</Text>
          <div style={{ marginTop: 8 }}>
            <Radio.Group
              value={fetchMode}
              onChange={(e) => handleFetchModeChange(e.target.value)}
              optionType="button"
            >
              <Radio.Button value="static">Static (no API)</Radio.Button>
              <Radio.Button value="fetchAll">Fetch All</Radio.Button>
              <Radio.Button value="fetchConfigsFirst">
                Configs First
              </Radio.Button>
              <Radio.Button value="fetchSeparate">Parallel Fetch</Radio.Button>
            </Radio.Group>
          </div>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            {fetchMode === 'static' && 'Uses hardcoded configs and values'}
            {fetchMode === 'fetchAll' && 'Fetches configs + values in one API call'}
            {fetchMode === 'fetchConfigsFirst' && 'Fetches configs first, then values (sequential)'}
            {fetchMode === 'fetchSeparate' && 'Fetches configs and values in parallel'}
          </Text>
        </div>

        {/* Value Mode Switcher */}
        <div>
          <Text strong>3. Select Value Mode:</Text>
          <div style={{ marginTop: 8 }}>
            <Radio.Group
              value={valueMode}
              onChange={(e) => handleValueModeChange(e.target.value)}
              optionType="button"
            >
              <Radio.Button value="none">No Initial Values</Radio.Button>
              <Radio.Button value="initialValues">
                initialValues (uncontrolled)
              </Radio.Button>
              <Radio.Button value="controlled">value (controlled)</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {/* Status Info */}
        <div
          style={{
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <Flex vertical gap={4}>
            <Text type="secondary">
              <strong>Config:</strong> <Text code>{configType}</Text>
              {' | '}
              <strong>Fetch:</strong> <Text code>{fetchMode}</Text>
              {' | '}
              <strong>Value:</strong> <Text code>{valueMode}</Text>
            </Text>
            <Text type="secondary">
              <strong>Configs:</strong>{' '}
              {isLoadingConfigs ? (
                <Text type="warning">Loading...</Text>
              ) : (
                <Text type="success">
                  Ready ({currentConfigs.map((c) => c.name).join(' -> ')})
                </Text>
              )}
            </Text>
            <Text type="secondary">
              <strong>Values:</strong>{' '}
              {isLoadingValues ? (
                <Text type="warning">Loading...</Text>
              ) : fetchedValues || fetchMode === 'static' ? (
                <Text type="success">Ready</Text>
              ) : (
                <Text type="secondary">Not loaded</Text>
              )}
            </Text>
          </Flex>
        </div>
      </Flex>

      {/* Dependent Select Form */}
      {shouldRenderProvider ? (
        <Spin spinning={isLoadingValues}>
          <DependentSelectProvider
            key={`${configType}-${valueMode}-${fetchMode}`}
            configs={currentConfigs}
            adapter={adapter}
            {...getProviderProps()}
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Flex vertical gap="middle">
                {currentConfigs.map((config) => (
                  <FormDependentSelectField
                    key={config.name}
                    name={config.name}
                    label={config.label}
                  />
                ))}
              </Flex>

              <Space style={{ marginTop: 16 }} wrap>
                <Button type="primary" htmlType="submit">
                  Submit Form
                </Button>
                <Button onClick={() => form.resetFields()}>Reset Form</Button>
                <Button onClick={handleRefetchConfigs} loading={isLoadingConfigs}>
                  Refetch Configs
                </Button>
                <Button onClick={handleRefetchValues} loading={isLoadingValues}>
                  Refetch Values
                </Button>
              </Space>
            </Form>
          </DependentSelectProvider>
        </Spin>
      ) : (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            background: '#fafafa',
            borderRadius: 8,
          }}
        >
          <Spin tip="Loading configs from API..." />
        </div>
      )}

      {/* Debug Info */}
      <div style={{ marginTop: 24 }}>
        <Checkbox
          onChange={(e) => {
            const debugEl = document.getElementById('debug-info');
            if (debugEl) {
              debugEl.style.display = e.target.checked ? 'block' : 'none';
            }
          }}
        >
          Show Debug Info
        </Checkbox>
        <pre
          id="debug-info"
          style={{
            display: 'none',
            marginTop: 8,
            padding: 12,
            background: '#1a1a1a',
            color: '#0f0',
            borderRadius: 8,
            fontSize: 12,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(
            {
              configType,
              fetchMode,
              valueMode,
              isLoadingConfigs,
              isLoadingValues,
              fetchedConfigs: fetchedConfigs?.map((c) => c.name) ?? null,
              fetchedValues,
              controlledValue,
              currentInitialValues,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </Card>
  );
}

export default DependentSelectDemo;