/**
 * InfiniteSelectWrapper - Render Props Component
 *
 * Headless component cung cấp infinite scroll logic qua render props.
 * Dùng để tích hợp với bất kỳ UI library nào (MUI, Chakra, custom, etc.)
 *
 * Features:
 * - Render props pattern cho flexibility
 * - Không phụ thuộc vào Ant Design
 * - Có thể dùng với bất kỳ Select component nào
 */

import React, { useMemo } from 'react';

import type {
  BaseItem,
  InfiniteSelectRenderProps,
  InfiniteSelectWrapperProps,
} from './types';
import { useInfiniteSelect } from './useInfiniteSelect';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Headless infinite scroll wrapper với render props.
 *
 * @example With Ant Design Select
 * ```tsx
 * <InfiniteSelectWrapper
 *   queryKey="users"
 *   fetchList={fetchUsers}
 *   value={selectedUser}
 *   onChange={setSelectedUser}
 * >
 *   {({ options, isLoading, onScroll, onOpenChange, onChange }) => (
 *     <Select
 *       options={options}
 *       loading={isLoading}
 *       onPopupScroll={onScroll}
 *       onDropdownVisibleChange={onOpenChange}
 *       onChange={onChange}
 *     />
 *   )}
 * </InfiniteSelectWrapper>
 * ```
 *
 * @example With MUI Autocomplete
 * ```tsx
 * <InfiniteSelectWrapper queryKey="products" fetchList={fetchProducts}>
 *   {({ items, isLoading, onScroll, onSearch }) => (
 *     <Autocomplete
 *       options={items}
 *       loading={isLoading}
 *       onInputChange={(_, value) => onSearch(value)}
 *       ListboxProps={{
 *         onScroll: onScroll,
 *       }}
 *       renderInput={(params) => <TextField {...params} />}
 *     />
 *   )}
 * </InfiniteSelectWrapper>
 * ```
 *
 * @example With custom UI
 * ```tsx
 * <InfiniteSelectWrapper queryKey="options" fetchList={fetchOptions}>
 *   {({ items, isLoading, hasNextPage, fetchNextPage, selectedItems, onChange }) => (
 *     <div>
 *       {isLoading && <Spinner />}
 *       <ul>
 *         {items.map((item) => (
 *           <li
 *             key={item.id}
 *             onClick={() => onChange(item.id)}
 *             className={selectedItems.some(s => s.id === item.id) ? 'selected' : ''}
 *           >
 *             {item.name}
 *           </li>
 *         ))}
 *       </ul>
 *       {hasNextPage && (
 *         <button onClick={fetchNextPage}>Load More</button>
 *       )}
 *     </div>
 *   )}
 * </InfiniteSelectWrapper>
 * ```
 *
 * @example With DependentField integration
 * ```tsx
 * function CityInfiniteSelect() {
 *   const { parentValue, onChange, value } = useDependentField('city');
 *
 *   return (
 *     <InfiniteSelectWrapper
 *       queryKey="cities"
 *       fetchList={fetchCities}
 *       parentValue={parentValue}
 *       value={value}
 *       onChange={onChange}
 *       enabled={!!parentValue}
 *     >
 *       {(props) => <MyCustomSelect {...props} />}
 *     </InfiniteSelectWrapper>
 *   );
 * }
 * ```
 */
export function InfiniteSelectWrapper<T extends BaseItem = BaseItem>({
  children,
  ...options
}: InfiniteSelectWrapperProps<T>) {
  const result = useInfiniteSelect<T>(options);

  // Format options for convenience
  const formattedOptions = useMemo(
    () =>
      result.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
    [result.options],
  );

  // Build render props
  const renderProps: InfiniteSelectRenderProps<T> = {
    ...result,
    formattedOptions,
  };

  return <>{children(renderProps)}</>;
}

export default InfiniteSelectWrapper;