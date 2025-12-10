import { SelectWrapper } from '@/components/Select/DefaultSelect';
import { Select, Tag } from 'antd';
import React from 'react';
import { projectsApi } from '../api';
import { DEFAULT_PAGE_SIZE } from '../constants';
import type { Project, SelectMode } from '../types';

interface ProjectSelectProps {
  mode: SelectMode;
  memberIds: number[];
  value: number[];
  onChange: (ids: number[], selectedProjects?: Project[]) => void;
  queryKey: string;
  resetKey: number;
}

const ProjectOptionLabel: React.FC<{ project: Project }> = ({ project }) => (
  <div>
    <div style={{ fontWeight: 500 }}>{project.name}</div>
    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
      {project._count?.tasks ?? 0} tasks • {project._count?.members ?? 0}{' '}
      members
    </div>
  </div>
);

export const ProjectSelect: React.FC<ProjectSelectProps> = ({
  mode,
  memberIds,
  value,
  onChange,
  queryKey,
  resetKey,
}) => {
  const isMultiple = mode === 'multiple';
  const isDisabled = memberIds.length === 0;
  const placeholder = isDisabled
    ? 'Select member first'
    : isMultiple
      ? 'Select projects...'
      : 'Select project...';

  return (
    <SelectWrapper<Project>
      key={`project-${resetKey}`}
      value={value}
      onChange={(ids) => onChange(ids as number[])} // Will be handled inside render props
      config={{
        queryKey,
        fetchList: async (request) => {
          if (memberIds.length === 0) return { data: [], total: 0 };
          if (isMultiple) {
            return projectsApi.fetchByMembers(memberIds, request);
          }
          return projectsApi.fetchByMember(memberIds[0], request);
        },
        fetchByIds: async (ids) => {
          if (isMultiple) {
            return projectsApi.fetchByIds(ids);
          }
          return memberIds[0]
            ? projectsApi.fetchByMemberAndIds(memberIds[0], ids)
            : [];
        },
        pageSize: DEFAULT_PAGE_SIZE,
        fetchStrategy: isMultiple ? 'eager' : 'lazy',
        getItemId: (project) => project.id,
        getItemLabel: (project) => project.name,
      }}
    >
      {({ state, actions }) => {
        const options = state.options.map((opt) => {
          const project = opt.item as Project;
          return {
            label: <ProjectOptionLabel project={project} />,
            value: opt.value,
            title: project.name,
            ...(isMultiple && {
              labelSelected: (
                <Tag color="blue" style={{ margin: 0 }}>
                  {project.name}
                </Tag>
              ),
            }),
          };
        });

        // Helper to get projects by ids from available items
        const getProjectsByIds = (ids: (string | number)[]): Project[] => {
          const idSet = new Set(ids);
          return state.items.filter((item) => idSet.has(item.id)) as Project[];
        };

        if (isMultiple) {
          return (
            <Select
              mode="multiple"
              placeholder={placeholder}
              disabled={isDisabled}
              value={state.selectedIds}
              onChange={(values) => {
                actions.onChange(values);
                // Pass selected projects with member info for smart cascade
                const selectedProjects = getProjectsByIds(values);
                onChange(values as number[], selectedProjects);
              }}
              onOpenChange={actions.onOpenChange}
              onPopupScroll={actions.onScroll}
              options={options}
              optionLabelProp="labelSelected"
              loading={state.isLoading || state.isHydrating}
              allowClear
              onClear={() => {
                actions.onChange([]);
                onChange([], []);
              }}
              maxTagCount={2}
              maxTagPlaceholder={(omitted) => `+${omitted.length} more`}
            />
          );
        }

        return (
          <Select
            placeholder={placeholder}
            disabled={isDisabled}
            value={state.selectedIds[0] ?? undefined}
            onChange={(val) => {
              const ids = val ? [val] : [];
              actions.onChange(ids);
              onChange(ids as number[]);
            }}
            onOpenChange={actions.onOpenChange}
            onPopupScroll={actions.onScroll}
            options={options}
            loading={state.isLoading || state.isHydrating}
            allowClear
            onClear={() => {
              actions.onChange([]);
              onChange([]);
            }}
          />
        );
      }}
    </SelectWrapper>
  );
};
