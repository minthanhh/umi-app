import { SelectWrapper } from '@/components/Select/DefaultSelect';
import { Select, Tag } from 'antd';
import React from 'react';
import { tasksApi } from '../api';
import {
  DEFAULT_PAGE_SIZE,
  PRIORITY_COLORS,
  STATUS_LABELS,
} from '../constants';
import type { SelectMode, Task } from '../types';

interface TaskSelectProps {
  mode: SelectMode;
  projectIds: number[];
  value: number[];
  onChange: (ids: number[], selectedTasks?: Task[]) => void;
  queryKey: string;
  resetKey: number;
}

const TaskOptionLabel: React.FC<{ task: Task; showProject?: boolean }> = ({
  task,
  showProject,
}) => (
  <div>
    <div style={{ fontWeight: 500 }}>{task.title}</div>
    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
      {showProject && task.project && (
        <Tag color="default" style={{ fontSize: 10, marginRight: 4 }}>
          {task.project.name}
        </Tag>
      )}
      <span style={{ color: PRIORITY_COLORS[task.priority] }}>
        {task.priority}
      </span>
      {' • '}
      {STATUS_LABELS[task.status] ?? task.status}
      {!showProject && task.assignee && ` • ${task.assignee.name}`}
    </div>
  </div>
);

export const TaskSelect: React.FC<TaskSelectProps> = ({
  mode,
  projectIds,
  value,
  onChange,
  queryKey,
  resetKey,
}) => {
  const isMultiple = mode === 'multiple';
  const isDisabled = projectIds.length === 0;
  const placeholder = isDisabled
    ? 'Select project first'
    : isMultiple
      ? 'Select tasks...'
      : 'Select task...';

  return (
    <SelectWrapper<Task>
      key={`task-${resetKey}`}
      value={value}
      onChange={(ids) => onChange(ids as number[])}
      config={{
        queryKey,
        fetchList: (request) => {
          if (projectIds.length === 0)
            return Promise.resolve({ data: [], total: 0 });
          return tasksApi.fetchByProjects(projectIds, request);
        },
        fetchByIds: tasksApi.fetchByIds,
        pageSize: DEFAULT_PAGE_SIZE,
        fetchStrategy: isMultiple ? 'eager' : 'lazy',
        getItemId: (task) => task.id,
        getItemLabel: (task) => task.title,
      }}
    >
      {({ state, actions }) => {
        const options = state.options.map((opt) => {
          const task = opt.item as Task;
          return {
            label: <TaskOptionLabel task={task} showProject={isMultiple} />,
            value: opt.value,
            title: task.title,
            ...(isMultiple && {
              labelSelected: (
                <Tag color="green" style={{ margin: 0 }}>
                  {task.title}
                </Tag>
              ),
            }),
          };
        });

        // Helper to get tasks by ids from available items
        const getTasksByIds = (ids: (string | number)[]): Task[] => {
          const idSet = new Set(ids);
          return state.items.filter((item) => idSet.has(item.id)) as Task[];
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
                // Pass selected tasks with project info for smart cascade
                const selectedTasks = getTasksByIds(values);
                onChange(values as number[], selectedTasks);
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
              maxTagCount={3}
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
