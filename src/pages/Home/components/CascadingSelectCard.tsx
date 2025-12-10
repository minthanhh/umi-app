import { Card, Col, Form, Row, Tag, Typography } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import type { Project, SelectMode, Task } from '../types';
import { MemberSelect } from './MemberSelect';
import { ProjectSelect } from './ProjectSelect';
import { TaskSelect } from './TaskSelect';

const { Title, Text } = Typography;

interface CascadingSelectCardProps {
  mode: SelectMode;
}

interface SelectedValuesDisplayProps {
  mode: SelectMode;
  memberIds: number[];
  projectIds: number[];
  taskIds: number[];
}

const SelectedValuesDisplay: React.FC<SelectedValuesDisplayProps> = ({
  mode,
  memberIds,
  projectIds,
  taskIds,
}) => {
  const isMultiple = mode === 'multiple';

  if (isMultiple) {
    return (
      <Card size="small" title="Selected Values (Multiple)">
        <Row gutter={[16, 8]}>
          <Col span={8}>
            <Text strong>Member IDs: </Text>
            {memberIds.length > 0 ? (
              memberIds.map((id) => (
                <Tag key={id} color="purple">
                  {id}
                </Tag>
              ))
            ) : (
              <Text type="secondary">None</Text>
            )}
          </Col>
          <Col span={8}>
            <Text strong>Project IDs: </Text>
            {projectIds.length > 0 ? (
              projectIds.map((id) => (
                <Tag key={id} color="blue">
                  {id}
                </Tag>
              ))
            ) : (
              <Text type="secondary">None</Text>
            )}
          </Col>
          <Col span={8}>
            <Text strong>Task IDs: </Text>
            {taskIds.length > 0 ? (
              taskIds.map((id) => (
                <Tag key={id} color="green">
                  {id}
                </Tag>
              ))
            ) : (
              <Text type="secondary">None</Text>
            )}
          </Col>
        </Row>
      </Card>
    );
  }

  return (
    <Card size="small" title="Selected Values (Single)">
      <Text>
        <strong>Member ID:</strong> {memberIds[0] ?? 'None'}
        {' | '}
        <strong>Project ID:</strong> {projectIds[0] ?? 'None'}
        {' | '}
        <strong>Task ID:</strong> {taskIds[0] ?? 'None'}
      </Text>
    </Card>
  );
};

export const CascadingSelectCard: React.FC<CascadingSelectCardProps> = ({ mode }) => {
  const [form] = Form.useForm();
  const isMultiple = mode === 'multiple';

  // State
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [projectIds, setProjectIds] = useState<number[]>([]);
  const [taskIds, setTaskIds] = useState<number[]>([]);
  const [projectsKey, setProjectsKey] = useState(0);
  const [tasksKey, setTasksKey] = useState(0);

  // Store project-member and task-project relationships for smart cascade
  const projectMemberMapRef = useRef<Map<number, number[]>>(new Map()); // projectId -> memberIds
  const taskProjectMapRef = useRef<Map<number, number>>(new Map()); // taskId -> projectId

  // Handlers with cascading reset
  const handleMemberChange = useCallback(
    (newMemberIds: number[]) => {
      if (!isMultiple) {
        // Single mode: clear everything as before
        setMemberIds(newMemberIds);
        setProjectIds([]);
        setTaskIds([]);
        form.setFieldsValue({ projectIds: [], taskIds: [] });
        setProjectsKey((k) => k + 1);
        setTasksKey((k) => k + 1);
        return;
      }

      // Multiple mode: smart cascade
      const removedMemberIds = memberIds.filter((id) => !newMemberIds.includes(id));

      if (removedMemberIds.length > 0) {
        // Find projects that belong to removed members and should be removed
        const projectsToRemove: number[] = [];
        projectMemberMapRef.current.forEach((projectMemberIds, projectId) => {
          // Check if ALL members of this project are NOT in newMemberIds
          const hasRemainingMember = projectMemberIds.some((memberId) =>
            newMemberIds.includes(memberId),
          );
          if (!hasRemainingMember) {
            projectsToRemove.push(projectId);
          }
        });

        // Filter out removed projects
        const newProjectIds = projectIds.filter((id) => !projectsToRemove.includes(id));

        // Find tasks that belong to removed projects
        const tasksToRemove: number[] = [];
        taskProjectMapRef.current.forEach((projectId, taskId) => {
          if (projectsToRemove.includes(projectId)) {
            tasksToRemove.push(taskId);
          }
        });

        // Filter out removed tasks
        const newTaskIds = taskIds.filter((id) => !tasksToRemove.includes(id));

        // Update states
        setMemberIds(newMemberIds);
        setProjectIds(newProjectIds);
        setTaskIds(newTaskIds);
        form.setFieldsValue({ projectIds: newProjectIds, taskIds: newTaskIds });

        // Increment key to refresh dropdown options
        setProjectsKey((k) => k + 1);
        if (projectsToRemove.length > 0) {
          setTasksKey((k) => k + 1);
        }
      } else {
        // No members removed, just adding new members
        setMemberIds(newMemberIds);
        setProjectsKey((k) => k + 1);
      }
    },
    [form, isMultiple, memberIds, projectIds, taskIds],
  );

  const handleProjectChange = useCallback(
    (newProjectIds: number[], selectedProjects?: Project[]) => {
      if (!isMultiple) {
        // Single mode: clear tasks as before
        setProjectIds(newProjectIds);
        setTaskIds([]);
        form.setFieldsValue({ taskIds: [] });
        setTasksKey((k) => k + 1);
        return;
      }

      // Multiple mode: smart cascade
      const removedProjectIds = projectIds.filter((id) => !newProjectIds.includes(id));

      // Update project-member map with new selections
      if (selectedProjects) {
        selectedProjects.forEach((project) => {
          const projectMemberIds = project.members?.map((m) => m.userId) ?? [];
          projectMemberMapRef.current.set(project.id, projectMemberIds);
        });
      }

      // Remove deselected projects from map
      removedProjectIds.forEach((id) => {
        projectMemberMapRef.current.delete(id);
      });

      if (removedProjectIds.length > 0) {
        // Find tasks that belong to removed projects
        const tasksToRemove: number[] = [];
        taskProjectMapRef.current.forEach((projectId, taskId) => {
          if (removedProjectIds.includes(projectId)) {
            tasksToRemove.push(taskId);
          }
        });

        // Filter out removed tasks
        const newTaskIds = taskIds.filter((id) => !tasksToRemove.includes(id));

        // Clean up task-project map
        tasksToRemove.forEach((taskId) => {
          taskProjectMapRef.current.delete(taskId);
        });

        setProjectIds(newProjectIds);
        setTaskIds(newTaskIds);
        form.setFieldsValue({ taskIds: newTaskIds });
        setTasksKey((k) => k + 1);
      } else {
        // No projects removed
        setProjectIds(newProjectIds);
        setTasksKey((k) => k + 1);
      }
    },
    [form, isMultiple, projectIds, taskIds],
  );

  const handleTaskChange = useCallback(
    (newTaskIds: number[], selectedTasks?: Task[]) => {
      // Update task-project map
      if (selectedTasks && isMultiple) {
        selectedTasks.forEach((task) => {
          if (task.project?.id) {
            taskProjectMapRef.current.set(task.id, task.project.id);
          }
        });
      }

      // Remove deselected tasks from map
      const removedTaskIds = taskIds.filter((id) => !newTaskIds.includes(id));
      removedTaskIds.forEach((id) => {
        taskProjectMapRef.current.delete(id);
      });

      setTaskIds(newTaskIds);
    },
    [isMultiple, taskIds],
  );

  // Config based on mode
  const tagColor = isMultiple ? 'purple' : 'blue';
  const tagText = isMultiple ? 'Multiple' : 'Single';
  const title = isMultiple
    ? 'Cascading Selects: Members → Projects → Tasks'
    : 'Cascading Selects: Member → Project → Task';
  const description = isMultiple
    ? 'Select multiple Members to load all their Projects, then select multiple Projects to load Tasks'
    : 'Select 1 Member to load their Projects, then select 1 Project to load Tasks';
  const queryPrefix = isMultiple ? 'multi' : 'single';

  return (
    <Card>
      <Title level={4}>
        <Tag color={tagColor}>{tagText}</Tag> {title}
      </Title>
      <Text type="secondary">{description}</Text>

      <Form layout="vertical" form={form} style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item name="memberIds" label="1. Select Member(s)">
              <MemberSelect
                mode={mode}
                value={memberIds}
                onChange={handleMemberChange}
                queryKey={`cascading-members-${queryPrefix}`}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="projectIds" label="2. Select Project(s)">
              <ProjectSelect
                mode={mode}
                memberIds={memberIds}
                value={projectIds}
                onChange={handleProjectChange}
                queryKey={`cascading-projects-${queryPrefix}-${memberIds.join(',')}`}
                resetKey={projectsKey}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="taskIds" label="3. Select Task(s)">
              <TaskSelect
                mode={mode}
                projectIds={projectIds}
                value={taskIds}
                onChange={handleTaskChange}
                queryKey={`cascading-tasks-${queryPrefix}-${projectIds.join(',')}`}
                resetKey={tasksKey}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <SelectedValuesDisplay
              mode={mode}
              memberIds={memberIds}
              projectIds={projectIds}
              taskIds={taskIds}
            />
          </Col>
        </Row>
      </Form>
    </Card>
  );
};