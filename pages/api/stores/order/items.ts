import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(20, 60 * 1000); // 20 requests per minute per IP

export default async function listOrderItems(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: false, message: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!checkRate(ip)) {
      return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
    }

    const { storeHash, orderId, apiToken } = req.body;

    //Token check
    const apiTokenPrefix = languageEN?.appApiToken + "-order-items";
    if (apiTokenPrefix !== apiToken) {
      return res.status(401).json({ status: false, message: 'Unauthorized Token' });
    }

    if (!storeHash || !orderId) {
      return res.status(400).json({ status: false, message: 'storeHash and orderId are required' });
    }

    // Fetch all order items for the given store + order
    const orderItems = await mysqlQuery(
      `SELECT id, storeHash, bcOrdersId, orderId, productId, productName, productSku, 
              designId, designArea, previewUrl, productJson, createdAt
       FROM bcOrderProducts
       WHERE storeHash = ? AND orderId = ?
       ORDER BY id ASC`,
      [storeHash, orderId]
    );

    res.status(200).json({
      status: true,
      data: orderItems,
      message: 'Success'
    });

  } catch (error: any) {
    console.error("Order Items Error:", error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
