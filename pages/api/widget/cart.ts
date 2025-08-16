import { NextApiRequest, NextApiResponse } from "next";
import { bigcommerceClient } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";
import languageEN from "lang/en";

export default async function list(req: NextApiRequest, res: NextApiResponse) {
  try {
    //if (req.method === "GET") return res.status(405).json({ status: false, message: "Method not allowed" });

    try {

      const bodyData = {
        "kr_product_variant": 0,
        "kr_product_price": 25.50,
        "kr_product_id": "111",
        "kr_store_form_data": {
            "product_id": "111",
            "qty[]": "1"
        },
        "kr_store_hash": "vl5e5n6g4x",
        "krDesignData": {
            "krDesignId": 74,
            "krImageURL": [
                "https://res.cloudinary.com/dt2lhechn/image/upload/v1755352615/reivik0ih3nxsg67uxiq.png",
                "https://res.cloudinary.com/dt2lhechn/image/upload/v1755352617/yba89ceo7ilimrhp7gxy.png",
                "https://res.cloudinary.com/dt2lhechn/image/upload/v1755352618/ynkne7ujwatlklgjniuh.png",
                "https://res.cloudinary.com/dt2lhechn/image/upload/v1755352620/fajbibqfzvzj2wrw5l0b.png"
            ],
            "krDesignArea": {
                "parts": {
                    "Front": {
                        "color": "#ffffff"
                    }
                },
                "baseColors": {
                    "Back": "#cacaca",
                    "Collar": "#ffffff",
                    "Front": "#ffffff",
                    "LeftSleeve": "#cacaca",
                    "Object_10": "#ffffff",
                    "Object_11": "#cacaca",
                    "Object_2": "#cacaca",
                    "Object_3": "#383b3b",
                    "Object_4": "#424b4b",
                    "Object_5": "#cacaca",
                    "Object_6": "#cacaca",
                    "Object_8": "#cacaca",
                    "Object_8001": "#cacaca",
                    "Object_9": "#ffffff",
                    "RightSleeve": "#cacaca"
                }
            },
            "customizationData": {
                "parts": {
                    "Front": {
                        "color": "#ffffff"
                    }
                },
                "baseColors": {
                    "Back": "#cacaca",
                    "Collar": "#ffffff",
                    "Front": "#ffffff",
                    "LeftSleeve": "#cacaca",
                    "Object_10": "#ffffff",
                    "Object_11": "#cacaca",
                    "Object_2": "#cacaca",
                    "Object_3": "#383b3b",
                    "Object_4": "#424b4b",
                    "Object_5": "#cacaca",
                    "Object_6": "#cacaca",
                    "Object_8": "#cacaca",
                    "Object_8001": "#cacaca",
                    "Object_9": "#ffffff",
                    "RightSleeve": "#cacaca"
                }
            },
            "screenshots": [
                {
                    "angle": "front",
                    "url": "https://res.cloudinary.com/dt2lhechn/image/upload/v1755352615/reivik0ih3nxsg67uxiq.png"
                },
                {
                    "angle": "back",
                    "url": "https://res.cloudinary.com/dt2lhechn/image/upload/v1755352617/yba89ceo7ilimrhp7gxy.png"
                },
                {
                    "angle": "left",
                    "url": "https://res.cloudinary.com/dt2lhechn/image/upload/v1755352618/ynkne7ujwatlklgjniuh.png"
                },
                {
                    "angle": "right",
                    "url": "https://res.cloudinary.com/dt2lhechn/image/upload/v1755352620/fajbibqfzvzj2wrw5l0b.png"
                }
            ]
        },
        "cartId": null
    } as any;

      const kr_store_hash = bodyData?.kr_store_hash;
      const kr_product_id = parseInt(bodyData?.kr_product_id) || 0;
      const kr_product_variant = parseInt(bodyData?.kr_product_variant) || 0;
      const kr_product_price = bodyData?.kr_product_price;
      const quantity = parseInt(bodyData?.kr_store_form_data['qty[]']) || 1;

      const { modifierDisplayNames } = languageEN;

      const kr_design_data = bodyData?.krDesignData;

      //Return if product ID not found
      if(kr_product_id === 0){
        return res.status(200).json({ status: false, message: "Product not exits." });
      }

      //Return if design data not found
      if(!kr_design_data){
        return res.status(200).json({ status: false, message: "Your design is not ready please reload browser and try again." });
      }

      const storeData = await mysqlQuery("SELECT  `accessToken` FROM `stores` WHERE `storeHash` = ?", [kr_store_hash] );
      const authData =  storeData[0]?.accessToken;

      //Return if user is not valid
      if(!authData){
        return res.status(200).json({ status: false, message: "Unauthorized error." });
      }

      //Connect with bc
      const bigcommerce = bigcommerceClient(authData, kr_store_hash);

      //Get product
      const productResult = await bigcommerce.get(`/catalog/products/${kr_product_id}?include_fields=name`);
      const productTitle = productResult?.data?.name;
      

      //Get product modifiers
      const fetchFilteredModifierIds = async (productId: number, limit = 50) => {
          let page = 1;
          const matchingModifierIds: number[] = [];
          const targetDisplayNames = [ modifierDisplayNames.designId, modifierDisplayNames.viewDesign, modifierDisplayNames.designArea ];

          let hasMorePages = true;
          while (hasMorePages) {
              const response = await bigcommerce.get(`/catalog/products/${productId}/modifiers?limit=${limit}&page=${page}`);
              const { data, meta } = response;

              // Filter and collect matching IDs
              const matching = data.filter((modifier: any) =>targetDisplayNames.includes(modifier.display_name)).map((modifier: any) => ({id: modifier.id, name: modifier.display_name}));

              matchingModifierIds.push(...matching);

              const { current_page, total_pages } = meta.pagination;
              hasMorePages = current_page < total_pages;

              if (current_page >= total_pages) break;
              page++;
          }

          return matchingModifierIds;
      }

      //Get modifiers Ids
      const modifierIds = await fetchFilteredModifierIds(kr_product_id, 50);


      //Final product price 
      const finallyCartPrice = kr_product_price;

      //krDesign Data 
      const designId = kr_design_data?.krDesignId;
      const desginImage = kr_design_data?.krImageURL?.length > 0 ? kr_design_data?.krImageURL[0] : 0;
      const designArea = JSON.stringify(kr_design_data?.krDesignArea);

      // Build option selections
      const optionSelections: { option_id: number; option_value: any }[] = [];
      modifierIds.forEach((mod:any) => {
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
      
      //return res.status(200).json({ status: true, message: optionSelections });
      
      //if product is no variant
      if(kr_product_variant == 0){
        const cartPayload = {
          "line_items": [
            {
              "quantity": quantity,
              "product_id": kr_product_id,
              "name": productTitle,
              "list_price": finallyCartPrice,
              "option_selections": optionSelections
            }
          ]
        }
        const cartResult = await bigcommerce.post(`/carts?include=redirect_urls`, cartPayload);
        return res.status(200).json({ status: true, message: cartResult });
      }


    } catch (error) {
      console.log('error 1')
      console.log(error)
      res.status(500).json({ status: false, message: error });
    }
  } catch (error) {
    console.log('error 2')
      console.log(error)
    const { message, response } = error;
    res.status(response?.status || 500).json({ status: false, message });
  }
}
