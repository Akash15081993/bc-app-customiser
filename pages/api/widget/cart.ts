import { NextApiRequest, NextApiResponse } from "next";
import { bigcommerceClient } from "@lib/auth";
import { runCors } from "@lib/cors";
import { mysqlQuery } from "@lib/dbs/mysql";
import languageEN from "lang/en";

function base64UrlDecode(str: string) {
  return JSON.parse(
    Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
  );
}

export default async function list(req: NextApiRequest, res: NextApiResponse) {
  
  //if(runCors(req, res)) return; // handle preflight

  try {
    if (req.method === "GET") return res .status(405).json({ status: false, message: "Method not allowed" });

    try {
      const bodyData = req.body as any;
      const kr_store_hash = bodyData?.kr_store_hash;
      const kr_product_id = parseInt(bodyData?.kr_product_id) || 0;
      const kr_product_variant = parseInt(bodyData?.kr_product_variant) || 0;
      const kr_product_price = bodyData?.kr_product_price;
      const quantity = parseInt(bodyData?.kr_store_form_data["qty[]"]) || 1;
      const bcCartId = bodyData?.cartId;
      const bc_storefront_token = bodyData?.bc_storefront_token;

      const { modifierDisplayNames } = languageEN;

      const kr_store_form_data = bodyData?.kr_store_form_data;
      const kr_design_data = bodyData?.krDesignData;

      if (!bc_storefront_token) {
        return res.status(400).json({ status: false, error: "Missing token" });
      }

      const tokenSplit = bc_storefront_token?.split(".");
      if (!tokenSplit || tokenSplit.length < 2) {
        return res
          .status(401)
          .json({ status: false, error: "Unauthorized: Invalid token format" });
      }

      //payload verfy
      const payloadB64 = tokenSplit[1];
      const tokenPayload = base64UrlDecode(payloadB64);

      if (tokenPayload?.iss === "BC") {
        //Return if product ID not found
        if (kr_product_id === 0) {
          return res
            .status(200)
            .json({ status: false, message: "Product not exits." });
        }

        //Return if design data not found
        if (!kr_design_data) {
          return res
            .status(200)
            .json({
              status: false,
              message:
                "Your design is not ready please reload browser and try again.",
            });
        }

        const storeData = await mysqlQuery(
          "SELECT  `accessToken` FROM `stores` WHERE `storeHash` = ?",
          [kr_store_hash]
        );
        const authData = storeData[0]?.accessToken;

        //Return if user is not valid
        if (!authData) {
          return res
            .status(200)
            .json({ status: false, message: "Unauthorized error." });
        }

        //Connect with bc
        const bigcommerce = bigcommerceClient(authData, kr_store_hash);

        //Get product
        const productResult = await bigcommerce.get(
          `/catalog/products/${kr_product_id}?include_fields=name`
        );
        const productTitle = productResult?.data?.name;

        //Get product modifiers
        const fetchFilteredModifierIds = async (
          productId: number,
          limit = 50
        ) => {
          let page = 1;
          const matchingModifierIds: number[] = [];
          const targetDisplayNames = [
            modifierDisplayNames.designId,
            modifierDisplayNames.viewDesign,
            modifierDisplayNames.designArea,
          ];

          let hasMorePages = true;
          while (hasMorePages) {
            const response = await bigcommerce.get(
              `/catalog/products/${productId}/modifiers?limit=${limit}&page=${page}`
            );
            const { data, meta } = response;

            // Filter and collect matching IDs
            const matching = data
              .filter((modifier: any) =>
                targetDisplayNames.includes(modifier.display_name)
              )
              .map((modifier: any) => ({
                id: modifier.id,
                name: modifier.display_name,
              }));

            matchingModifierIds.push(...matching);

            const { current_page, total_pages } = meta.pagination;
            hasMorePages = current_page < total_pages;

            if (current_page >= total_pages) break;
            page++;
          }

          return matchingModifierIds;
        };

        //Get modifiers Ids
        const modifierIds = await fetchFilteredModifierIds(kr_product_id, 50);

        //Final product price
        const finallyCartPrice = kr_product_price;

        //krDesign Data
        const designId = kr_design_data?.krDesignId;
        const desginImage =
          kr_design_data?.krImageURL?.length > 0
            ? kr_design_data?.krImageURL[0]
            : 0;
        const designArea = JSON.stringify(kr_design_data?.krDesignArea);

        // Build option selections
        const optionSelections: { option_id: number; option_value: any }[] = [];
        modifierIds.forEach((mod: any) => {
          if (mod.name === modifierDisplayNames.designId) {
            optionSelections.push({
              option_id: mod.id,
              option_value: designId,
            });
          }
          if (mod.name === modifierDisplayNames.viewDesign) {
            optionSelections.push({
              option_id: mod.id,
              option_value: desginImage,
            });
          }
          if (mod.name === modifierDisplayNames.designArea) {
            optionSelections.push({
              option_id: mod.id,
              option_value: designArea,
            });
          }
        });

        //if product is no variant
        if (kr_product_variant == 0) {
          const cartPayload = {
            line_items: [
              {
                quantity: quantity,
                product_id: kr_product_id,
                name: productTitle,
                list_price: finallyCartPrice,
                option_selections: optionSelections,
              },
            ],
          };

          if (bcCartId === null) {
            const cartResult = await bigcommerce.post(
              `/carts?include=redirect_urls`,
              cartPayload
            );
            return res
              .status(200)
              .json({ status: true, message: "Success.", data: cartResult });
          } else {
            const cartResult = await bigcommerce.post(
              `/carts/${bcCartId}/items?include=redirect_urls`,
              cartPayload
            );
            return res
              .status(200)
              .json({ status: true, message: "Success.", data: cartResult });
          }
        }

        //if product has variant
        if (kr_product_variant > 0) {
          // Build optionSelections
          const bcOptionSelections = Object.entries(kr_store_form_data)
            .filter(([key, value]) => {
              // skip unwanted keys
              return key !== "product_id" && key !== "qty[]" && value !== "";
            })
            .map(([key, value]) => ({
              option_id: parseInt(key, 10),
              option_value: value,
            }));

          // Merge both
          const finalOptionSelections = [
            ...optionSelections,
            ...bcOptionSelections,
          ];

          const cartPayload = {
            line_items: [
              {
                quantity: quantity,
                product_id: kr_product_id,
                name: productTitle,
                list_price: finallyCartPrice,
                option_selections: finalOptionSelections,
              },
            ],
          };

          if (bcCartId === null) {
            const cartResult = await bigcommerce.post(
              `/carts?include=redirect_urls`,
              cartPayload
            );
            return res
              .status(200)
              .json({ status: true, message: "Success.", data: cartResult });
          } else {
            const cartResult = await bigcommerce.post(
              `/carts/${bcCartId}/items?include=redirect_urls`,
              cartPayload
            );
            return res
              .status(200)
              .json({ status: true, message: "Success.", data: cartResult });
          }
        }
      } else {
        return res.status(401).json({
          status: false,
          message: "Unauthorized: Invalid user",
        });
      }
    } catch (error) {
      res.status(500).json({ status: false, message: error });
    }
  } catch (error) {
    const { message, response } = error;
    res.status(response?.status || 500).json({ status: false, message });
  }
}
