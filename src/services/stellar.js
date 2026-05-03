import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
  StrKey,
} from "@stellar/stellar-sdk";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { signTransaction, signMessage } from "@stellar/freighter-api";

let server = new Horizon.Server("https://horizon-testnet.stellar.org");
let networkPassphrase = Networks.TESTNET;

export const updateNetworkConfig = (network) => {
  const isPublic = network === "public";
  server = new Horizon.Server(
    isPublic ? "https://horizon.stellar.org" : "https://horizon-testnet.stellar.org"
  );
  networkPassphrase = isPublic ? Networks.PUBLIC : Networks.TESTNET;
};

export const getNetworkPassphrase = () => networkPassphrase;

export const getAccountBalances = async (publicKey) => {
  try {
    const account = await server.loadAccount(publicKey);
    const mapped = account.balances.map(b => ({
      ...b,
      balance: b.balance,
      asset_code: b.asset_type === "native" ? "XLM" : b.asset_code
    }));
    // Move native to front
    return mapped.sort((a, b) => (a.asset_code === "XLM" ? -1 : 1));
  } catch (error) {
    if (error.response?.status === 404) {
      // Return a custom flag so UI can prompt for activation/funding
      return [{ asset_type: "native", balance: "0.0000000", asset_code: "XLM", unfunded: true }];
    }
    throw error;
  }
};

export const getMinimumReserve = async (publicKey) => {
  try { 
  const account = await server.loadAccount(publicKey);
    const baseReserve = 0.5;
    const reserve = (2 + account.subentry_count) * baseReserve;
    return reserve.toFixed(7);
  } catch (error) {
    return "1.0000000";
  }
};

export const deriveKeypairFromMnemonic = (mnemonic, index = 0) => {
   const seed = bip39.mnemonicToSeedSync(mnemonic);
  const path = `m/44'/148'/${index}'`;
  const { key } = derivePath(path, seed.toString("hex"));

  const pair = Keypair.fromRawEd25519Seed(key);
  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
};

export const validateAddress = (address) => {
  if (!address || typeof address !== "string") return false;
  return StrKey.isValidEd25519PublicKey(address);
};

// Check if a Stellar account exists (is funded)
export const accountExists = async (publicKey) => {
  try {
    await server.loadAccount(publicKey);
    return true;
  } catch (error) {
    if (error.response?.status === 404) return false;
    throw error;
  }
};

export const getTransactions = async (publicKey) => {
  try {
    const history = await server
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(10)
      .call();

    // Normalize all operation types so .to/.from/.amount always exist
    return history.records
      .filter((r) => r.type === "payment" || r.type === "create_account")
      .map((r) => {
        if (r.type === "create_account") {
          return {
            ...r,
            from: r.funder,
            to: r.account,
            amount: r.starting_balance,
            asset_code: "XLM"
          };
        }
        
        // ✅ FIX: For payment operations, Horizon returns source_account (not 'from')
        // and omits 'to' field. Infer direction based on whether we're the source.
        const from = r.source_account || r.from;
        const to = from === publicKey ? r.account : publicKey;
        
        return {
          ...r,
          from,
          to,
          asset_code: r.asset_type === "native" ? "XLM" : r.asset_code
        };
      });
  } catch (error) {
    console.error("Fetch transactions failed:", error);
    return [];
  }
};

export const fundTestnetAccount = async (publicKey) => {
  try {
    const res = await fetch(
      `https://friendbot.stellar.org?addr=${publicKey}`
    );
    if (res.status === 429) throw new Error("Friendbot is rate-limited. Please wait a few minutes.");
    if (!res.ok) throw new Error("Friendbot API is currently unavailable.");
    return await res.json();
  } catch {
    throw new Error("Could not connect to Friendbot. Please check your internet.");
  }
};

export const getBaseFee = async () => {
  try {
    const fee = await server.fetchBaseFee();
    return (fee / 10000000).toFixed(7);
  } catch (error) {
    console.error("Fetch fee failed:", error);
    return "0.0000100";
  }
};

/**
 * changeTrust
 * Establishes a trustline for a custom asset.
 * Necessary before a user can receive non-native assets.
 */
export const changeTrust = async (
  senderAddress,
  secretKey,
  assetCode,
  assetIssuer
) => {
  const sourceKeypair = Keypair.fromSecret(secretKey);
  const account = await server.loadAccount(senderAddress);
  const fee = String(await server.fetchBaseFee());

  const asset = new Asset(assetCode, assetIssuer);

  const transaction = new TransactionBuilder(account, {
    fee,
    networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset,
      })
    )
    .setTimeout(300)
    .build();

  transaction.sign(sourceKeypair);
  return await server.submitTransaction(transaction);
};

/**
 * sendStellarTransaction
 * Comprehensive helper to build, sign, and submit a transaction.
 */
export const sendStellarTransaction = async (
  senderAddress,
  secretKey,
  destination,
  amount,
  memo = "",
  assetCode = "XLM",
  assetIssuer = null
) => {
  try {
    // 1. Validate destination address
    if (!validateAddress(destination)) {
      throw new Error("Invalid recipient address format.");
    }

    // 2. Validate amount (> 0 and valid number)
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Amount must be a valid number greater than zero.");
    }

    // 3. Validate Source Auth
    if (!secretKey || !StrKey.isValidEd25519SecretSeed(secretKey)) {
      throw new Error("Invalid source secret key. Please unlock your wallet.");
    }

    // 4. Formatting: Stellar requires a string with 7 decimal precision
    const amountString = parsedAmount.toFixed(7);

    const sourceKeypair = Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(senderAddress);
    const destExists = await accountExists(destination);
    const fee = String(await server.fetchBaseFee());

    const asset = assetCode === "XLM" || !assetIssuer 
      ? Asset.native() 
      : new Asset(assetCode, assetIssuer);
    
    // 5. Correct Memo Handling (Max 28 bytes for text)
    let memoValue = Memo.none();
    if (memo && memo.toString().trim() !== "") {
      const memoStr = memo.toString();
      // Ensure memo fits within Stellar's 28-byte limit for TEXT memos
      if (Buffer.byteLength(memoStr, 'utf8') > 28) {
        throw new Error("Memo is too long (max 28 bytes).");
      }
      memoValue = Memo.text(memoStr);
    }

    const builder = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    }).addMemo(memoValue);

    if (destExists) {
      builder.addOperation(
        Operation.payment({
          destination,
          asset,
          amount: amountString,
        })
      );
    } else if (asset.isNative()) {
      // Auto-convert to createAccount if sending native XLM to unfunded address
      builder.addOperation(
        Operation.createAccount({
          destination,
          startingBalance: amountString,
        })
      );
    } else {
      throw new Error("Recipient account is not funded. Only XLM can be sent to unfunded accounts.");
    }

    // Build with a safer timeout (60 seconds)
    const transaction = builder.setTimeout(60).build();
    transaction.sign(sourceKeypair);

    return await server.submitTransaction(transaction);
  } catch (error) {
    // Extract specific Horizon errors if available for better debugging
    const detail = error.response?.data?.extras?.result_codes?.operations?.[0] || error.message;
    console.error("❌ Stellar Transaction Failed:", detail);
    throw new Error(detail);
  }
};

export const signAndSendTransaction = async (
  secretKey,
  destination,
  amount
) => {
  const sourceKeypair = Keypair.fromSecret(secretKey);
  
  // Handle unfunded source account
  let account;
  try {
    account = await server.loadAccount(sourceKeypair.publicKey());
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Your account is not funded. Please add XLM to activate it on the Stellar network.");
    }
    throw error;
  }

  // Check if destination account exists on the network
  const destExists = await accountExists(destination);

  const fee = String(await server.fetchBaseFee());

  const builder = new TransactionBuilder(account, {
    fee,
    networkPassphrase,
  });

  if (destExists) {
    builder.addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount: String(amount),
      })
    );
  } else {
    // Unfunded account → must use createAccount (minimum 1 XLM)
    builder.addOperation(
      Operation.createAccount({
        destination,
        startingBalance: String(amount),
      })
    );
  }

  const transaction = builder.setTimeout(300).build();
  transaction.sign(sourceKeypair);

  return await server.submitTransaction(transaction);
};

export const buildAndSignWithFreighter = async (
  publicKey,
  destination,
  amount,
  memo = ""
) => {
  // Handle unfunded source account
  let account;
  try {
    account = await server.loadAccount(publicKey);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Your account is not funded. Please add XLM to activate it on the Stellar network.");
    }
    throw error;
  }

  // Check if destination account exists on the network
  const destExists = await accountExists(destination);

  const fee = String(await server.fetchBaseFee());

  // 📝 MEMO: Add memo if provided
  const memoValue = memo ? Memo.text(memo.toString()) : Memo.none();

  const builder = new TransactionBuilder(account, {
    fee,
    networkPassphrase,
  }).addMemo(memoValue);

  if (destExists) {
    builder.addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount: String(amount),
      })
    );
  } else {
    builder.addOperation(
      Operation.createAccount({
        destination,
        startingBalance: String(amount),
      })
    );
  }

  const transaction = builder.setTimeout(300).build();

  const xdr = transaction.toXDR();

  const signedXdr = await signTransaction(xdr, {
    network: networkPassphrase === Networks.PUBLIC ? "PUBLIC" : "TESTNET",
  });

  const signedTransaction = TransactionBuilder.fromXDR(
    signedXdr,
    networkPassphrase
  );

  return await server.submitTransaction(signedTransaction);
};

/**
 * Sign a message using Freighter wallet
 * Used for wallet ownership verification and authentication
 */
export const signMessageWithFreighter = async (message) => {
  try {
    if (!message || typeof message !== "string") {
      throw new Error("Message must be a non-empty string");
    }

    const signature = await signMessage(message);

    if (!signature) {
      throw new Error("No signature returned from Freighter");
    }

    return signature;
  } catch (error) {
    console.error("Failed to sign message with Freighter:", error);
    throw error;
  }
};