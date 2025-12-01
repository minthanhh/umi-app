import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import { prisma } from 'lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  const { id } = req.params;
  const commentId = parseInt(id as string, 10);

  if (isNaN(commentId)) {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            task: {
              select: { id: true, title: true },
            },
          },
        });

        if (!comment) {
          return res.status(404).json({ error: 'Comment not found' });
        }

        res.status(200).json({ data: comment, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve comment' });
      }
      break;

    case 'PUT':
      try {
        const { content } = req.body;

        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }

        const comment = await prisma.comment.update({
          where: { id: commentId },
          data: { content },
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            task: {
              select: { id: true, title: true },
            },
          },
        });

        res.status(200).json({ data: comment, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update comment' });
      }
      break;

    case 'DELETE':
      try {
        await prisma.comment.delete({
          where: { id: commentId },
        });
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete comment' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}