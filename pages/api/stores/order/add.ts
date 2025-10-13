import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(10, 60 * 1000); // 10 requests per minute per IP

export default async function addOrder(req: NextApiRequest, res: NextApiResponse) {
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
      orderId,
      orderNumber = 0,
      order_total_inc_tax,
      order_total_ex_tax,
      order_items_total,
      customerId,
      order_json,
      apiToken
    } = req.body;

    //Token check
    const apiTokenPrefix = languageEN?.appApiToken + "-order-add";
    if (apiTokenPrefix !== apiToken) {
      return res.status(401).json({ status: false, message: 'Unauthorized Token' });
    }

    if (!storeHash || !orderId || !customerId) {
      return res.status(400).json({ status: false, message: 'storeHash, orderId and customerId are required' });
    }

    // Insert order
    const result = await mysqlQuery(
      `INSERT INTO bcOrders
        (storeHash, orderId, orderNumber, order_total_inc_tax, order_total_ex_tax, order_items_total, customerId, order_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [storeHash, orderId, orderNumber, order_total_inc_tax, order_total_ex_tax, order_items_total, customerId, order_json]
    );

    const newId = result.insertId;

    res.status(200).json({
      status: true,
      data: { id: newId, orderId, customerId },
      message: 'Order added successfully'
    });

  } catch (error: any) {
    console.error('Add Order Error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
