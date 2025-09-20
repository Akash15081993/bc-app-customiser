import { NextApiRequest, NextApiResponse } from 'next';
import { mysqlQuery } from '@lib/dbs/mysql';
import { rateLimit } from '@lib/rateLimit';
import languageEN from 'lang/en';

const checkRate = rateLimit(12, 60 * 1000); // 12 requests per minute per IP

export default async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: false, message: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!checkRate(ip)) {
      return res.status(429).json({ status: false, message: 'Too many requests, slow down' });
    }

    const { platform, storeHash, firstName, lastName, phone, storeUrl, storeName, email, apiToken } = req.body;

    if (!storeHash) return res.status(401).json({ status: false, message: 'Unauthorized' });

    const apiTokenPrefix = languageEN?.appApiToken + "-login";
    if (apiTokenPrefix !== apiToken) {
      return res.status(401).json({ status: false, message: 'Unauthorized Token' });
    }

    // Check if record already exists
    const existingRecords = await mysqlQuery(
      "SELECT id FROM loginMaster WHERE platform = ? AND storeHash = ?",
      [platform, storeHash]
    );

    let recordId;

    if (existingRecords.length > 0) {
      // Update existing record
      recordId = existingRecords[0].id;
      await mysqlQuery(
        `UPDATE loginMaster 
         SET firstName = ?, lastName = ?, phone = ?, storeUrl = ?, storeName = ?, email = ? 
         WHERE id = ?`,
        [firstName, lastName, phone, storeUrl, storeName, email, recordId]
      );
    } else {
      // Insert new record
      const insertResult = await mysqlQuery(
        `INSERT INTO loginMaster 
         (platform, storeHash, firstName, lastName, phone, storeUrl, storeName, email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [platform, storeHash, firstName, lastName, phone, storeUrl, storeName, email]
      );
      recordId = insertResult.insertId;
    }

    res.status(200).json({ status: true, data: { id: recordId }, message: "Success." });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
