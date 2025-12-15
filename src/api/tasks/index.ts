import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from '../../../lib/prisma';

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

        const [tasks, total] = await Promise.all([
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
          action,
          title,
          description,
          projectId,
          projectIds = [],
          ids = [],
          creatorId,
          assigneeId,
          status,
          priority,
          dueDate,
          current = 1,
          pageSize = 10,
          keyword,
        } = req.body;

        // Action: Get tasks by IDs (for hydration)
        if (action === 'by-ids') {
          if (!ids.length) {
            return res.status(200).json({ data: [], total: 0, success: true });
          }
          const tasks = await prisma.task.findMany({
            where: { id: { in: ids.map((id: string | number) => Number(id)) } },
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
          return res.status(200).json({ data: tasks, total: tasks.length, success: true });
        }

        // Action: Get tasks by project IDs
        if (action === 'by-projects') {
          const page = parseInt(current as string, 10);
          const limit = parseInt(pageSize as string, 10);
          const skip = (page - 1) * limit;

          const whereClause: Record<string, unknown> = {};

          // Filter by project IDs
          if (projectIds.length > 0) {
            whereClause.projectId = {
              in: projectIds.map((id: string | number) => Number(id)),
            };
          }

          // Search by keyword
          if (keyword) {
            whereClause.OR = [
              { title: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
            ];
          }

          const [tasks, total] = await Promise.all([
            prisma.task.findMany({
              where: whereClause,
              skip,
              take: limit,
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
              orderBy: { createdAt: 'desc' },
            }),
            prisma.task.count({ where: whereClause }),
          ]);

          return res.status(200).json({
            data: tasks,
            total,
            success: true,
          });
        }

        // Default action: Create new task
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
        console.error('Tasks API error:', error);
        res.status(500).json({ error: 'Failed to process task request' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
