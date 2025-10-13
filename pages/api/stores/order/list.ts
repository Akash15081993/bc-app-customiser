import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(20, 60 * 1000); // 20 requests per minute per IP

export default async function listOrders(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: false, message: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!checkRate(ip)) {
      return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
    }

    const { storeHash, page = 1, limit = 10, apiToken, searchTerm = "" } = req.body;

    //Token check
    const apiTokenPrefix = languageEN?.appApiToken + "-order-list";
    if (apiTokenPrefix !== apiToken) {
      return res.status(401).json({ status: false, message: 'Unauthorized Token' });
    }

    if (!storeHash) {
      return res.status(400).json({ status: false, message: 'storeHash is required' });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    //Build WHERE clause
    let whereClause = "WHERE storeHash = ?";
    const params: any[] = [storeHash];

    if (searchTerm && searchTerm.trim() !== "") {
      whereClause += " AND (orderId LIKE ? OR customerId LIKE ? OR orderNumber LIKE ?)";
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    //Fetch orders
    const orders = await mysqlQuery(
      `SELECT id, storeHash, orderId, order_total_inc_tax, order_total_ex_tax, 
              order_items_total, customerId, order_json, createdAt, orderNumber
       FROM bcOrders
       ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    // Count total
    const countResult = await mysqlQuery(
      `SELECT COUNT(*) as total FROM bcOrders ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      status: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        }
      },
      message: "Success."
    });

  } catch (error: any) {
    console.error("Order List Error:", error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}