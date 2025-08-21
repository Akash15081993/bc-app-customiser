import { NextApiRequest, NextApiResponse } from "next";
import { mysqlQuery } from "@lib/dbs/mysql";
import { runCors } from "@lib/cors";

function base64UrlDecode(str: string) {
  return JSON.parse(
    Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
  );
}

export default async function list(req: NextApiRequest, res: NextApiResponse) {

  //Apply CORS
  if (runCors(req, res)) return;

  try {
    if (req.method === "GET")
      return res
        .status(405)
        .json({ status: false, message: "Method not allowed" });

    const bodyData = req.body as any;
    const bc_storefront_token = bodyData?.bc_storefront_token;
    const kr_store_hash = bodyData?.kr_store_hash;

    if (!bc_storefront_token) {
      return res.status(400).json({ status: false, message: "Missing token" });
    }

    const tokenSplit = bc_storefront_token?.split(".");
    if (!tokenSplit || tokenSplit.length < 2) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized: Invalid token format" });
    }

    //payload verfy
    const payloadB64 = tokenSplit[1];
    const tokenPayload = base64UrlDecode(payloadB64);

    if (tokenPayload?.iss === "BC") {
      //Subscription validation
      const subscription = await mysqlQuery(
        "SELECT id FROM `loginMaster` WHERE `subscription` = 1 AND `storeHash` = ?",
        [kr_store_hash]
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
        "SELECT enableShare, designerButton, cssCode FROM `appSettings` WHERE `storeHash` = ?",
        [kr_store_hash]
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
    } else {
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Invalid user",
      });
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ status: false, message: error?.message || error });
  }
}
