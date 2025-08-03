import { NextApiRequest, NextApiResponse } from 'next';
import { bigcommerceClient, getSession } from '../../../lib/auth';

export default async function list(req: NextApiRequest, res: NextApiResponse) {
    try {

        if(req.method == "POST"){

            const { productId, designerChecked } = req.body;
            const { accessToken, storeHash } = await getSession(req);
            const bigcommerce = bigcommerceClient(accessToken, storeHash);

            if (!productId || isNaN(Number(productId)) || Number(productId) <= 0 && designerChecked == true) {
                return res.status(400).json({ message: "Invalid product ID." });
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
            
            await Promise.all([
                bigcommerce.post(`/catalog/products/${productId}/modifiers`, optionYourDesignIdBody),
                bigcommerce.post(`/catalog/products/${productId}/modifiers`, optionYourDesignBody),
                bigcommerce.post(`/catalog/products/${productId}/modifiers`, optionYourDesignAreaBody),
            ]);
            
            res.status(200).json({message : "Success."});

        }else{
            return res.status(405).json({ message: "Method not allowed." });
        }

    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }
}