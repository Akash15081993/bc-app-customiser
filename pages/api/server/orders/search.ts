import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    
    const { storeHash, user } = await getSession(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { searchOrderId } = req.body;

    if (!searchOrderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const rows = await mysqlQuery("SELECT `id`,`orderId`,`order_items_total`, order_total_inc_tax, order_total_ex_tax FROM bcOrders WHERE storeHash = ? AND orderId = ? GROUP BY orderId ",[storeHash, searchOrderId]);

    res.status(200).json({
        status: true,
        orders: rows,
        pagination: null,
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Error fetching order" });
  }
}
