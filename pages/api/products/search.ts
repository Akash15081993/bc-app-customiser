import { NextApiRequest, NextApiResponse } from 'next';
import { bigcommerceClient, getSession } from '../../../lib/auth';

export default async function list(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { keyword, page = 1, limit = 10 } = req.body;
        const { accessToken, storeHash } = await getSession(req);
        const bigcommerce = bigcommerceClient(accessToken, storeHash);
         const response = await bigcommerce.get(`/catalog/products?keyword=${encodeURIComponent(keyword)}&limit=${limit}&page=${page}&include_fields=id,name,sku&include=modifiers,images`);
        res.status(200).json(response);
    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }
}