import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@lib/auth';
import { mysqlQuery } from '@lib/dbs/mysql';

export default async function list(req: NextApiRequest, res: NextApiResponse) {
    try {
        
        if (req.method === 'GET') return res.status(405).json({ status: false, message: 'Method not allowed' });

        try {
            const { productId, productSku, productName } = req.body;
            const { storeHash, user} = await getSession(req);

            if (!user) return res.status(401).json({ status: false, message: 'Unauthorized' });

            const productBody = { storeHash, userId : user.id, productId, productSku, productName };
            
            //First Delete Product
            await mysqlQuery('DELETE FROM products WHERE storeHash = ? AND productId = ?',[storeHash, productId]);

            //Save product
            await mysqlQuery('REPLACE INTO products SET ?', productBody);

            res.status(200).json({ status: true, message: "Success." });

        } catch (error) {
            console.error('DB Error:', error);
            res.status(500).json({ status: false, message: 'Internal server error' });
        }

    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ status: false, message });
    }
}