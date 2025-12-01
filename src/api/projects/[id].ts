import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import { prisma } from 'lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  const { id } = req.params;
  const projectId = parseInt(id as string, 10);

  if (isNaN(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
            tasks: {
              include: {
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
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json({ data: project, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve project' });
      }
      break;

    case 'PUT':
      try {
        const { name, description, status } = req.body;

        const project = await prisma.project.update({
          where: { id: projectId },
          data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(status && { status }),
          },
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        });

        res.status(200).json({ data: project, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
      }
      break;

    case 'DELETE':
      try {
        await prisma.project.delete({
          where: { id: projectId },
        });
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}