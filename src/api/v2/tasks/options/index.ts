import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from 'lib/prisma';

/**
 * Tasks Options API
 *
 * GET /api/v2/tasks/options
 *
 * Params:
 * - ids:         Hydrate mode (?ids=1,2,3)
 * - cursor:      Pagination cursor
 * - limit:       Items per page (default: 10, max: 100)
 * - keyword:     Search by title
 * - parentField: Dependent field (projectId | assigneeId | creatorId | status | priority)
 * - parentValue: Dependent field value
 */

// Parse parentValue - supports single value or comma-separated array
function parseParentValue(value: string): (number | string)[] {
  // Decode URL-encoded value first
  const decoded = decodeURIComponent(value);
  const parts = decoded.split(',').filter(Boolean);
  // Try to parse as numbers, fallback to strings
  return parts.map((v) => {
    const num = Number(v.trim());
    return isNaN(num) ? v.trim() : num;
  });
}

// Dependent filter mapping - supports array of values
const filterMap: Record<string, (values: (number | string)[]) => object> = {
  projectId: (ids) => ({ projectId: { in: ids.map(Number) } }),
  assigneeId: (ids) => ({ assigneeId: { in: ids.map(Number) } }),
  creatorId: (ids) => ({ creatorId: { in: ids.map(Number) } }),
  status: (values) => ({ status: { in: values.map(String) } }),
  priority: (values) => ({ priority: { in: values.map(String) } }),
};

export default async function handler(req: UmiApiRequest, res: UmiApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ids, cursor, limit = '10', keyword, parentField, parentValue } = req.query as Record<
    string,
    string
  >;

  try {
    // Hydrate mode
    if (ids) {
      const idList = ids.split(',').map(Number).filter(Boolean);
      const data = await prisma.task.findMany({
        where: { id: { in: idList } },
      });
      return res.status(200).json({ data, success: true });
    }

    // Build where clause
    const conditions: object[] = [];

    if (parentField && parentValue && filterMap[parentField]) {
      const values = parseParentValue(parentValue);
      if (values.length > 0) {
        conditions.push(filterMap[parentField](values));
      }
    }

    if (keyword) {
      conditions.push({
        title: { contains: keyword, mode: 'insensitive' },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};
    const take = Math.min(Number(limit) || 10, 100);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        take: take + 1,
        orderBy: { id: 'asc' },
        ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
      }),
      prisma.task.count({ where }),
    ]);

    const hasNextPage = tasks.length > take;
    const data = hasNextPage ? tasks.slice(0, take) : tasks;

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
    console.error('Tasks options error:', error);
    console.error('Query params:', { ids, cursor, limit, keyword, parentField, parentValue });
    return res.status(500).json({
      error: 'Failed to fetch tasks',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}