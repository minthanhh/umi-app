import { Select } from 'antd';
import { memo, useCallback, useMemo } from 'react';

import {
  DefaultTag,
  LoadingFooter,
  LoadingTag,
  UserDropdownItem,
  UserSelectedItem,
} from './components';
import {
  useDropdownState,
  useMergedOptions,
  useNormalizedInput,
  useUserDataSource,
} from './hooks';
import type { User, UserSelectOption, UserSelectProps } from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STYLE: React.CSSProperties = { width: 300 };
const SCROLL_THRESHOLD = 10;

// ============================================================================
// Helper Functions
// ============================================================================

const createSelectOptions = (users: User[]): UserSelectOption[] =>
  users.map((user) => ({
    label: <UserDropdownItem item={user} />,
    value: user.id,
    title: user.name,
    labelSelected: <UserSelectedItem item={user} isPinned={false} />,
  }));

// ============================================================================
// UserSelect Component
// Main component following Open/Closed Principle - extensible via props
// ============================================================================

const UserSelect: React.FC<UserSelectProps> = ({
  onChange,
  value,
  fetchStrategy = 'lazy',
  placeholder = 'Select a user',
  style = DEFAULT_STYLE,
  disabled = false,
}) => {
  // State management hooks
  const { isListFetchEnabled, handleOpenChange } = useDropdownState({
    fetchStrategy,
  });

  // Data normalization
  const { selectedIds, prefilledItems } = useNormalizedInput(value);

  // Data fetching
  const dataSources = useUserDataSource({
    selectedIds,
    prefilledItems,
    isListFetchEnabled,
  });

  // Merge all data sources into options
  const mergedUsers = useMergedOptions({
    prefilledItems,
    hydratedData: dataSources.hydratedData,
    listData: dataSources.listData,
  });

  // Memoized options for Select
  const selectOptions = useMemo(
    () => createSelectOptions(mergedUsers),
    [mergedUsers],
  );

  // Memoized tag render function
  const tagRender = useCallback(
    (props: {
      label: React.ReactNode;
      value: string | number;
      closable: boolean;
      onClose: () => void;
    }) => {
      const { label, value: tagValue, closable, onClose } = props;
      const isRawId = label === tagValue;

      if (isRawId && dataSources.isHydrating) {
        return (
          <LoadingTag value={tagValue} closable={closable} onClose={onClose} />
        );
      }

      return <DefaultTag label={label} closable={closable} onClose={onClose} />;
    },
    [dataSources.isHydrating],
  );

  // Handle scroll for infinite loading
  const handlePopupScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const isNearBottom =
        target.scrollTop + target.offsetHeight >= target.scrollHeight - SCROLL_THRESHOLD;

      if (isNearBottom && dataSources.hasNextPage && !dataSources.isFetchingMore) {
        dataSources.fetchNextPage();
      }
    },
    [dataSources.hasNextPage, dataSources.isFetchingMore, dataSources.fetchNextPage],
  );

  // Render dropdown with loading indicator
  const popupRender = useCallback(
    (menu: React.ReactNode) => (
      <>
        {menu}
        {dataSources.isFetchingMore && <LoadingFooter />}
      </>
    ),
    [dataSources.isFetchingMore],
  );

  console.log("RE-RENDER")

  return (
    <Select
      mode="multiple"
      style={style}
      onChange={onChange}
      value={selectedIds}
      placeholder={placeholder}
      disabled={disabled}
      options={selectOptions}
      tagRender={tagRender}
      optionLabelProp="labelSelected"
      onOpenChange={handleOpenChange}
      onPopupScroll={handlePopupScroll}
      popupRender={popupRender}
    />
  );
};

// Export memoized component for optimal re-render performance
export default memo(UserSelect);