import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import { prisma } from 'lib/prisma';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  switch (req.method) {
    case 'POST':
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const { current = '1', pageSize = '10', sorter, ids } = req.body;
      const page = parseInt(current as string, 10);
      const limit = parseInt(pageSize as string, 10);
      const skip = (page - 1) * limit;

      try {
        const [users, total] = await prisma.$transaction([
          prisma.user.findMany({
            skip,
            take: limit,
            orderBy: sorter,
            where: {
              id: { in: ids },
            },
          }),
          prisma.user.count(),
        ]);

        res.status(200).json({
          data: users,
          total,
          success: true,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users' });
      }
      break;
    // case 'POST':
    //   const { name, email } = req.body;
    //   try {
    //     const newUser = await prisma.user.create({
    //       data: {
    //         name,
    //         email,
    //         avatar: `https://i.pravatar.cc/150?u=${mock.Random.guid()}`,
    //       },
    //     });
    //     res.status(201).json(newUser);
    //   } catch (error) {
    //     res.status(500).json({ error: 'Failed to create user' });
    //   }
    //   break;
    case 'DELETE':
      const { id: deleteId } = req.query;
      if (!deleteId) {
        return res.status(400).json({ error: 'Missing user ID' });
      }
      try {
        await prisma.user.delete({
          where: { id: Number(deleteId) },
        });
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
      }
      break;
    case 'PUT':
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
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
