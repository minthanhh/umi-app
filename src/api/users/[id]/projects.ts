import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from 'lib/prisma';

// GET /api/users/:id/projects - Get projects where user is a member
export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.params;
  const { current = '1', pageSize = '10' } = req.query;
  const userId = parseInt(id as string, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const page = parseInt(current as string, 10);
    const limit = parseInt(pageSize as string, 10);
    const skip = (page - 1) * limit;

    // Find projects where user is a member (via ProjectMember table)
    const [projectMembers, total] = await Promise.all([
      prisma.projectMember.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          project: {
            include: {
              owner: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              _count: {
                select: { tasks: true, members: true },
              },
            },
          },
        },
        orderBy: { project: { createdAt: 'desc' } },
      }),
      prisma.projectMember.count({ where: { userId } }),
    ]);

    const projects = projectMembers.map((pm) => ({
      ...pm.project,
      memberRole: pm.role,
    }));

    res.status(200).json({
      data: projects,
      total,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve user projects' });
  }
}
