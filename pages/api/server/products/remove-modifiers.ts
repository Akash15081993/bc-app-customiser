import { NextApiRequest, NextApiResponse } from 'next';
import { bigcommerceClient, getSession } from '@lib/auth';
import { mysqlQuery } from '@lib/dbs/mysql';
import languageEN from 'lang/en';

export default async function list(req: NextApiRequest, res: NextApiResponse) {
    try {
        
        if (req.method === 'GET') return res.status(405).json({ status: false, error: 'Method not allowed' });

        if(req.method == "POST"){

            const { id, productId } = req.body;
            const { accessToken, storeHash, user } = await getSession(req);
            const bigcommerce = bigcommerceClient(accessToken, storeHash);

            if (!user) return res.status(401).json({ error: 'Unauthorized' });
            
            if (!productId || isNaN(Number(productId)) || Number(productId) <= 0) {
                return res.status(400).json({ status : false, message: "Invalid product ID." });
            }

            const { modifierDisplayNames } = languageEN;

            const fetchFilteredModifierIds = async (productId: number, limit = 50) => {
                let page = 1;
                const matchingModifierIds: number[] = [];
                const targetDisplayNames = [ modifierDisplayNames.designId, modifierDisplayNames.viewDesign, modifierDisplayNames.designArea ];

                let hasMorePages = true;
                while (hasMorePages) {
                    const response = await bigcommerce.get(`/catalog/products/${productId}/modifiers?limit=${limit}&page=${page}`);
                    const { data, meta } = response;

                    // Filter and collect matching IDs
                    const matching = data
                    .filter((modifier: any) => targetDisplayNames.includes(modifier.display_name))
                    .map((modifier: any) => modifier.id);

                    matchingModifierIds.push(...matching);

                    const { current_page, total_pages } = meta.pagination;
                    hasMorePages = current_page < total_pages;

                    if (current_page >= total_pages) break;
                    page++;
                }

                return matchingModifierIds;
            }


            //Get modifiers Ids
            const modifierIds = await fetchFilteredModifierIds(productId, 50);
            
            //Delete modifiers
            if(modifierIds.length > 0) {
                await Promise.all( modifierIds.map(id => bigcommerce.delete(`/catalog/products/${productId}/modifiers/${id}`) ) );
            }

            //First Delete Product
            await mysqlQuery('DELETE FROM products WHERE storeHash = ? AND id = ?',[storeHash, id]);

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