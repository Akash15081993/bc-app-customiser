import { NextApiRequest, NextApiResponse } from 'next';
import { getBCVerify, removeDataStore } from '../../lib/auth';

export default async function uninstall(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.warn('req.query uninstall.ts')
        console.warn(req.query)
        const session = await getBCVerify(req.query);
        await removeDataStore(session);
        res.status(200).end();
    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }
}
