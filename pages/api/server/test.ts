import { NextApiRequest, NextApiResponse } from "next";
//import { bigcommerceClient } from "@lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        
        // const bigcommerce = bigcommerceClient("1212", "1212", 'v2');
        // const myData = await bigcommerce.get(`/orders/100`);
        // return res.status(200).json({ status: true, data: myData });

        // const bigcommerce = bigcommerceClient("121212", "vl5e5n6g4x", "v2");
        // const storeInformation = await bigcommerce.get(`/store`);

        return res.status(200).json({ status: true, myOrder: 'storeInformation' });

    } catch (error) {
        
        return res.status(500).json({ status: false, data: error });

    }
}
