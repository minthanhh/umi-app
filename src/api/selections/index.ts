/**
 * Selections API - Save/Load user selections for SmartSelect demo
 *
 * GET: Load saved selections for a page
 * POST: Save selections for a page
 */

import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: UmiApiRequest,
  res: UmiApiResponse,
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        // Get page from query params
        const { page = 'smart-select-demo' } = req.query;

        // Find saved filter for this page
        const saved = await prisma.savedFilter.findFirst({
          where: {
            page: page as string,
            isDefault: true,
          },
        });

        if (!saved) {
          return res.status(200).json({
            success: true,
            data: null,
          });
        }

        // Parse the JSON filters
        const selections = JSON.parse(saved.filters || '{}');

        return res.status(200).json({
          success: true,
          data: selections,
        });
      }

      case 'POST': {
        const { page = 'smart-select-demo', selections } = req.body;

        if (!selections) {
          return res.status(400).json({
            success: false,
            error: 'Missing selections data',
          });
        }

        // Upsert the saved filter
        const saved = await prisma.savedFilter.upsert({
          where: {
            name_page: {
              name: 'default',
              page,
            },
          },
          update: {
            filters: JSON.stringify(selections),
            updatedAt: new Date(),
          },
          create: {
            name: 'default',
            page,
            filters: JSON.stringify(selections),
            isDefault: true,
          },
        });

        return res.status(200).json({
          success: true,
          data: JSON.parse(saved.filters),
        });
      }

      default:
        res.header('Allow', 'GET, POST');
        return res.status(405).json({
          success: false,
          error: `Method ${method} Not Allowed`,
        });
    }
  } catch (error) {
    console.error('Selections API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}