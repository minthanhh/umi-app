import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from '../../../../../lib/prisma';

/**
 * Projects Options API
 *
 * GET /api/v2/projects/options
 *
 * Params:
 * - ids:         Hydrate mode (?ids=1,2,3)
 * - cursor:      Pagination cursor
 * - limit:       Items per page (default: 10, max: 100)
 * - keyword:     Search by name
 * - parentField: Dependent field (ownerId | memberId)
 * - parentValue: Dependent field value
 */

// Parse parentValue - supports single value or comma-separated array
function parseParentValue(value: string): number[] {
  const decoded = decodeURIComponent(value);
  return decoded.split(',').map((v) => Number(v.trim())).filter(Boolean);
}

// Dependent filter mapping - supports array of values
const filterMap: Record<string, (values: number[]) => object> = {
  ownerId: (ids) => ({ ownerId: { in: ids } }),
  memberId: (ids) => ({ members: { some: { userId: { in: ids } } } }),
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
      const data = await prisma.project.findMany({
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
        name: { contains: keyword, mode: 'insensitive' },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};
    const take = Math.min(Number(limit) || 10, 100);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        take: take + 1,
        orderBy: { id: 'asc' },
        ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
      }),
      prisma.project.count({ where }),
    ]);

    const hasNextPage = projects.length > take;
    const data = hasNextPage ? projects.slice(0, take) : projects;

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
    console.error('Projects options error:', error);
    console.error('Query params:', { ids, cursor, limit, keyword, parentField, parentValue });
    return res.status(500).json({
      error: 'Failed to fetch projects',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}