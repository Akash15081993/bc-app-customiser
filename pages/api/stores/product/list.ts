import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

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

    const { storeHash, page = 1, limit = 10, apiToken, searchTerm = "" } = req.body;

    //Token check
    const apiTokenPrefix = languageEN?.appApiToken + "-product-list";
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
      whereClause += " AND (productSku LIKE ? OR productName LIKE ?)";
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    //Fetch products with pagination
    const products = await mysqlQuery(
      `SELECT id, productId, productSku, productName, productImage 
       FROM products 
       ${whereClause} 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    //Count total
    const countResult = await mysqlQuery(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      status: true,
      data: {
        products,
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
    console.error('Error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
