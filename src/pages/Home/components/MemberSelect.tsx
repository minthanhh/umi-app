import { SelectWrapper } from '@/components/Select/DefaultSelect';
import {
  UserDropdownItem,
  UserSelectedItem,
} from '@/components/Select/UserSelect';
import { Select } from 'antd';
import React from 'react';
import { usersApi } from '../api';
import { DEFAULT_PAGE_SIZE } from '../constants';
import type { SelectMode, User } from '../types';

interface MemberSelectProps {
  mode: SelectMode;
  value: number[];
  onChange: (ids: number[]) => void;
  queryKey: string;
}

export const MemberSelect: React.FC<MemberSelectProps> = ({
  mode,
  value,
  onChange,
  queryKey,
}) => {
  const isMultiple = mode === 'multiple';
  const placeholder = isMultiple ? 'Select members...' : 'Select member...';

  return (
    <SelectWrapper<User>
      value={value}
      onChange={(ids) => onChange(ids as number[])}
      config={{
        queryKey,
        fetchList: usersApi.fetchList,
        fetchByIds: usersApi.fetchByIds,
        pageSize: DEFAULT_PAGE_SIZE,
        fetchStrategy: isMultiple ? 'eager' : 'lazy',
        getItemId: (user) => user.id,
      }}
    >
      {({ state, actions }) => {
        const options = state.options.map((opt) => {
          const user = opt.item as User;
          return {
            label: <UserDropdownItem item={user} />,
            value: opt.value,
            title: user.name,
            labelSelected: <UserSelectedItem item={user} />,
          };
        });

        if (isMultiple) {
          return (
            <Select
              mode="multiple"
              placeholder={placeholder}
              value={state.selectedIds}
              onChange={(values) => {
                actions.onChange(values);
              }}
              onOpenChange={actions.onOpenChange}
              onPopupScroll={actions.onScroll}
              options={options}
              optionLabelProp="labelSelected"
              loading={state.isLoading || state.isHydrating}
              allowClear
              onClear={() => actions.onChange([])}
              maxTagCount={2}
              maxTagPlaceholder={(omitted) => `+${omitted.length} more`}
            />
          );
        }

        return (
          <Select
            placeholder={placeholder}
            value={state.selectedIds[0] ?? undefined}
            onChange={(val) => {
              actions.onChange(val ? [val] : []);
            }}
            onOpenChange={actions.onOpenChange}
            onPopupScroll={actions.onScroll}
            options={options}
            optionLabelProp="labelSelected"
            loading={state.isLoading || state.isHydrating}
            allowClear
            onClear={() => actions.onChange([])}
          />
        );
      }}
    </SelectWrapper>
  );
};
