import { Server, TransactionBuilder, Networks, nativeToScVal, Contract, SorobanRpc } from '@stellar/stellar-sdk';
import { isAllowed, getAddress, signTransaction } from '@stellar/freighter-api';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

export const connectWallet = async () => {
  try {
    // Check if Freighter is available
    if (!window.freighterApi) {
      throw new Error('Freighter wallet extension not installed');
    }

    // Check if connected
    const isConnected = await window.freighterApi.isConnected();
    if (!isConnected) {
      throw new Error('Freighter wallet not connected');
    }

    // Request access
    const accessGranted = await window.freighterApi.requestAccess();
    if (!accessGranted) {
      throw new Error('Access to wallet denied');
    }

    // Get public key
    const publicKey = await window.freighterApi.getPublicKey();

    if (!publicKey) {
      throw new Error('Failed to get public key');
    }

    return publicKey;
  } catch (error) {
    throw new Error(error.message || 'Wallet connection failed');
  }
};

export const disconnectWallet = async () => {
  try {
    // Freighter doesn't have explicit disconnect, but we clear localStorage
    localStorage.removeItem('userPublicKey');
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
};

export const sendTransaction = async (destinationAddress, amount) => {
  try {
    const allowed = await isAllowed();
    if (!allowed) {
      throw new Error('Freighter wallet extension not installed or not allowed');
    }

    const address = await getAddress();
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Get account from Horizon
    const server = new Server(HORIZON_URL);
    const sourceAccount = await server.loadAccount(address);

    // Create transaction
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: Networks.TESTNET_NETWORK_PASSPHRASE,
    })
      .addOperation({
        type: 'payment',
        destination: destinationAddress,
        asset: {
          code: 'native', // XLM
        },
        amount: amount.toString(),
      })
      .setTimeout(30)
      .build();

    // Sign with Freighter
    const signedXDR = await signTransaction(transaction.toXDR(), {
      networkPassphrase: Networks.TESTNET_NETWORK_PASSPHRASE
    });

    // Parse signed transaction
    const signedTransaction = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET_NETWORK_PASSPHRASE);

    // Submit to Horizon
    const response = await server.submitTransaction(signedTransaction);

    return response;
  } catch (error) {
    console.error('Transaction error:', error);
    throw new Error(error.message || 'Transaction failed');
  }
};

export const invokeContract = async (contractId, method, args = []) => {
  try {
    const allowed = await isAllowed();
    if (!allowed) {
      throw new Error('Freighter wallet extension not installed or not allowed');
    }

    const address = await getAddress();
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const sorobanServer = new SorobanRpc.Server(SOROBAN_RPC_URL);
    const horizonServer = new Server(HORIZON_URL);

    // Get account from Horizon
    const sourceAccount = await horizonServer.loadAccount(address);

    const contract = new Contract(contractId);
    const scArgs = args.map(arg => nativeToScVal(arg));

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: Networks.TESTNET_NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...scArgs))
      .setTimeout(30)
      .build();

    // Simulate the transaction first
    await sorobanServer.simulateTransaction(transaction);

    // Prepare the transaction for submission
    const preparedTransaction = await sorobanServer.prepareTransaction(transaction);

    const signedXDR = await signTransaction(preparedTransaction.toXDR(), {
      networkPassphrase: Networks.TESTNET_NETWORK_PASSPHRASE
    });

    const signedTransaction = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET_NETWORK_PASSPHRASE);

    const response = await sorobanServer.sendTransaction(signedTransaction);

    return response;
  } catch (error) {
    console.error('Soroban error:', error);
    throw new Error(error.message || 'Contract invocation failed');
  }
};