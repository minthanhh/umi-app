/**
 * DependentSelect - Type Definitions
 *
 * Core types cho hệ thống dependent select (cascading select).
 *
 * Kiến trúc:
 * - Form library là SOURCE OF TRUTH cho values (Ant Design Form, RHF, Formik...)
 * - Store quản lý: options, loading states, cascade logic
 * - Adapter đồng bộ thay đổi từ Store → Form
 *
 * Type Safety Enhancement:
 * - Branded Types: Prevent mixing field names from different contexts
 * - Template Literal Types: Type-safe store events
 * - Const Assertions: Narrow literal types for configs
 * - Discriminated Unions: Better state modeling
 */

import type { SelectProps } from 'antd';

// ============================================================================
// BRANDED TYPES - Prevent accidental mixing of field names
// ============================================================================

/**
 * Unique symbol for branding FieldName type.
 * This ensures compile-time safety when using field names.
 */
declare const __fieldNameBrand: unique symbol;

/**
 * Branded type for field names.
 * Prevents accidentally using wrong field names from different configs.
 *
 * @template TFieldNames - Union of allowed field name literals
 *
 * @example
 * ```ts
 * // Define your field names
 * type MyFieldNames = 'country' | 'province' | 'city';
 *
 * // Create typed field name
 * const countryField: FieldName<MyFieldNames> = 'country' as FieldName<MyFieldNames>;
 *
 * // TypeScript will error if you try to use wrong name
 * const wrongField: FieldName<MyFieldNames> = 'state' as FieldName<MyFieldNames>; // Error!
 * ```
 */
export type FieldName<TFieldNames extends string = string> = TFieldNames & {
  readonly [__fieldNameBrand]: TFieldNames;
};

/**
 * Helper function to create a branded FieldName.
 * Runtime: no-op, just returns the string.
 * Compile-time: ensures type safety.
 *
 * @example
 * ```ts
 * const configs = [
 *   { name: 'country', ... },
 *   { name: 'province', ... },
 * ] as const;
 *
 * type MyFieldNames = typeof configs[number]['name'];
 * const field = createFieldName<MyFieldNames>('country'); // OK
 * const wrong = createFieldName<MyFieldNames>('state'); // Error!
 * ```
 */
export function createFieldName<TFieldNames extends string>(
  name: TFieldNames,
): FieldName<TFieldNames> {
  return name as FieldName<TFieldNames>;
}

/**
 * Extract field names from a readonly config array.
 *
 * @example
 * ```ts
 * const configs = [
 *   { name: 'country', ... },
 *   { name: 'province', ... },
 * ] as const;
 *
 * type FieldNames = ExtractFieldNames<typeof configs>;
 * // Result: 'country' | 'province'
 * ```
 */
export type ExtractFieldNames<
  TConfigs extends readonly { readonly name: string }[],
> = TConfigs[number]['name'];

// ============================================================================
// TEMPLATE LITERAL TYPES - Type-safe store events
// ============================================================================

/**
 * Store event types.
 * These are the internal events that the store can emit.
 */
export type StoreEventType =
  | 'value:change'
  | 'options:change'
  | 'loading:start'
  | 'loading:end'
  | 'cascade:delete'
  | 'sync:controlled';

/**
 * Field-specific event type.
 * Combines event type with field name for type-safe event handling.
 *
 * @template TFieldName - The field name
 * @template TEvent - The event type
 *
 * @example
 * ```ts
 * type CountryValueChange = FieldEvent<'country', 'value:change'>;
 * // Result: 'country:value:change'
 * ```
 */
export type FieldEvent<
  TFieldName extends string,
  TEvent extends StoreEventType,
> = `${TFieldName}:${TEvent}`;

/**
 * All possible events for a set of field names.
 *
 * @example
 * ```ts
 * type MyFields = 'country' | 'province';
 * type AllEvents = AllFieldEvents<MyFields>;
 * // Result: 'country:value:change' | 'country:options:change' | ... | 'province:value:change' | ...
 * ```
 */
export type AllFieldEvents<TFieldNames extends string> = FieldEvent<
  TFieldNames,
  StoreEventType
>;

/**
 * Event payload map - defines the payload type for each event.
 */
export interface StoreEventPayloadMap<TValue = unknown> {
  'value:change': { previousValue: TValue; newValue: TValue };
  'options:change': { options: SelectOption[] };
  'loading:start': { fieldName: string };
  'loading:end': { fieldName: string; success: boolean };
  'cascade:delete': { affectedFields: string[]; deletedValues: Record<string, unknown> };
  'sync:controlled': { values: Record<string, unknown> };
}

/**
 * Type-safe event listener type.
 */
export type StoreEventListener<TEvent extends StoreEventType> = (
  payload: StoreEventPayloadMap[TEvent],
) => void;

// ============================================================================
// DISCRIMINATED UNIONS - Better async state modeling
// ============================================================================

/**
 * Base state interface with discriminator.
 */
interface BaseAsyncState {
  readonly status: 'idle' | 'loading' | 'success' | 'error';
}

/**
 * Idle state - no operation has started.
 */
export interface IdleState extends BaseAsyncState {
  readonly status: 'idle';
  readonly data?: undefined;
  readonly error?: undefined;
}

/**
 * Loading state - operation in progress.
 */
export interface LoadingState extends BaseAsyncState {
  readonly status: 'loading';
  readonly data?: undefined;
  readonly error?: undefined;
}

/**
 * Success state - operation completed successfully.
 */
export interface SuccessState<TData> extends BaseAsyncState {
  readonly status: 'success';
  readonly data: TData;
  readonly error?: undefined;
}

/**
 * Error state - operation failed.
 */
export interface ErrorState extends BaseAsyncState {
  readonly status: 'error';
  readonly data?: undefined;
  readonly error: Error;
}

/**
 * Discriminated union for async state.
 * Use this for modeling loading/success/error states.
 *
 * @template TData - Type of successful data
 *
 * @example
 * ```ts
 * const state: AsyncState<SelectOption[]> = {
 *   status: 'success',
 *   data: [{ label: 'Option 1', value: 1 }],
 * };
 *
 * // TypeScript narrows the type based on status
 * if (state.status === 'success') {
 *   console.log(state.data); // data is SelectOption[]
 * } else if (state.status === 'error') {
 *   console.log(state.error); // error is Error
 * }
 * ```
 */
export type AsyncState<TData> =
  | IdleState
  | LoadingState
  | SuccessState<TData>
  | ErrorState;

/**
 * Options loading state using discriminated union.
 */
export type OptionsAsyncState = AsyncState<SelectOption[]>;

/**
 * Helper functions for creating async states.
 */
export const AsyncStateHelpers = {
  idle: (): IdleState => ({ status: 'idle' }),
  loading: (): LoadingState => ({ status: 'loading' }),
  success: <TData>(data: TData): SuccessState<TData> => ({ status: 'success', data }),
  error: (error: Error): ErrorState => ({ status: 'error', error }),

  /** Type guard for idle state */
  isIdle: (state: AsyncState<unknown>): state is IdleState => state.status === 'idle',
  /** Type guard for loading state */
  isLoading: (state: AsyncState<unknown>): state is LoadingState => state.status === 'loading',
  /** Type guard for success state */
  isSuccess: <TData>(state: AsyncState<TData>): state is SuccessState<TData> => state.status === 'success',
  /** Type guard for error state */
  isError: (state: AsyncState<unknown>): state is ErrorState => state.status === 'error',
} as const;

// ============================================================================
// OPTION TYPES - Định nghĩa cấu trúc option cho select
// ============================================================================

/**
 * Cấu trúc một option trong select dropdown.
 *
 * @property label - Text hiển thị cho user
 * @property value - Giá trị thực tế khi submit form
 * @property parentValue - Giá trị cha mà option này phụ thuộc vào (dùng cho filtering)
 * @property disabled - Option bị vô hiệu hóa hay không
 *
 * @example
 * ```ts
 * const province: SelectOption = {
 *   label: 'Ho Chi Minh City',
 *   value: 'HCM',
 *   parentValue: 'VN', // Phụ thuộc vào country Vietnam
 * };
 * ```
 */
export interface SelectOption {
  /** Text hiển thị trong dropdown */
  label: string;

  /** Giá trị khi submit form */
  value: string | number;

  /**
   * Giá trị cha mà option này phụ thuộc vào.
   * - Single value: option thuộc về 1 parent
   * - Array: option thuộc về nhiều parents (ví dụ: một thành phố nằm ở 2 tỉnh)
   */
  parentValue?: string | number | (string | number)[];

  /** Vô hiệu hóa option này */
  disabled?: boolean;

  /** Cho phép thêm các properties tùy chỉnh */
  [key: string]: unknown;
}

/**
 * Option đã được format cho Ant Design Select.
 * Chỉ giữ lại các properties cần thiết.
 */
export interface FormattedSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// ============================================================================
// FIELD CONFIGURATION - Cấu hình cho từng field
// ============================================================================

/**
 * Cấu hình cho một dependent select field.
 *
 * @property name - Tên field (unique identifier, dùng làm key)
 * @property label - Label hiển thị
 * @property placeholder - Placeholder text
 * @property mode - Chế độ select: undefined = single, 'multiple' = multi-select
 * @property dependsOn - Tên field cha mà field này phụ thuộc vào
 * @property options - Nguồn options: static array hoặc async function
 * @property filterOptions - Custom filter function (mặc định filter by parentValue)
 * @property selectProps - Props bổ sung cho Ant Design Select
 *
 * @example Static options
 * ```ts
 * const countryConfig: DependentFieldConfig = {
 *   name: 'country',
 *   label: 'Country',
 *   placeholder: 'Select a country',
 *   options: [
 *     { label: 'Vietnam', value: 'VN' },
 *     { label: 'USA', value: 'US' },
 *   ],
 * };
 * ```
 *
 * @example Async options
 * ```ts
 * const provinceConfig: DependentFieldConfig = {
 *   name: 'province',
 *   dependsOn: 'country',
 *   options: async (countryId) => {
 *     const res = await fetch(`/api/provinces?country=${countryId}`);
 *     return res.json();
 *   },
 * };
 * ```
 */
export interface DependentFieldConfig {
  /** Unique identifier cho field (dùng làm key trong form) */
  name: string;

  /** Label hiển thị */
  label?: string;

  /** Placeholder text khi chưa chọn */
  placeholder?: string;

  /** Chế độ select: undefined = single, 'multiple' = multi-select, 'tags' = tag mode */
  mode?: 'multiple' | 'tags';

  /** Tên field cha mà field này phụ thuộc vào */
  dependsOn?: string;

  /**
   * Nguồn options:
   * - Static array: SelectOption[]
   * - Async function: (parentValue) => Promise<SelectOption[]>
   * - undefined: options sẽ được truyền vào component qua props
   */
  options?: SelectOption[] | ((parentValue: unknown) => Promise<SelectOption[]>);

  /**
   * Custom filter function để lọc options theo parent value.
   * Mặc định: filter by parentValue property trong option.
   */
  filterOptions?: (options: SelectOption[], parentValue: unknown) => SelectOption[];

  /** Props bổ sung cho Ant Design Select */
  selectProps?: Omit<SelectProps, 'value' | 'onChange' | 'options' | 'mode'>;
}

/**
 * Map chứa giá trị của tất cả các fields.
 * Key: fieldName, Value: giá trị của field đó
 *
 * @example
 * ```ts
 * const values: DependentFieldValues = {
 *   country: 'VN',
 *   province: ['HCM', 'HN'],
 *   city: ['D1', 'D7'],
 * };
 * ```
 */
export type DependentFieldValues = Record<string, unknown>;

// ============================================================================
// FORM ADAPTER - Kết nối với form library
// ============================================================================

/**
 * Interface adapter để tích hợp với các form library.
 * Implement interface này để kết nối với Ant Design Form, React Hook Form, Formik, etc.
 *
 * Luồng dữ liệu:
 * 1. User chọn option → Store xử lý cascade → Adapter sync về Form
 * 2. Store cascade-delete → Adapter sync về Form
 *
 * @example Ant Design Form
 * ```ts
 * const adapter: DependentFormAdapter = {
 *   onFieldChange: (name, value) => form.setFieldValue(name, value),
 *   onFieldsChange: (fields) => form.setFieldsValue(
 *     Object.fromEntries(fields.map(f => [f.name, f.value]))
 *   ),
 * };
 * ```
 *
 * @example React Hook Form
 * ```ts
 * const adapter: DependentFormAdapter = {
 *   onFieldChange: (name, value) => setValue(name, value),
 * };
 * ```
 */
export interface DependentFormAdapter {
  /**
   * Được gọi khi một field thay đổi giá trị.
   * @param fieldName - Tên field
   * @param value - Giá trị mới
   */
  onFieldChange: (fieldName: string, value: unknown) => void;

  /**
   * Được gọi khi nhiều fields thay đổi cùng lúc (ví dụ: cascade delete).
   * Optional - nếu không implement, sẽ gọi onFieldChange cho từng field.
   * @param fields - Array các field bị thay đổi
   */
  onFieldsChange?: (fields: Array<{ name: string; value: unknown }>) => void;
}

// ============================================================================
// STORE TYPES - Types cho internal store
// ============================================================================

/**
 * Snapshot trạng thái của một field tại một thời điểm.
 * Dùng với useSyncExternalStore để React biết khi nào cần re-render.
 */
export interface DependentFieldSnapshot {
  /** Giá trị hiện tại của field */
  value: unknown;

  /** Giá trị của field cha (undefined nếu không có parent) */
  parentValue: unknown;

  /** Đang loading options hay không */
  isLoading: boolean;
}

/**
 * Thông tin quan hệ cha-con của một field.
 */
export interface DependentFieldRelationship {
  /** Tên field cha (null nếu là root field) */
  parent: string | null;

  /** Danh sách tên các field con */
  children: string[];
}

/**
 * Map chứa quan hệ của tất cả các fields.
 * Dùng để xác định cascade operations (delete, reload).
 */
export type DependentRelationshipMap = Map<string, DependentFieldRelationship>;

/**
 * Callback function cho subscriber pattern.
 * Được gọi khi field có sự thay đổi.
 */
export type StoreListener = () => void;

// ============================================================================
// COMPONENT PROPS - Props cho các React components
// ============================================================================

/**
 * Props cho DependentSelectProvider component.
 */
export interface DependentSelectProviderProps {
  /** Cấu hình cho các fields */
  configs: DependentFieldConfig[];

  /** Adapter để sync với form library */
  adapter?: DependentFormAdapter;

  /** Giá trị khởi tạo (uncontrolled mode) */
  initialValues?: DependentFieldValues;

  /** Giá trị controlled (controlled mode) */
  value?: DependentFieldValues;

  /** React children */
  children: React.ReactNode;
}

/**
 * Props cho DependentSelectField component (standalone, không dùng Form).
 */
export interface DependentSelectFieldProps {
  /** Tên field (phải khớp với config) */
  name: string;

  /** Override disabled state */
  disabled?: boolean;

  /** CSS class name */
  className?: string;

  /** Inline styles */
  style?: React.CSSProperties;
}

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES - Giữ tương thích ngược
// ============================================================================

/**
 * @deprecated Use DependentFieldConfig instead
 */
export type FieldConfig = DependentFieldConfig;

/**
 * @deprecated Use DependentFieldValues instead
 */
export type FieldValues = DependentFieldValues;

/**
 * @deprecated Use DependentFormAdapter instead
 */
export type FormAdapter = DependentFormAdapter;

/**
 * @deprecated Use DependentFieldSnapshot instead
 */
export type FieldSnapshot = DependentFieldSnapshot;

/**
 * @deprecated Use DependentFieldRelationship instead
 */
export type FieldRelationship = DependentFieldRelationship;

/**
 * @deprecated Use DependentRelationshipMap instead
 */
export type RelationshipMap = DependentRelationshipMap;

/**
 * @deprecated Use StoreListener instead
 */
export type Listener = StoreListener;

/**
 * @deprecated Use DependentSelectProviderProps instead
 */
export type ProviderProps = DependentSelectProviderProps;

/**
 * @deprecated Use DependentSelectFieldProps instead
 */
export type SelectFieldProps = DependentSelectFieldProps;

// ============================================================================
// CONST ASSERTIONS & TYPED CONFIGS - Type-safe configuration objects
// ============================================================================

/**
 * Narrow type for readonly config with const assertion.
 * Use with `as const` to preserve literal types.
 *
 * @template TName - Literal string type for name
 * @template TDependsOn - Literal string type for dependsOn (or undefined)
 *
 * @example
 * ```ts
 * const countryConfig = {
 *   name: 'country',
 *   label: 'Country',
 *   options: [...],
 * } as const satisfies ReadonlyFieldConfig;
 *
 * // TypeScript preserves: name = 'country' (not string)
 * ```
 */
export type ReadonlyFieldConfig<
  TName extends string = string,
  TDependsOn extends string | undefined = string | undefined,
> = {
  readonly name: TName;
  readonly label?: string;
  readonly placeholder?: string;
  readonly mode?: 'multiple' | 'tags';
  readonly dependsOn?: TDependsOn;
  readonly options?:
    | readonly SelectOption[]
    | ((parentValue: unknown) => Promise<SelectOption[]>);
  readonly filterOptions?: (
    options: SelectOption[],
    parentValue: unknown,
  ) => SelectOption[];
  readonly selectProps?: Omit<SelectProps, 'value' | 'onChange' | 'options' | 'mode'>;
};

/**
 * Helper type to create a typed config builder.
 * Infers exact field names from config array.
 *
 * @example
 * ```ts
 * const configs = defineConfigs([
 *   { name: 'country', label: 'Country' },
 *   { name: 'province', label: 'Province', dependsOn: 'country' },
 * ] as const);
 *
 * // TypeScript knows: configs has 'country' and 'province' fields
 * ```
 */
export type InferFieldNames<T extends readonly ReadonlyFieldConfig[]> =
  T[number]['name'];

/**
 * Define configs with const assertion for full type inference.
 * Runtime: identity function (no-op).
 * Compile-time: preserves literal types.
 *
 * @example
 * ```ts
 * const configs = defineConfigs([
 *   { name: 'country', label: 'Country', options: [...] },
 *   { name: 'province', label: 'Province', dependsOn: 'country' },
 * ] as const);
 *
 * type MyFieldNames = InferFieldNames<typeof configs>;
 * // Result: 'country' | 'province'
 * ```
 */
export function defineConfigs<
  const T extends readonly ReadonlyFieldConfig[],
>(configs: T): T {
  return configs;
}

/**
 * Type-safe field values based on config.
 * Maps field names to their expected value types.
 *
 * @template TConfigs - Readonly config array type
 *
 * @example
 * ```ts
 * const configs = defineConfigs([
 *   { name: 'country', mode: undefined },  // single select
 *   { name: 'provinces', mode: 'multiple' }, // multi select
 * ] as const);
 *
 * type Values = TypedFieldValues<typeof configs>;
 * // Result: { country?: unknown; provinces?: unknown[] }
 * ```
 */
export type TypedFieldValues<TConfigs extends readonly ReadonlyFieldConfig[]> = {
  [K in TConfigs[number]['name']]?: Extract<
    TConfigs[number],
    { name: K }
  >['mode'] extends 'multiple' | 'tags'
    ? unknown[]
    : unknown;
};

/**
 * Validate config dependencies at type level.
 * Ensures dependsOn references existing field names.
 *
 * @template TConfigs - Config array to validate
 *
 * @example
 * ```ts
 * const configs = defineConfigs([
 *   { name: 'country', ... },
 *   { name: 'province', dependsOn: 'country' }, // OK
 *   { name: 'city', dependsOn: 'state' }, // Error! 'state' doesn't exist
 * ] as const);
 *
 * type Valid = ValidateDependencies<typeof configs>;
 * ```
 */
export type ValidateDependencies<TConfigs extends readonly ReadonlyFieldConfig[]> = {
  [K in keyof TConfigs]: TConfigs[K] extends ReadonlyFieldConfig<infer TName, infer TDeps>
    ? TDeps extends string
      ? TDeps extends TConfigs[number]['name']
        ? TConfigs[K]
        : never // dependsOn points to non-existent field
      : TConfigs[K]
    : never;
};

/**
 * Strict field config that validates dependencies.
 * Use this in function parameters to enforce dependency validation.
 */
export type StrictFieldConfigs<TConfigs extends readonly ReadonlyFieldConfig[]> =
  ValidateDependencies<TConfigs> extends readonly ReadonlyFieldConfig[]
    ? TConfigs
    : never;

// ============================================================================
// UTILITY TYPES - Additional type utilities
// ============================================================================

/**
 * Make specific properties required.
 *
 * @example
 * ```ts
 * type WithRequiredLabel = RequiredProps<DependentFieldConfig, 'label'>;
 * ```
 */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional.
 *
 * @example
 * ```ts
 * type WithOptionalName = OptionalProps<DependentFieldConfig, 'name'>;
 * ```
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Deep readonly type.
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/**
 * Extract value type from SelectOption.
 */
export type SelectOptionValue = SelectOption['value'];

/**
 * Narrowed option type with specific value.
 */
export type TypedSelectOption<TValue extends SelectOptionValue> = Omit<
  SelectOption,
  'value'
> & {
  value: TValue;
};