import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from 'lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const { current = '1', pageSize = '10', ownerId, status } = req.query;
        const page = parseInt(current as string, 10);
        const limit = parseInt(pageSize as string, 10);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (ownerId) where.ownerId = parseInt(ownerId as string, 10);
        if (status) where.status = status;

        const [projects, total] = await Promise.all([
          prisma.project.findMany({
            skip,
            take: limit,
            where,
            orderBy: { createdAt: 'desc' },
            include: {
              owner: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              _count: {
                select: { tasks: true, members: true },
              },
            },
          }),
          prisma.project.count({ where }),
        ]);

        res.status(200).json({
          data: projects,
          total,
          success: true,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve projects' });
      }
      break;

    case 'POST':
      try {
        const { name, description, ownerId, status } = req.body;

        if (!name || !ownerId) {
          return res
            .status(400)
            .json({ error: 'Name and ownerId are required' });
        }

        const project = await prisma.project.create({
          data: {
            name,
            description,
            status: status || 'active',
            ownerId: parseInt(ownerId, 10),
          },
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        });

        // Add owner as a project member with 'owner' role
        await prisma.projectMember.create({
          data: {
            userId: parseInt(ownerId, 10),
            projectId: project.id,
            role: 'owner',
          },
        });

        res.status(201).json({ data: project, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
