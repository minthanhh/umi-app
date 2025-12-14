/**
 * React Hook Form Adapter
 *
 * Integrates SmartSelect with React Hook Form
 */

import { useMemo } from 'react';

import type { FormAdapter, SelectValue } from '../types';

/**
 * RHF control methods interface
 */
interface RHFMethods {
  setValue: (
    name: string,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean },
  ) => void;
  getValues: (name?: string | string[]) => any;
  watch?: (name?: string | string[]) => any;
}

/**
 * Create an adapter for React Hook Form
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { control, setValue, getValues } = useForm();
 *   const adapter = createRHFAdapter({ setValue, getValues });
 *
 *   return (
 *     <SmartSelectProvider adapter={adapter}>
 *       <Controller
 *         name="country"
 *         control={control}
 *         render={({ field }) => (
 *           <Select.Dependent name="country">
 *             {(props) => <AntdSelect {...field} {...props} />}
 *           </Select.Dependent>
 *         )}
 *       />
 *     </SmartSelectProvider>
 *   );
 * }
 * ```
 */
export function createRHFAdapter(methods: RHFMethods): FormAdapter {
  return {
    setFieldValue: (name: string, value: SelectValue) => {
      methods.setValue(name, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    setFieldsValue: (values: Record<string, SelectValue>) => {
      Object.entries(values).forEach(([name, value]) => {
        methods.setValue(name, value, {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
    },
    getFieldValue: (name: string) => {
      return methods.getValues(name);
    },
    getFieldsValue: () => {
      return methods.getValues();
    },
  };
}

/**
 * Hook version
 */
export function useRHFAdapter(methods: RHFMethods): FormAdapter {
  return useMemo(() => createRHFAdapter(methods), [methods]);
}

/**
 * Create adapter with nested path support
 *
 * @example
 * ```tsx
 * const adapter = createRHFAdapterWithPath({ setValue, getValues }, 'user.address');
 * // This will set setValue('user.address.country', value)
 * ```
 */
export function createRHFAdapterWithPath(
  methods: RHFMethods,
  basePath: string,
): FormAdapter {
  const getFullPath = (name: string) => `${basePath}.${name}`;

  return {
    setFieldValue: (name: string, value: SelectValue) => {
      methods.setValue(getFullPath(name), value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    setFieldsValue: (values: Record<string, SelectValue>) => {
      Object.entries(values).forEach(([name, value]) => {
        methods.setValue(getFullPath(name), value, {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
    },
    getFieldValue: (name: string) => {
      return methods.getValues(getFullPath(name));
    },
    getFieldsValue: () => {
      const allValues = methods.getValues();
      const paths = basePath.split('.');
      let result = allValues;
      for (const path of paths) {
        result = result?.[path];
      }
      return result ?? {};
    },
  };
}

export function useRHFAdapterWithPath(
  methods: RHFMethods,
  basePath: string,
): FormAdapter {
  return useMemo(
    () => createRHFAdapterWithPath(methods, basePath),
    [methods, basePath],
  );
}
