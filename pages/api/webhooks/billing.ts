import { IncomingMessage } from "http";
import type { NextApiRequest, NextApiResponse } from "next";
import { mysqlQuery } from "@lib/dbs/mysql";

// Disable body parsing (required for raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Get raw request body as buffer
async function getRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const rawBody = (await getRawBody(req)).toString("utf-8");
    const webhook = JSON.parse(rawBody);

    const storeHash = webhook.store_hash;

    if (!storeHash) return res.status(400).send("Missing store_hash");

    switch (webhook.scope) {
      case "store/app/subscription/created":
      case "store/app/subscription/updated":
        await mysqlQuery(
          `INSERT INTO subscriptions (storeHash, isActive, updatedAt)
           VALUES (?, ?, NOW())
           ON DUPLICATE KEY UPDATE isActive = ?, updatedAt = NOW()`,
          [storeHash, true, true]
        );
        break;

      case "store/app/subscription/deleted":
        await mysqlQuery(
          `UPDATE subscriptions SET isActive = ?, updatedAt = NOW() WHERE storeHash = ?`,
          [false, storeHash]
        );
        break;
    }

    return res.status(200).send("Webhook received");
  } catch (err) {
    console.error("Billing webhook error", err);
    return res.status(500).send("Internal server error");
  }
}
