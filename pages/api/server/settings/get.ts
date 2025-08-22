import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";

export default async function list(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET")
      return res
        .status(405)
        .json({ status: false, message: "Method not allowed" });

    try {
      const { storeHash, user } = await getSession(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      //GET Settings
      const appSettings = await mysqlQuery(
        "SELECT  `enableShare`, `designerButtonName`, `designerButton`, `cssCode` FROM `appSettings` WHERE `storeHash` = ?",
        [storeHash]
      );
      const settings = appSettings[0] || null;
      res
        .status(200)
        .json({ status: true, message: "Success.", data: settings });
    } catch (error) {
      console.error("DB Error:", error);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  } catch (error) {
    const { message, response } = error;
    res.status(response?.status || 500).json({ status: false, message });
  }
}
