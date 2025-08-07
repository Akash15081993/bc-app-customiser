import { NextApiRequest, NextApiResponse } from "next";
import { bigcommerceClient, getSession } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";
import languageEN from "lang/en";

export default async function list(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET")
      return res
        .status(405)
        .json({ status: false, error: "Method not allowed" });

    if (req.method == "POST") {
      const { id, productId } = req.body;
      const { accessToken, storeHash, user } = await getSession(req);
      const bigcommerce = bigcommerceClient(accessToken, storeHash);

      if (!user)
        return res.status(401).json({ status: false, message: "Unauthorized" });

      if (!productId || isNaN(Number(productId)) || Number(productId) <= 0) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid product ID." });
      }

      const { modifierDisplayNames, modifierOptions } = languageEN;
      const product = await bigcommerce.get(
        `/catalog/products/${productId}?include=images`
      );

      if (!product?.data)
        return res
          .status(404)
          .json({ status: false, message: "Product not found." });

      const renderImage = (images) => {
        const thumbnail = images.find(
          (img) => img?.is_thumbnail
        )?.url_thumbnail;

        return thumbnail || null;
      };

      const productData = product?.data;
      const productName = productData?.name;
      const productSku = productData?.sku;
      const productImage = renderImage(productData?.images);

      //Update Product
      await mysqlQuery(
        "UPDATE products SET productName = ?, productSku = ?, productImage = ? WHERE storeHash = ? AND id = ? AND productId = ?",
        [productName, productSku, productImage, storeHash, id, productId]
      );

      const tryCreateModifier = async (body: any) => {
        try {
          await bigcommerce.post(
            `/catalog/products/${productId}/modifiers`,
            body
          );
        } catch (err) {
          if (err?.response?.status === 422) {
            console.warn(
              `Modifier '${body.display_name}' already exists. Skipping.`
            );
          } else {
            console.error(
              `Error adding modifier '${body.display_name}':`,
              err.message
            );
          }
        }
      };

      // Dynamically generate all modifier configs based on displayNames
      const displayNamesWithSort = [
        { name: modifierDisplayNames.designId, order: 1 },
        { name: modifierDisplayNames.viewDesign, order: 2 },
        {
          name: modifierDisplayNames.designArea,
          order: 3,
          type: "multi_line_text",
        },
      ];

      await Promise.allSettled(
        displayNamesWithSort.map(({ name, order, type }) => {
          const optionBody = {
            ...modifierOptions,
            display_name: name,
            sort_order: order,
            type: type || modifierOptions.type,
          };

          return tryCreateModifier(optionBody);
        })
      );

      res.status(200).json({
        status: true,
        message: "Success.",
      });
    } else {
      return res
        .status(405)
        .json({ status: false, message: "Method not allowed." });
    }
  } catch (error) {
    const { message, response } = error;
    res.status(response?.status || 500).json({ status: false, message });
  }
}
