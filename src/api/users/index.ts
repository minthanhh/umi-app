import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from '../../../lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  switch (req.method) {
    case 'POST': {
      const { action, name, email, avatar } = req.body;

      // Create new user
      if (action === 'create') {
        if (!name || !email) {
          return res.status(400).json({ error: 'Name and email are required' });
        }

        try {
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [{ email }, { name }],
            },
          });

          if (existingUser) {
            return res.status(400).json({
              error:
                existingUser.email === email
                  ? 'Email already exists'
                  : 'Name already exists',
            });
          }

          const newUser = await prisma.user.create({
            data: {
              name,
              email,
              avatar: avatar || null,
            },
          });

          return res.status(201).json({ data: newUser, success: true });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Failed to create user' });
        }
      }

      // Action: Get users by IDs (for hydration)
      if (action === 'by-ids') {
        const { ids = [] } = req.body;
        if (!ids.length) {
          return res.status(200).json({ data: [], total: 0, success: true });
        }
        try {
          const users = await prisma.user.findMany({
            where: { id: { in: ids.map((id: string | number) => Number(id)) } },
          });
          return res.status(200).json({ data: users, total: users.length, success: true });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Failed to retrieve users by IDs' });
        }
      }

      // List users (default action)
      const { current = '1', pageSize = '10', sorter, ids = [], keyword } = req.body;
      const page = parseInt(current as string, 10);
      const limit = parseInt(pageSize as string, 10);
      const skip = (page - 1) * limit;

      try {
        const whereClause: Record<string, unknown> = {};

        // Filter by IDs if provided
        if (ids.length > 0) {
          whereClause.id = { in: ids };
        }

        // Search by keyword
        if (keyword) {
          whereClause.OR = [
            { name: { contains: keyword, mode: 'insensitive' } },
            { email: { contains: keyword, mode: 'insensitive' } },
          ];
        }

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            skip,
            take: limit,
            orderBy: sorter || { id: 'asc' },
            where: whereClause,
          }),
          prisma.user.count({
            where: whereClause,
          }),
        ]);

        res.status(200).json({
          data: users,
          total,
          success: true,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve users' });
      }
      break;
    }
    case 'DELETE': {
      const { id: deleteId } = req.query;
      if (!deleteId) {
        return res.status(400).json({ error: 'Missing user ID' });
      }
      try {
        await prisma.user.delete({
          where: { id: Number(deleteId) },
        });
        res.status(204).json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
      }
      break;
    }
    case 'PUT': {
      const { id: updateId } = req.query;
      const { name: updateName, email: updateEmail } = req.body;
      if (!updateId) {
        return res.status(400).json({ error: 'Missing user ID' });
      }
      try {
        const updatedUser = await prisma.user.update({
          where: { id: Number(updateId) },
          data: {
            name: updateName,
            email: updateEmail,
          },
        });
        res.status(200).json(updatedUser);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
      }
      break;
    }
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
