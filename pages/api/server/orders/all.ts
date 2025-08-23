import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";

export default async function list(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      return res.status(405).json({ status: false, error: 'Method not allowed' });
    }
    try {

      const { storeHash, user } = await getSession(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const { page, limit } = req.body;
      const offset = (page - 1) * limit;

      const [items, totalResult]: any = await Promise.all([
        mysqlQuery(
          "SELECT `id`,`orderId`,`order_items_total`, order_total_inc_tax, order_total_ex_tax FROM bcOrders WHERE storeHash = ?  ORDER BY id DESC LIMIT ? OFFSET ?",
          [storeHash, limit, offset]
        ),
        mysqlQuery(
          "SELECT COUNT(id) as total FROM bcOrders WHERE storeHash = ?",
          [storeHash]
        ),
      ]);

      const totalItems = totalResult[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      res.status(200).json({
        status: true,
        orders: items,
        pagination: {
          currentPage: page,
          totalItems,
          totalPages,
          perPage: limit,
        },
      });
    } catch (error) {
      const { message } = error;
      console.error("DB Error:", error);
      res.status(500).json({ status: false, message: message+".." });
    }

    //res.status(200).json({message:"Success"});
  } catch (error) {
    const { message, response } = error;
    res.status(response?.status || 500).json({ status: false, message });
  }
}
