/**
 * SmartSelect - Compound Component for Select with Infinite Scroll & Dependencies
 *
 * @example Basic Infinite Scroll (standalone)
 * ```tsx
 * <Select.Infinite config={{ queryKey: 'users', fetchList }}>
 *   {({ options, isLoading, onScroll, onOpenChange }) => (
 *     <AntdSelect
 *       options={options}
 *       loading={isLoading}
 *       onPopupScroll={onScroll}
 *       onDropdownVisibleChange={onOpenChange}
 *     />
 *   )}
 * </Select.Infinite>
 * ```
 *
 * @example Dependent Select (standalone)
 * ```tsx
 * <SmartSelectProvider>
 *   <Select.Dependent name="city" dependsOn="country">
 *     {({ value, onChange, isDisabledByDependency }) => (
 *       <AntdSelect
 *         value={value}
 *         onChange={onChange}
 *         disabled={isDisabledByDependency}
 *       />
 *     )}
 *   </Select.Dependent>
 * </SmartSelectProvider>
 * ```
 *
 * @example Combined: Dependent + Infinite (composable)
 * ```tsx
 * <SmartSelectProvider>
 *   <Select.Dependent name="city" dependsOn={['country', 'region']}>
 *     {({ value, onChange, dependencyValues, isDisabledByDependency }) => (
 *       <Select.Infinite
 *         config={{
 *           queryKey: 'cities',
 *           fetchList: (req) => fetchCities({ ...req, ...dependencyValues }),
 *         }}
 *         value={value}
 *         onChange={onChange}
 *       >
 *         {({ options, isLoading, onScroll, onOpenChange }) => (
 *           <AntdSelect
 *             options={options}
 *             loading={isLoading}
 *             disabled={isDisabledByDependency}
 *             onPopupScroll={onScroll}
 *             onDropdownVisibleChange={onOpenChange}
 *           />
 *         )}
 *       </Select.Infinite>
 *     )}
 *   </Select.Dependent>
 * </SmartSelectProvider>
 * ```
 */

// Provider
export { SmartSelectProvider } from './context';

// Components
export { Dependent as SelectDependent } from './Dependent';
export { Infinite as SelectInfinite } from './Infinite';

// Compound component
import { Dependent } from './Dependent';
import { Infinite } from './Infinite';

export const Select = {
  Infinite,
  Dependent,
};

// Hooks
export {
  useDependencySatisfied,
  useFieldValue,
  useFieldValues,
  useSmartSelectContext,
  useSmartSelectStore,
  useSmartSelectStoreOptional,
} from './context';

// Store (for advanced usage)
export { SmartSelectStore } from './store';

// Form Adapters
export {
  // Ant Design
  createAntdFormAdapter,
  createAntdFormAdapterWithNamePath,
  // Formik
  createFormikAdapter,
  createFormikAdapterWithPath,
  // React Hook Form
  createRHFAdapter,
  createRHFAdapterWithPath,
  useAntdFormAdapter,
  useAntdFormAdapterWithNamePath,
  useFormikAdapter,
  useFormikAdapterWithPath,
  useRHFAdapter,
  useRHFAdapterWithPath,
} from './adapters';

// Types
export type {
  // Base
  BaseItem,
  DependencyChangeParams,
  // Dependent
  DependencyConfig,
  DependentProps,
  DependentRenderProps,
  // Fetch
  FetchRequest,
  FetchResponse,
  // Adapter
  FormAdapter,
  // Infinite
  InfiniteConfig,
  InfiniteProps,
  InfiniteRenderProps,
  SelectOption,
  SelectValue,
  SmartSelectContextValue,
  // Provider
  SmartSelectProviderConfig,
  SmartSelectProviderProps,
} from './types';
