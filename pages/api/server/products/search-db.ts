import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";

export default async function list(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") return res.status(405).json({ status: false, message: "Method not allowed" });

    if (req.method == "POST") {

      const { searchTerm } = req.body || {};

      if (typeof searchTerm === "undefined" || searchTerm === "") {
        return res.status(400).json({ status: false, message: "Missing search query" });
      }
      const { storeHash, user } = await getSession(req);

      if (!user) return res.status(401).json({ status: false, message: "Unauthorized" });

      //search Product
      const products = await mysqlQuery("SELECT `storeHash`, `id`,`productId`,`productSku`,`productName`,`productImage` FROM products WHERE currentStatus = 0 AND storeHash = ? AND (productSku LIKE ? OR productName LIKE ?) LIMIT 50", [storeHash, `%${searchTerm}%`, `%${searchTerm}%`] );
      res.status(200).json({ status: true, products : products, message: "Success" });

    } else {
      return res
        .status(405)
        .json({ status: false, message: "Method not allowed." });
    }
  } catch (error) {
    const { message, response } = error;
    res.status(response?.status || 500).json({ status: false, message });
  }
}
