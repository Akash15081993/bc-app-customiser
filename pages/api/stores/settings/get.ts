import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(20, 60 * 1000); // 20 requests per minute per IP

export default async function getSettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: false, message: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!checkRate(ip)) {
      return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
    }

    const { storeHash, apiToken } = req.body;

    //Token check
    const apiTokenPrefix = languageEN?.appApiToken + "-settings-get";
    if (apiTokenPrefix !== apiToken) {
      return res.status(401).json({ status: false, message: 'Unauthorized Token' });
    }

    if (!storeHash) {
      return res.status(400).json({ status: false, message: 'storeHash is required' });
    }

    // Fetch settings
    const settings = await mysqlQuery(
      "SELECT storeHash, userId, enableShare, designerButtonName, designerButton, addtocartForm, cssCode FROM appSettings WHERE storeHash = ?",
      [storeHash]
    );

    if (settings.length === 0) {
      return res.status(404).json({ status: false, message: 'Settings not found' });
    }

    res.status(200).json({
      status: true,
      data: settings[0],
      message: 'Settings fetched successfully'
    });

  } catch (error: any) {
    console.error('Get Settings Error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
