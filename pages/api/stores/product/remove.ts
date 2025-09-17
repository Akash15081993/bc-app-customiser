import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(12, 60 * 1000); // 12 requests per minute per IP

export default async function remove(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow DELETE
    if (req.method !== 'DELETE') {
      return res.status(405).json({ status: false, message: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!checkRate(ip)) {
      return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
    }

    try {
      const { id, storeHash, apiToken } = req.body;

      if (!id || !storeHash) {
        return res.status(400).json({ status: false, message: 'id and storeHash are required' });
      }

      const apiTokenPrefix = languageEN?.appApiToken + "-product-delete";
      if (apiTokenPrefix !== apiToken) {
        return res.status(401).json({ status: false, message: 'Unauthorized Token' });
      }

      // delete product record
      const q = "DELETE FROM products WHERE id = ? AND storeHash = ?";
      const params = [id, storeHash];

      const result = await mysqlQuery(q, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ status: false, message: 'Product not found or not owned by this store' });
      }

      res.status(200).json({
        status: true,
        data: { id },
        message: 'Product deleted successfully.',
      });

    } catch (error) {
      console.error('DB Error:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }

  } catch (error: any) {
    const { message, response } = error;
    res.status(response?.status || 500).json({ status: false, message });
  }
}
