import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { bigcommerceClient, getSession } from '@lib/auth';

export default async function list(req: NextApiRequest, res: NextApiResponse) {
    try {

        if (req.method === 'GET') return res.status(405).json({ status: false, error: 'Method not allowed' });

        if(req.method == "POST"){

            const { productId, productSku, productName, defaultImage, designerChecked } = req.body;
            const { accessToken, storeHash, user } = await getSession(req);
            const bigcommerce = bigcommerceClient(accessToken, storeHash);
            const jwtPlayload = req?.query?.context;

            if (!user) return res.status(401).json({ error: 'Unauthorized' });
            
            if (!productId || isNaN(Number(productId)) || Number(productId) <= 0 && designerChecked == true && jwtPlayload == "") {
                return res.status(400).json({ status : false, message: "Invalid product ID." });
            }
    
            const optionYourDesignIdBody =  {
                "display_name": "Design Id",
                "type": "text",
                "required": false,
                "sort_order": 1,
                "config": {
                    "default_value": "",
                    "text_characters_limited": false,
                    "text_min_length": 0,
                    "text_max_length": 0
                },
                "option_values": []
            };
            const optionYourDesignBody =  {
                "display_name": "View Design",
                "type": "text",
                "required": false,
                "sort_order": 2,
                "config": {
                    "default_value": "",
                    "text_characters_limited": false,
                    "text_min_length": 0,
                    "text_max_length": 0
                },
                "option_values": []
            };
            const optionYourDesignAreaBody =  {
                "display_name": "Design Area",
                "type": "multi_line_text",
                "required": false,
                "sort_order": 3,
                "config": {
                    "default_value": "",
                    "text_characters_limited": false,
                    "text_min_length": 0,
                    "text_max_length": 0
                },
                "option_values": []
            };
            
            // await Promise.all([
            //     bigcommerce.post(`/catalog/products/${productId}/modifiers`, optionYourDesignIdBody),
            //     bigcommerce.post(`/catalog/products/${productId}/modifiers`, optionYourDesignBody),
            //     bigcommerce.post(`/catalog/products/${productId}/modifiers`, optionYourDesignAreaBody),
            // ]);

            const tryCreateModifier = async (body: any) => {
                try {
                    await bigcommerce.post(`/catalog/products/${productId}/modifiers`, body);
                } catch (err) {
                    if (err?.response?.status === 422) {
                        console.warn(`Modifier '${body.display_name}' already exists. Skipping.`);
                    } else {
                        console.error(`Error adding modifier '${body.display_name}':`, err.message);
                    }
                }
            };

            await tryCreateModifier(optionYourDesignIdBody);
            await tryCreateModifier(optionYourDesignBody);
            await tryCreateModifier(optionYourDesignAreaBody);

            //First Delete Product
            await mysqlQuery('DELETE FROM products WHERE storeHash = ? AND productId = ?',[storeHash, productId]);

            //Save product
            const productBody = { storeHash, userId : user?.id, productId, productSku, productName, productImage: defaultImage};
            await mysqlQuery('REPLACE INTO products SET ?', productBody);
            
            res.status(200).json({
                status : true,
                message:"Success."
            });

        }else{
            return res.status(405).json({ status : false, message: "Method not allowed." });
        }

    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ status : false, message });
    }
}