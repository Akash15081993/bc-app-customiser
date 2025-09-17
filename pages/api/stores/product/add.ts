import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(12, 60 * 1000); // 12 requests per minute per IP

export default async function list(req: NextApiRequest, res: NextApiResponse) {
    try {

        // Only allow POST
        if (req.method !== 'POST') {
            return res.status(405).json({ status: false, message: 'Method not allowed' });
        }

        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
        if (!checkRate(ip)) {
            return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
        }

        try {

            const { storeHash, userId, productId, productSku, productName, productImage, apiToken } = req.body;

            if(storeHash == "") return res.status(401).json({ status: false, message: 'Unauthorized' });

            const apiTokenPrefix = languageEN?.appApiToken+"-product-add";
            if(apiTokenPrefix != apiToken){ return res.status(401).json({ status: false, message: 'Unauthorized Token' }); }

            //save data
            const result = await mysqlQuery("INSERT INTO products (storeHash, userId, productId, productSku, productName, productImage) VALUES (?, ?, ?, ?, ?, ?)", [storeHash, userId, productId, productSku, productName, productImage]);

            const newId = result.insertId;

            res.status(200).json({ status: true, data : { id: newId, productSku, productName, }, message: "Product added successfully." });

        } catch (error) {
            console.error('DB Error:', error);
            res.status(500).json({ status: false, message: 'Internal server error' });
        }

    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ status: false, message });
    }
}