import * as StellarSdk from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

// Horizon Server (Testnet)
const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);

// =============================
// Get Account Details
// =============================
export async function getAccountDetails(publicKey) {
  try {
    return await server.loadAccount(publicKey);
  } catch (error) {
    if (error?.response?.status === 404) {
      return { balances: [] };
    }
    throw error;
  }
}

// =============================
// Get Transaction History
// =============================
export async function getTransactionHistory(publicKey) {
  try {
    const res = await server
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(20)
      .call();

    return res.records
      .filter(
        (tx) => tx.type === "payment" && tx.asset_type === "native"
      )
      .map((tx) => ({
        id: tx.id,
        hash: tx.transaction_hash,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        created_at: tx.created_at,
      }));
  } catch (error) {
    console.error("Transaction history error:", error);
    return [];
  }
}

// =============================
// Send XLM Transaction
// =============================
export async function sendTransaction({
  publicKey,
  destination,
  amount,
}) {
  // Validate address
  if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
    throw new Error("Invalid destination address");
  }

  // Validate amount
  if (Number(amount) <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Load sender account
  const sourceAccount = await server.loadAccount(publicKey);

  // Check balance
  const balance = sourceAccount.balances.find(
    (b) => b.asset_type === "native"
  );

  if (!balance || Number(balance.balance) < Number(amount)) {
    throw new Error("Insufficient balance");
  }

  // Check destination account
  try {
    await server.loadAccount(destination);
  } catch (e) {
    if (e?.response?.status === 404) {
      throw new Error(
        "Destination account not found. Fund it with at least 1 XLM."
      );
    }
  }

  // Get fee
  const fee = await server.fetchBaseFee();

  // Build transaction
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: fee.toString(),
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount: String(amount),
      })
    )
    .setTimeout(60)
    .build();

  // Sign with Freighter (IMPORTANT)
  const signedXDR = await signTransaction(tx.toXDR(), {
    networkPassphrase: StellarSdk.Networks.TESTNET,
  });

  // Convert signed XDR back to transaction
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXDR,
    StellarSdk.Networks.TESTNET
  );

  // Submit transaction
  return await server.submitTransaction(signedTx);
}