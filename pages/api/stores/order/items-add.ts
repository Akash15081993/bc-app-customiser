import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(30, 60 * 1000); // 20 requests per minute per IP

export default async function addOrderItem(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: false, message: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!checkRate(ip)) {
      return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
    }

    const {
      storeHash,
      bcOrdersId,
      orderId,
      productId,
      productName,
      productSku,
      designId,
      designArea,
      previewUrl,
      productJson,
      apiToken
    } = req.body;

    //Token check
    const apiTokenPrefix = languageEN?.appApiToken + "-order-item-add";
    if (apiTokenPrefix !== apiToken) {
      return res.status(401).json({ status: false, message: 'Unauthorized Token' });
    }

    if (!storeHash || !orderId || !productId) {
      return res.status(400).json({ status: false, message: 'storeHash, orderId, and productId are required' });
    }

    // Insert order item
    const result = await mysqlQuery(
      `INSERT INTO bcOrderProducts
        (storeHash, bcOrdersId, orderId, productId, productName, productSku, designId, designArea, previewUrl, productJson)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [storeHash, bcOrdersId, orderId, productId, productName, productSku, designId, designArea, previewUrl, productJson]
    );

    const newId = result.insertId;

    res.status(200).json({
      status: true,
      data: { id: newId, orderId, productId },
      message: 'Order item added successfully'
    });

  } catch (error: any) {
    console.error('Add Order Item Error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
