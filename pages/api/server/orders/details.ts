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

      const { orderId } = req.body;

      const [items]: any = await Promise.all([mysqlQuery("SELECT `productId`,`productName`,`productSku`,`designId`,`designArea`,`previewUrl`, `productJson` FROM `bcOrderProducts` WHERE `storeHash` = ? AND `orderId` = ? GROUP BY orderId",[storeHash, orderId])]);

      res.status(200).json({
        status: true,
        orders: items,
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
