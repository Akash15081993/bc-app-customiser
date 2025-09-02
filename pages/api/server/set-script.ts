import type { NextApiRequest, NextApiResponse } from "next";
import { bigcommerceClient, getSession } from "@lib/auth";
import { getScriptPayload } from "lang/scriptPayload";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    
    const { accessToken, storeHash, user } = await getSession(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const bigcommerce = bigcommerceClient(accessToken, storeHash);

    // -------------------------
    // Ensure Frontend Script
    // -------------------------
    const { data: existingScripts } = await bigcommerce.get(`/content/scripts`);
    const exists = existingScripts.some((s: any) => s.name === "KR Customizer");

    if(!exists) {
        //const scriptPayload = getScriptPayload(process.env.customizer_app_domain);
        const scriptPayload = {
          "name": "KR Customizer",
          "description": "KR Customizer customizer app Script",
          "html": "\n<script>\nwindow.krcustomizer_config = {\n  \"store_hash\": \"{{settings.store_hash}}\",\n  \"channel_id\": \"{{settings.channel_id}}\",\n  \"currencyCode\": \"{{settings.money.currency_token}}\",\n  \"page_type\": \"{{page_type}}\",\n  \"storefront_api\": \"{{settings.storefront_api.token}}\",\n  \"customer_id\": \"{{#if customer}}{{customer.id}}{{else}}0{{/if}}\",\n  \"customer_email\": \"{{#if customer}}{{customer.email}}{{else}}0{{/if}}\",\n  \"product_id\": \"{{product.id}}\",\n  \"product_sku\": \"{{product.sku}}\"\n};\n</script>\n<script src=\"https://your-app.com/scripts/bigcommerce/product.js\" defer></script>\n",
          "auto_uninstall": true,
          "load_method": "default",
          "location": "footer",
          "visibility": "all_pages",
          "kind": "script_tag",
          "consent_category": "essential",
          "enabled": true
        };
        await bigcommerce.post(`/content/scripts`, scriptPayload);
    }

    // -------------------------
    // Ensure Order Webhook
    // -------------------------
    const { data: hooks } = await bigcommerce.get("/hooks");
    const existingHook = hooks.find((h: any) => h.scope === "store/cart/converted");
    if (!existingHook) {
      await bigcommerce.post("/hooks", {
        scope: "store/cart/converted",
        destination: `${process.env.customizer_app_domain}api/server/webhooks/order-created`,
        is_active: true,
      });
    } else if (!existingHook.is_active) {
      // Reactivate if disabled
      await bigcommerce.put(`/hooks/${existingHook.id}`, {
        is_active: true,
      });
    }

    return res.status(200).json({ success: true, reinstalled: !exists ? true : false });

  } catch (err: any) {
    console.error("set-script error", err?.response?.data || err);
    return res.status(500).json({ error: "Failed to set script" });
  }
}
