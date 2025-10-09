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
      const { modifierDisplayNames, modifierOptions } = languageEN;
      const {
        productId,
        productSku,
        productName,
        defaultImage,
        designerChecked,
      } = req.body;
      const { accessToken, storeHash, user } = await getSession(req);
      const bigcommerce = bigcommerceClient(accessToken, storeHash);
      const jwtPlayload = req.query.context;

      if (!user) return res.status(401).json({ error: "Unauthorized" });

      if (
        !productId ||
        isNaN(Number(productId)) ||
        (Number(productId) <= 0 && designerChecked == true && jwtPlayload == "")
      ) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid product ID." });
      }

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

      //First Delete Product
      //await mysqlQuery("UPDATE products SET currentStatus = 0 WHERE storeHash = ? AND productId = ?", [storeHash, productId]);
      //await mysqlQuery("DELETE FROM products WHERE storeHash = ? AND productId = ?",[storeHash, productId]);

      //Save product
      const productBody = {
        storeHash,
        userId: user.id,
        productId,
        productSku,
        productName,
        productImage: defaultImage,
      };
      await mysqlQuery("REPLACE INTO products SET ?", productBody);

      return res.status(200).json({
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
