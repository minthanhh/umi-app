import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from '../../../../../lib/prisma';

/**
 * Comments Options API
 *
 * GET /api/v2/comments/options
 *
 * Params:
 * - ids:         Hydrate mode (?ids=1,2,3)
 * - cursor:      Pagination cursor
 * - limit:       Items per page (default: 10, max: 100)
 * - keyword:     Search by content
 *
 * Multiple parent dependencies (use directly as query params):
 * - authorId:    Filter by author(s) (?authorId=1 or ?authorId=1,2,3)
 * - taskId:      Filter by task(s) (?taskId=1 or ?taskId=1,2,3)
 *
 * Example: ?authorId=1,2&taskId=5 (comments by authors 1 or 2 AND on task 5)
 */

// Parse value - supports single value or comma-separated array
function parseIds(value: string | undefined): number[] | null {
  if (!value) return null;
  const decoded = decodeURIComponent(value);
  const ids = decoded
    .split(',')
    .map((v) => Number(v.trim()))
    .filter(Boolean);
  return ids.length > 0 ? ids : null;
}

export default async function handler(req: UmiApiRequest, res: UmiApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ids, cursor, limit = '10', keyword, authorId, taskId } = req.query as Record<
    string,
    string
  >;

  try {
    // Hydrate mode
    if (ids) {
      const idList = ids.split(',').map(Number).filter(Boolean);
      const data = await prisma.comment.findMany({
        where: { id: { in: idList } },
        include: {
          author: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      });
      return res.status(200).json({ data, success: true });
    }

    // Build where clause
    const conditions: object[] = [];

    // Multiple parent dependencies
    const authorIds = parseIds(authorId);
    if (authorIds) {
      conditions.push({ authorId: { in: authorIds } });
    }

    const taskIds = parseIds(taskId);
    if (taskIds) {
      conditions.push({ taskId: { in: taskIds } });
    }

    // Keyword search
    if (keyword) {
      conditions.push({
        content: { contains: keyword, mode: 'insensitive' },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};
    const take = Math.min(Number(limit) || 10, 100);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        take: take + 1,
        orderBy: { id: 'asc' },
        include: {
          author: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
        ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
      }),
      prisma.comment.count({ where }),
    ]);

    const hasNextPage = comments.length > take;
    const data = hasNextPage ? comments.slice(0, take) : comments;

    return res.status(200).json({
      data,
      pageInfo: {
        hasNextPage,
        hasPrevPage: Boolean(cursor),
        startCursor: data[0]?.id?.toString() ?? null,
        endCursor: data[data.length - 1]?.id?.toString() ?? null,
        total,
      },
      success: true,
    });
  } catch (error) {
    console.error('Comments options error:', error);
    console.error('Query params:', { ids, cursor, limit, keyword, authorId, taskId });
    return res.status(500).json({
      error: 'Failed to fetch comments',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}
