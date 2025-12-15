import { UmiApiRequest, UmiApiResponse } from '@umijs/max';

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  switch (req.method) {
    case 'GET':
      res.status(200).json({ error: 'Successfully HELLOO' });
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
