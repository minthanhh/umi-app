/**
 * DependentField Library
 *
 * A library-agnostic solution for managing field dependencies in forms.
 *
 * @example Basic usage
 * ```tsx
 * import {
 *   DependentFieldProvider,
 *   useDependentField,
 * } from '@/lib/dependent-field';
 *
 * const configs = [
 *   { name: 'country' },
 *   {
 *     name: 'city',
 *     dependsOn: 'country',
 *     onDependencyChange: ({ setValue }) => setValue(undefined),
 *   },
 * ];
 *
 * function App() {
 *   return (
 *     <DependentFieldProvider configs={configs}>
 *       <CountrySelect />
 *       <CitySelect />
 *     </DependentFieldProvider>
 *   );
 * }
 *
 * function CountrySelect() {
 *   const { value, onSyncStore } = useDependentField('country');
 *   return <Select value={value} onChange={onSyncStore} />;
 * }
 *
 * function CitySelect() {
 *   const { value, onSyncStore, isDependencySatisfied } = useDependentField('city');
 *   return <Select value={value} onChange={onSyncStore} disabled={!isDependencySatisfied} />;
 * }
 * ```
 */

// Core exports
export {
  DependentFieldProvider,
  useDependentField,
  useDependentFieldStore,
  useDependentFieldValues,
} from './context';

export { DependentFieldStore } from './store';

// Type exports
export type {
  DependencyChangeParams,
  DependentFieldConfig,
  DependentFieldProviderProps,
  FieldValue,
  FieldValues,
  FormAdapter,
  UseDependentFieldReturn,
} from './types';

// Adapter exports
export {
  createAntdAdapter,
  createFormikAdapter,
  createRHFAdapter,
  useAntdAdapter,
  useFormikAdapter,
  useRHFAdapter,
} from './adapters';

// Infinite scroll exports
export {
  useInfiniteDependentField,
  type BaseItem,
  type FetchRequest,
  type FetchResponse,
  type InfiniteFieldConfig,
  type SelectOption,
  type UseInfiniteDependentFieldResult,
} from './hooks';

// Component exports
export { InfiniteDependentSelect } from './components/InfiniteDependentSelect';
