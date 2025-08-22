import type { NextApiRequest, NextApiResponse } from "next";
import { bigcommerceClient, getSession } from "@lib/auth";
import { getScriptPayload } from "lang/scriptPayload";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    
    const { accessToken, storeHash, user } = await getSession(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const bigcommerce = bigcommerceClient(accessToken, storeHash);

    // check if script exists
    const { data: existingScripts } = await bigcommerce.get(`/content/scripts`);
    const exists = existingScripts.some((s: any) => s.name === "KR Customizer");

    if(!exists) {
        const scriptPayload = getScriptPayload(process.env.customizer_app_domain);
        await bigcommerce.post(`/content/scripts`, scriptPayload);
    }
    return res.status(200).json({ success: true, reinstalled: !exists ? true : false });
  } catch (err: any) {
    console.error("set-script error", err?.response?.data || err);
    return res.status(500).json({ error: "Failed to set script" });
  }
}
