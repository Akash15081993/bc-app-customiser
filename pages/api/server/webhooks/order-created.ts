import { NextApiRequest, NextApiResponse } from "next";
import { bigcommerceClient } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = req.body; // { data: { id: orderId }, scope: "store/order/created", store_id: "xxxx" }
    const orderId = payload?.data?.id;
    const storeHash = payload?.store_id;

    if (!orderId || !storeHash) {
      return res.status(400).send("Missing orderId or storeHash");
    }

    // lookup access token for store
    const store = await mysqlQuery("SELECT access_token FROM stores WHERE store_hash=?", [storeHash]);
    if (!store?.[0]) return res.status(401).send("Store not found");

    const bigcommerce = bigcommerceClient(store[0].access_token, storeHash);

    // fetch order details
    const { data: order } = await bigcommerce.get(`/v2/orders/${orderId}?include=line_items`);

    // save order
    const result = await mysqlQuery(
      "INSERT INTO bc_orders (store_hash, order_id, customer_id, order_json) VALUES (?,?,?,?)",
      [storeHash, order.id, order.customer_id, JSON.stringify(order)]
    );

    const newOrderId = result.insertId;

    // save line items
    for (const item of order.products || []) {
      let designId = null;
      let designArea = null;
      let previewUrl = null;

      if (item.product_options?.length) {
        for (const opt of item.product_options) {
          if (opt.display_name === "Design Id") designId = opt.display_value;
          if (opt.display_name === "Design Area") designArea = opt.display_value;
          if (opt.display_name === "Preview Url") previewUrl = opt.display_value;
        }
      }

      await mysqlQuery(
        "INSERT INTO bc_order_items (order_id, product_id, product_name, sku, design_id, design_area, preview_url, line_item_json) VALUES (?,?,?,?,?,?,?,?)",
        [
          newOrderId,
          item.product_id,
          item.name,
          item.sku,
          designId,
          designArea,
          previewUrl,
          JSON.stringify(item),
        ]
      );
    }

    return res.status(200).send("ok");
    
  } catch (err) {
    console.error("Webhook error", err);
    return res.status(500).send("error");
  }
}
