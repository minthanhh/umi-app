import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from 'lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const { page, name } = req.query;

        const where: Record<string, unknown> = {};
        if (page) where.page = page;
        if (name) where.name = name;

        // Get all filters matching criteria (always return array for consistency)
        const filters = await prisma.savedFilter.findMany({
          where,
          orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }], // Default filters first
        });

        res.status(200).json({
          data: filters.map((f) => ({
            ...f,
            filters: JSON.parse(f.filters),
          })),
          success: true,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve filters' });
      }
      break;

    case 'POST':
      try {
        const { name, page, filters, isDefault } = req.body;

        if (!name || !page || !filters) {
          return res.status(400).json({
            error: 'Name, page, and filters are required',
          });
        }

        // If setting as default, unset other defaults for this page
        if (isDefault) {
          await prisma.savedFilter.updateMany({
            where: { page, isDefault: true },
            data: { isDefault: false },
          });
        }

        // Upsert the filter (create or update)
        const filter = await prisma.savedFilter.upsert({
          where: { name_page: { name, page } },
          update: {
            filters: JSON.stringify(filters),
            isDefault: isDefault ?? false,
          },
          create: {
            name,
            page,
            filters: JSON.stringify(filters),
            isDefault: isDefault ?? false,
          },
        });

        res.status(200).json({
          data: { ...filter, filters: JSON.parse(filter.filters) },
          success: true,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to save filter' });
      }
      break;

    case 'DELETE':
      try {
        const { name, page } = req.body;

        if (!name || !page) {
          return res.status(400).json({
            error: 'Name and page are required',
          });
        }

        await prisma.savedFilter.delete({
          where: { name_page: { name, page } },
        });

        res.status(200).json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete filter' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
