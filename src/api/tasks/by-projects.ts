import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from 'lib/prisma';

// POST /api/tasks/by-projects - Get tasks from multiple projects
export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    projectIds = [],
    current = 1,
    pageSize = 10,
    ids = [],
    status,
    priority,
  } = req.body;

  try {
    const page = parseInt(current as string, 10);
    const limit = parseInt(pageSize as string, 10);
    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: Record<string, unknown> = {};

    // If specific task IDs requested (for fetchByIds)
    if (ids.length > 0) {
      whereClause = { id: { in: ids } };
    }
    // If filtering by project IDs
    else if (projectIds.length > 0) {
      whereClause = {
        projectId: { in: projectIds.map((id: string | number) => Number(id)) },
      };
    }

    // Add optional filters
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

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
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where: whereClause }),
    ]);

    res.status(200).json({
      data: tasks,
      total,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching tasks by projects:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
}
