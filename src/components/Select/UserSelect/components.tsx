import { LoadingOutlined } from '@ant-design/icons';
import { Spin, Tag, Avatar } from 'antd';
import { memo } from 'react';

import type { UserDropdownItemProps, UserSelectedItemProps } from './types';

// ============================================================================
// UserDropdownItem Component
// Displays user info in the dropdown list
// ============================================================================

export const UserDropdownItem = memo<UserDropdownItemProps>(
  ({ item, isPinned = false }) => (
    <div className="flex items-center gap-3 py-2">
      <Avatar
        shape="square"
        size="large"
        src={item.avatar}
        className={isPinned ? 'border-2 border-blue-500' : ''}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <span
            className={`font-bold truncate w-3/4 ${
              isPinned ? 'text-blue-700' : 'text-gray-700'
            }`}
          >
            {item.email}
          </span>
          {isPinned && (
            <Tag color="blue" className="mr-0">
              PIN
            </Tag>
          )}
        </div>
        <span className="text-gray-500 text-xs truncate">{item.name}</span>
      </div>
    </div>
  ),
);

UserDropdownItem.displayName = 'UserDropdownItem';

// ============================================================================
// UserSelectedItem Component
// Displays selected user in the select input
// ============================================================================

export const UserSelectedItem = memo<UserSelectedItemProps>(
  ({ item, isPinned = false }) => (
    <div className="flex items-center gap-2 h-full w-full -ml-1">
      <Avatar
        size="small"
        src={item.avatar}
        className={isPinned ? 'border border-blue-500' : ''}
      />
      <div className="flex flex-col justify-center h-full leading-tight">
        <span
          className={`text-sm font-semibold truncate ${
            isPinned ? 'text-blue-700' : 'text-gray-800'
          }`}
        >
          {item.email}
        </span>
      </div>
    </div>
  ),
);

UserSelectedItem.displayName = 'UserSelectedItem';

// ============================================================================
// LoadingTag Component
// Shows loading state for tags being hydrated
// ============================================================================

interface LoadingTagProps {
  value: string | number;
  closable: boolean;
  onClose: () => void;
}

export const LoadingTag = memo<LoadingTagProps>(
  ({ value, closable, onClose }) => (
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
  ),
);

LoadingTag.displayName = 'LoadingTag';

// ============================================================================
// DefaultTag Component
// Default tag display for selected items
// ============================================================================

interface DefaultTagProps {
  label: React.ReactNode;
  closable: boolean;
  onClose: () => void;
}

export const DefaultTag = memo<DefaultTagProps>(
  ({ label, closable, onClose }) => (
    <Tag
      closable={closable}
      onClose={onClose}
      style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}
    >
      {label}
    </Tag>
  ),
);

DefaultTag.displayName = 'DefaultTag';

// ============================================================================
// LoadingFooter Component
// Shows loading indicator at the bottom of dropdown during pagination
// ============================================================================

export const LoadingFooter = memo(() => (
  <div className="p-2 text-center text-blue-500 bg-blue-50 flex items-center justify-center gap-2">
    <Spin size="small" />
    <span className="text-xs">Đang tải thêm...</span>
  </div>
));

LoadingFooter.displayName = 'LoadingFooter';
