import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from 'lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  const { id } = req.params;
  const projectId = parseInt(id as string, 10);

  if (isNaN(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const members = await prisma.projectMember.findMany({
          where: { projectId },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        });

        res.status(200).json({ data: members, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve members' });
      }
      break;

    case 'POST':
      try {
        const { userId, role } = req.body;

        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const member = await prisma.projectMember.create({
          data: {
            userId: parseInt(userId, 10),
            projectId,
            role: role || 'member',
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        });

        res.status(201).json({ data: member, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to add member' });
      }
      break;

    case 'DELETE':
      try {
        const { userId } = req.body;

        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        await prisma.projectMember.delete({
          where: {
            userId_projectId: {
              userId: parseInt(userId, 10),
              projectId,
            },
          },
        });

        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
