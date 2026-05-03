// @ts-nocheck
import fs from 'fs';
import path from 'path';

/**
 * Users Count API
 * 🛡️ Returns the real number of unique wallets in the registry.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const dbPath = path.resolve(process.cwd(), 'wallets_db.json');
    
    let count = 0;
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      count = db.wallets.length;
    } else {
      // Fallback/Initial state
      count = 0;
    }

    res.status(200).json({ count });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ count: 0, error: 'Failed to retrieve user count' });
  }
}
