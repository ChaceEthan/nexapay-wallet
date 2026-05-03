// @ts-nocheck
import fs from 'fs';
import path from 'path';

/**
 * Registry API - Institutional Wallet Tracking
 * 🛡️ Records unique public keys to track real user growth.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { publicKey, network } = req.body;

  if (!publicKey) {
    res.status(400).json({ error: 'Public key required' });
    return;
  }

  try {
    // 📂 SIMULATED DATABASE (Local JSON File)
    // In production (Vercel/Cloud), this should be replaced with MongoDB/Supabase.
    const dbPath = path.resolve(process.cwd(), 'wallets_db.json');
    
    let db = { wallets: [] };
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    const existingIndex = db.wallets.findIndex(w => w.publicKey === publicKey);

    if (existingIndex > -1) {
      // Update last active
      db.wallets[existingIndex].lastActive = new Date().toISOString();
    } else {
      // Create new record
      db.wallets.push({
        id: db.wallets.length + 1,
        publicKey,
        network: network || 'testnet',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    res.status(200).json({ success: true, count: db.wallets.length });
  } catch (error) {
    console.error('Registry Error:', error);
    res.status(500).json({ error: 'Database synchronization failed' });
  }
}
