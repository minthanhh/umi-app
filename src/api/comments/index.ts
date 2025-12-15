import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from '../../../lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const { current = '1', pageSize = '10', taskId, authorId } = req.query;

        const page = parseInt(current as string, 10);
        const limit = parseInt(pageSize as string, 10);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (taskId) where.taskId = parseInt(taskId as string, 10);
        if (authorId) where.authorId = parseInt(authorId as string, 10);

        const [comments, total] = await Promise.all([
          prisma.comment.findMany({
            skip,
            take: limit,
            where,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              task: {
                select: { id: true, title: true },
              },
            },
          }),
          prisma.comment.count({ where }),
        ]);

        res.status(200).json({
          data: comments,
          total,
          success: true,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve comments' });
      }
      break;

    case 'POST':
      try {
        const { content, taskId, authorId } = req.body;

        if (!content || !taskId || !authorId) {
          return res
            .status(400)
            .json({ error: 'Content, taskId, and authorId are required' });
        }

        const comment = await prisma.comment.create({
          data: {
            content,
            taskId: parseInt(taskId, 10),
            authorId: parseInt(authorId, 10),
          },
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            task: {
              select: { id: true, title: true },
            },
          },
        });

        res.status(201).json({ data: comment, success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create comment' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
