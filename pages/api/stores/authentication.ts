import { NextApiRequest, NextApiResponse } from "next";
import { runCors } from "@lib/cors";
import { mysqlQuery } from "@lib/dbs/mysql";

export default async function list(req: NextApiRequest, res: NextApiResponse) {
  //Apply CORS
  if (runCors(req, res)) return;

  try {
    if (req.method === "GET")
      return res
        .status(405)
        .json({ status: false, message: "Method not allowed" });

    const bodyData = req.body as any;
    const storeHash = bodyData?.storeHash;

    if (!storeHash) {
      return res.status(400).json({ status: false, message: 'storeHash is required' });
    }

    //Subscription validation
      const subscription = await mysqlQuery(
        "SELECT id FROM `loginMaster` WHERE `subscription` = 1 AND `storeHash` = ?",
        [storeHash]
      );
      if (subscription?.length === 0) {
        return res.status(400).json({
          status: false,
          message:
            "Your subscription is not valid. Please contact to administrator.",
        });
      }

      //Get appSettings
      const appSettings = await mysqlQuery(
        "SELECT enableShare, designerButtonName, designerButton, cssCode FROM `appSettings` WHERE `storeHash` = ?",
        [storeHash]
      );
      if (appSettings?.length === 0) {
        return res
          .status(400)
          .json({ status: false, message: "Default settings." });
      }

      return res.status(200).json({
        status: true,
        message: "Success.",
        appSettings: appSettings[0],
      });
    
    
  } catch (error: any) {
    return res
      .status(500)
      .json({ status: false, message: error?.message || error });
  }
}
