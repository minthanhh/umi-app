import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import { prisma } from 'lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const {
          current = '1',
          pageSize = '10',
          projectId,
          status,
          priority,
          assigneeId,
          creatorId,
        } = req.query;

        const page = parseInt(current as string, 10);
        const limit = parseInt(pageSize as string, 10);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = parseInt(projectId as string, 10);
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assigneeId) where.assigneeId = parseInt(assigneeId as string, 10);
        if (creatorId) where.creatorId = parseInt(creatorId as string, 10);

        const [tasks, total] = await prisma.$transaction([
          prisma.task.findMany({
            skip,
            take: limit,
            where,
            orderBy: { createdAt: 'desc' },
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
              _count: {
                select: { comments: true },
              },
            },
          }),
          prisma.task.count({ where }),
        ]);

        res.status(200).json({
          data: tasks,
          total,
          success: true,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve tasks' });
      }
      break;

    case 'POST':
      try {
        const {
          title,
          description,
          projectId,
          creatorId,
          assigneeId,
          status,
          priority,
          dueDate,
        } = req.body;

        if (!title || !projectId || !creatorId) {
          return res
            .status(400)
            .json({ error: 'Title, projectId, and creatorId are required' });
        }

        const task = await prisma.task.create({
          data: {
            title,
            description,
            projectId: parseInt(projectId, 10),
            creatorId: parseInt(creatorId, 10),
            assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,
            status: status || 'todo',
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : null,
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

        res.status(201).json({ data: task, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}