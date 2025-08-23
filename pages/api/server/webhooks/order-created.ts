import { NextApiRequest, NextApiResponse } from "next";
import { bigcommerceClient } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";

// helpers
function getLineItemsFromOrder(bcOrder: any) {
  // Preferred: consignments.shipping[].line_items[]
  if (Array.isArray(bcOrder?.consignments)) {
    const out: any[] = [];
    for (const c of bcOrder.consignments) {
      for (const s of c?.shipping ?? []) {
        for (const li of s?.line_items ?? []) out.push(li);
      }
    }
    if (out.length) return out;
  }
  // Fallback if you ever fetch with ?include=products instead
  if (Array.isArray(bcOrder?.products)) return bcOrder.products;
  return [];
}

function getOptionValue(item: any, displayName: string) {
  const opt = (item?.product_options ?? []).find(
    (o: any) => o.display_name === displayName
  );
  return opt?.display_value ?? null;
}

function parseMaybeJSON(str: any) {
  if (typeof str !== "string") return str;
  const t = str.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return str;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const payload = req.body;

    const cartId = payload?.data?.id;
    const producer = payload?.producer;
    const storeHash = producer?.split("/")[1] || "";

    if (!storeHash) {
      return res.status(400).send("Missing storeHash");
    }

    // lookup access token for store
    const store = await mysqlQuery(
      "SELECT accessToken FROM stores WHERE storeHash = ?",
      [storeHash]
    );

    if (!store?.[0]) return res.status(401).send("Store not found");

    const bigcommerce = bigcommerceClient(
      store[0].accessToken,
      storeHash,
      "v2"
    );

    // fetch order details
    const allOrders = await bigcommerce.get(
      `/orders?include=consignments.line_items&cart_id=${cartId}`
    );
    const bcOrder = allOrders[allOrders.length - 1];

    //$order_result_temp = bc_callAPI("GET", 'v2/orders?include=consignments.line_items&cart_id=' . $cart_id, false);

    // save order
    const result = await mysqlQuery(
      "INSERT INTO bcOrders (storeHash, orderId, customerId, order_json) VALUES (?,?,?,?)",
      [storeHash, bcOrder.id, bcOrder.customer_id, JSON.stringify(bcOrder)]
    );

    const newOrderId = result.insertId;

    // usage inside your webhook/handler after you fetched bcOrder (v2)
    const lineItems = getLineItemsFromOrder(bcOrder);

    for (const item of lineItems) {
      const designId = getOptionValue(item, "Design Id");
      const previewUrl = getOptionValue(item, "View Design");
      const designAreaRaw = getOptionValue(item, "Design Area");
      const designArea = parseMaybeJSON(designAreaRaw);

      await mysqlQuery(
        `INSERT INTO bcOrderProducts 
        (storeHash, bcOrdersId, orderId, productId, productName, productSku, designId, designArea, previewUrl, productJson) 
        VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          storeHash,
          newOrderId,
          bcOrder.id,
          item.product_id,
          item.name,
          item.sku,
          designId,
          typeof designArea === "string"
            ? designArea
            : JSON.stringify(designArea),
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
