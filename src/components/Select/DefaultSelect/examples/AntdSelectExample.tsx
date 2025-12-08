import { LoadingOutlined } from '@ant-design/icons';
import { Avatar, Select, Spin, Tag } from 'antd';
import { memo, useCallback, useMemo } from 'react';

import { useSelectContext } from '../context';
import { SelectWrapper } from '../SelectWrapper';
import type { BaseItem, SelectWrapperConfig } from '../types';

// ============================================================================
// User Type (Example domain type)
// ============================================================================

interface User extends BaseItem {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
}

// ============================================================================
// Helper Components (defined first to avoid eslint errors)
// ============================================================================

const UserDropdownItem = memo<{ user: User }>(({ user }) => (
  <div className="flex items-center gap-3 py-2">
    <Avatar shape="square" size="large" src={user.avatar} />
    <div className="flex flex-col flex-1 overflow-hidden">
      <span className="font-bold truncate text-gray-700">{user.email}</span>
      <span className="text-gray-500 text-xs truncate">{user.name}</span>
    </div>
  </div>
));

UserDropdownItem.displayName = 'UserDropdownItem';

const UserSelectedItem = memo<{ user: User }>(({ user }) => (
  <div className="flex items-center gap-2 h-full w-full -ml-1">
    <Avatar size="small" src={user.avatar} />
    <span className="text-sm font-semibold truncate text-gray-800">{user.email}</span>
  </div>
));

UserSelectedItem.displayName = 'UserSelectedItem';

const LoadingTag = memo<{
  value: string | number;
  closable: boolean;
  onClose: () => void;
}>(({ value, closable, onClose }) => (
  <Tag
    color="default"
    closable={closable}
    onClose={onClose}
    style={{ display: 'flex', alignItems: 'center' }}
  >
    <Spin
      indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />}
      size="small"
      style={{ marginRight: 6 }}
    />
    Loading ID {value}...
  </Tag>
));

LoadingTag.displayName = 'LoadingTag';

const DefaultTag = memo<{
  label: React.ReactNode;
  closable: boolean;
  onClose: () => void;
}>(({ label, closable, onClose }) => (
  <Tag
    closable={closable}
    onClose={onClose}
    style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}
  >
    {label}
  </Tag>
));

DefaultTag.displayName = 'DefaultTag';

const LoadingFooter = memo(() => (
  <div className="p-2 text-center text-blue-500 bg-blue-50 flex items-center justify-center gap-2">
    <Spin size="small" />
    <span className="text-xs">Loading more...</span>
  </div>
));

LoadingFooter.displayName = 'LoadingFooter';

// ============================================================================
// Inner Select Component (uses context)
// ============================================================================

interface AntdUserSelectInnerProps {
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  maxTagCount?: number;
}

const AntdUserSelectInner = memo<AntdUserSelectInnerProps>(
  ({ placeholder = 'Select users', disabled = false, style, maxTagCount = 2 }) => {
    const { state, actions } = useSelectContext<User>();

    // Convert options to Antd format
    const antdOptions = useMemo(
      () =>
        state.options.map((opt) => ({
          label: <UserDropdownItem user={opt.item} />,
          value: opt.value,
          title: opt.item.name,
          labelSelected: <UserSelectedItem user={opt.item} />,
        })),
      [state.options],
    );

    // Custom tag render
    const tagRender = useCallback(
      (props: {
        label: React.ReactNode;
        value: string | number;
        closable: boolean;
        onClose: () => void;
      }) => {
        const { label, value, closable, onClose } = props;
        const isRawId = label === value;

        if (isRawId && state.isHydrating) {
          return <LoadingTag value={value} closable={closable} onClose={onClose} />;
        }

        return <DefaultTag label={label} closable={closable} onClose={onClose} />;
      },
      [state.isHydrating],
    );

    // Popup render with loading footer
    const popupRender = useCallback(
      (menu: React.ReactNode) => (
        <>
          {menu}
          {state.isFetchingMore && <LoadingFooter />}
        </>
      ),
      [state.isFetchingMore],
    );

    const isLoading = state.isLoading || state.isHydrating || state.isFetchingMore;

    return (
      <Select
        mode="multiple"
        style={style}
        value={state.selectedIds}
        onChange={actions.onChange}
        onOpenChange={actions.onOpenChange}
        onPopupScroll={actions.onScroll}
        options={antdOptions}
        tagRender={tagRender}
        optionLabelProp="labelSelected"
        popupRender={popupRender}
        placeholder={placeholder}
        disabled={disabled}
        loading={isLoading}
        maxTagCount={maxTagCount}
      />
    );
  },
);

AntdUserSelectInner.displayName = 'AntdUserSelectInner';

// ============================================================================
// Config Factory
// ============================================================================

const createUserSelectConfig = (): SelectWrapperConfig<User> => ({
  queryKey: 'default-select-users',
  fetchList: async (request) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current: request.current,
        pageSize: request.pageSize,
        ids: request.ids,
        sorter: { name: 'asc' },
      }),
    });
    const data = await response.json();
    return { data: data.data, total: data.total };
  },
  fetchByIds: async (ids) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current: 1,
        pageSize: ids.length,
        ids,
      }),
    });
    const data = await response.json();
    return data.data;
  },
  pageSize: 10,
  fetchStrategy: 'lazy',
  getItemId: (user) => user.id,
  getItemLabel: (user) => user.email,
});

// ============================================================================
// Exported Component (Complete Example)
// ============================================================================

interface AntdUserSelectProps {
  value?: Array<string | number | User>;
  onChange?: (ids: Array<string | number>) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const AntdUserSelect = memo<AntdUserSelectProps>(
  ({ value, onChange, placeholder, disabled, style = { width: 300 } }) => {
    const config = useMemo(() => createUserSelectConfig(), []);

    return (
      <SelectWrapper config={config} value={value} onChange={onChange}>
        <AntdUserSelectInner
          placeholder={placeholder}
          disabled={disabled}
          style={style}
        />
      </SelectWrapper>
    );
  },
);

AntdUserSelect.displayName = 'AntdUserSelect';

// ============================================================================
// Alternative: Using Render Props Pattern
// ============================================================================

export const AntdUserSelectWithRenderProps = memo<AntdUserSelectProps>(
  ({ value, onChange, placeholder = 'Select users', disabled, style = { width: 300 } }) => {
    const config = useMemo(() => createUserSelectConfig(), []);

    return (
      <SelectWrapper config={config} value={value} onChange={onChange}>
        {({ state, actions }) => {
          const antdOptions = state.options.map((opt) => ({
            label: <UserDropdownItem user={opt.item} />,
            value: opt.value,
            title: opt.item.name,
            labelSelected: <UserSelectedItem user={opt.item} />,
          }));

          return (
            <Select
              mode="multiple"
              style={style}
              value={state.selectedIds}
              onChange={actions.onChange}
              onOpenChange={actions.onOpenChange}
              onPopupScroll={actions.onScroll}
              options={antdOptions}
              optionLabelProp="labelSelected"
              placeholder={placeholder}
              disabled={disabled}
              loading={state.isLoading}
            />
          );
        }}
      </SelectWrapper>
    );
  },
);

AntdUserSelectWithRenderProps.displayName = 'AntdUserSelectWithRenderProps';
