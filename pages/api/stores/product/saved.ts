import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';

const checkRate = rateLimit(20, 60 * 1000); // 20 requests per minute per IP

export default async function listProducts(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: false, message: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!checkRate(ip)) {
      return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
    }

    const { storeHash, designId } = req.body;

    if (!storeHash) {
      return res.status(400).json({ status: false, message: 'storeHash is required' });
    }

    //Fetch products with pagination
    const productsSaved = await mysqlQuery(`SELECT product_data FROM productSaved WHERE "storeHash" = ? AND "id" = ?`, [storeHash, designId]);

    if (productsSaved.length === 0) {
      return res.status(404).json({ status: false, message: 'Saved product not found' });
    }

    res.status(200).json({
      status: true,
      data: productsSaved[0],
      message: 'Successfully'
    })

  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
