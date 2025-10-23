import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(20, 60 * 1000); // 20 requests per minute per IP

export default async function saveSettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: false, message: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!checkRate(ip)) {
      return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
    }
    
    const {
      storeHash,
      userId,
      enableShare,
      designerButtonName,
      designerButton,
      addtocartForm,
      cssCode,
      apiToken
    } = req.body;

    //Token check
    const apiTokenPrefix = languageEN?.appApiToken + "-settings-save";
    if (apiTokenPrefix !== apiToken) {
      return res.status(401).json({ status: false, message: 'Unauthorized Token' });
    }

    if (!storeHash || !userId) {
      return res.status(400).json({ status: false, message: 'storeHash and userId are required' });
    }

    // Check if record exists
    const existing = await mysqlQuery(
      "SELECT id FROM appSettings WHERE storeHash = ?",
      [storeHash]
    );

    if (existing.length > 0) {
      //Update existing record
      await mysqlQuery(
        `UPDATE appSettings
         SET userId = ?, enableShare = ?, designerButtonName = ?, designerButton = ?, addtocartForm = ?, cssCode = ?
         WHERE storeHash = ?`,
        [userId, enableShare, designerButtonName, designerButton, addtocartForm, cssCode, storeHash]
      );
    } else {
      //Insert new record
      await mysqlQuery(
        `INSERT INTO appSettings
          (storeHash, userId, enableShare, designerButtonName, designerButton, addtocartForm, cssCode)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [storeHash, userId, enableShare, designerButtonName, designerButton, addtocartForm, cssCode]
      );
    }

    res.status(200).json({
      status: true,
      message: existing.length > 0 ? 'Settings updated successfully.' : 'Settings added successfully.'
    });

  } catch (error: any) {
    console.error('Save Settings Error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
