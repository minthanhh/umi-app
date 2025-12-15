import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from '../../../../lib/prisma';

// GET /api/projects/:id/tasks - Get tasks for a specific project
export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.params;
  const { current = '1', pageSize = '10', status, priority } = req.query;
  const projectId = parseInt(id as string, 10);

  if (isNaN(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    const page = parseInt(current as string, 10);
    const limit = parseInt(pageSize as string, 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve project tasks' });
  }
}
