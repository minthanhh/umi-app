import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import { prisma } from 'lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  const { id } = req.params;
  const taskId = parseInt(id as string, 10);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: {
            project: {
              select: { id: true, name: true },
            },
            creator: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            comments: {
              include: {
                author: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json({ data: task, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve task' });
      }
      break;

    case 'PUT':
      try {
        const { title, description, status, priority, assigneeId, dueDate } =
          req.body;

        const task = await prisma.task.update({
          where: { id: taskId },
          data: {
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(status && { status }),
            ...(priority && { priority }),
            ...(assigneeId !== undefined && {
              assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,
            }),
            ...(dueDate !== undefined && {
              dueDate: dueDate ? new Date(dueDate) : null,
            }),
          },
          include: {
            project: {
              select: { id: true, name: true },
            },
            creator: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        });

        res.status(200).json({ data: task, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
      }
      break;

    case 'DELETE':
      try {
        await prisma.task.delete({
          where: { id: taskId },
        });
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}