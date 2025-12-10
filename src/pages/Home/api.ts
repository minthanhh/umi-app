// API functions for Home page - Single Responsibility Principle

import { DEFAULT_PAGE_SIZE } from './constants';
import type { Project, Task, User } from './types';

interface FetchRequest {
  current: number;
  pageSize: number;
  ids?: (string | number)[];
}

interface FetchResponse<T> {
  data: T[];
  total: number;
}

// ============ Users API ============

export const usersApi = {
  fetchList: async (request: FetchRequest): Promise<FetchResponse<User>> => {
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

  fetchByIds: async (ids: (string | number)[]): Promise<User[]> => {
    if (ids.length === 0) return [];
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: 1, pageSize: ids.length, ids }),
    });
    const data = await response.json();
    return data.data;
  },
};

// ============ Projects API ============

export const projectsApi = {
  // Fetch projects by single member ID
  fetchByMember: async (
    memberId: number,
    request: FetchRequest,
  ): Promise<FetchResponse<Project>> => {
    const response = await fetch(
      `/api/users/${memberId}/projects?current=${request.current}&pageSize=${request.pageSize}`,
    );
    const data = await response.json();
    return { data: data.data, total: data.total };
  },

  // Fetch projects by multiple member IDs
  fetchByMembers: async (
    memberIds: number[],
    request: FetchRequest,
  ): Promise<FetchResponse<Project>> => {
    if (memberIds.length === 0) return { data: [], total: 0 };
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'by-members',
        memberIds,
        current: request.current,
        pageSize: request.pageSize,
      }),
    });
    const data = await response.json();
    return { data: data.data, total: data.total };
  },

  fetchByIds: async (ids: (string | number)[]): Promise<Project[]> => {
    if (ids.length === 0) return [];
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'by-members', ids }),
    });
    const data = await response.json();
    return data.data;
  },

  // Fetch by member and filter by IDs
  fetchByMemberAndIds: async (
    memberId: number,
    ids: (string | number)[],
  ): Promise<Project[]> => {
    if (ids.length === 0) return [];
    const response = await fetch(
      `/api/users/${memberId}/projects?pageSize=${DEFAULT_PAGE_SIZE * 10}`,
    );
    const data = await response.json();
    return data.data.filter((p: Project) => ids.includes(p.id));
  },
};

// ============ Tasks API ============

export const tasksApi = {
  fetchByProjects: async (
    projectIds: number[],
    request: FetchRequest,
  ): Promise<FetchResponse<Task>> => {
    if (projectIds.length === 0) return { data: [], total: 0 };
    const response = await fetch('/api/tasks/by-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectIds,
        current: request.current,
        pageSize: request.pageSize,
      }),
    });
    const data = await response.json();
    return { data: data.data, total: data.total };
  },

  fetchByIds: async (ids: (string | number)[]): Promise<Task[]> => {
    if (ids.length === 0) return [];
    const response = await fetch('/api/tasks/by-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const data = await response.json();
    return data.data;
  },
};