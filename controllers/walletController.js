const LinkedWallet = require('../models/LinkedWallet');
const ethers = require('ethers');
const { decrypt, encrypt } = require('../utils/encrypt');
const Transaction = require('../models/Transaction');
const bip39 = require('bip39');
const { Wallet } = require('ethers');
const User = require('../models/User');
const axios = require('axios');

const provider = new ethers.JsonRpcProvider(process.env.INFURA_API_URL);

// POST /api/wallets/send
exports.sendEthFromMainWallet = async (req, res) => {
  const userId = req.user.userId;
  const { toAddress, amountEth } = req.body;

  if (!ethers.isAddress(toAddress)) {
    return res.status(400).json({ message: 'Invalid recipient address' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Decrypt private key
    const decryptedPK = decrypt(user.encryptedPrivateKey);
    const wallet = new ethers.Wallet(decryptedPK, provider);

    // Create and send transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amountEth),
    });

    // Save transaction
    await Transaction.create({
      userId,
      from: wallet.address,
      to: toAddress,
      txHash: tx.hash,
      type: 'send',
      status: 'pending',
      amount: amountEth,
      chain: 'Ethereum',
    });

    res.status(200).json({
      success: true,
      txHash: tx.hash,
      message: 'Transaction sent',
    });
  } catch (error) {
    console.error('Send TX Error:', error);
    res.status(500).json({ message: 'Failed to send transaction' });
  }
};

// Link a new wallet
exports.linkWallet = async (req, res) => {
  const { walletType, walletAddress, chain } = req.body;
  const userId = req.user.userId; // coming from auth middleware

  try {
    const wallet = await LinkedWallet.create({
      userId,
      walletType,
      walletAddress,
      chain,
    });

    res.status(201).json({ success: true, wallet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's linked wallets
exports.getUserWallets = async (req, res) => {
  const userId = req.user.userId;
  try {
    const wallets = await LinkedWallet.find({ userId });
    res.status(200).json({ success: true, wallets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Fetch live wallet balance by walletId
exports.getWalletBalance = async (req, res) => {
  const userId = req.user.userId;
  const walletId = req.params.walletId;

  try {
    const wallet = await LinkedWallet.findOne({ _id: walletId, userId });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (!ethers.isAddress(wallet.walletAddress)) {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }

    const balanceWei = await provider.getBalance(wallet.walletAddress);
    const balance = ethers.formatEther(balanceWei);

    res.status(200).json({
      success: true,
      walletId: wallet._id,
      chain: wallet.chain,
      address: wallet.walletAddress,
      balance: {
        eth: balance
      }
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Error fetching balance' });
  }
};

// GET /api/wallets/transactions
exports.getTransactionHistory = async (req, res) => {
  const userId = req.user.userId;

  try {
    const txs = await Transaction.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: txs.length,
      transactions: txs,
    });
  } catch (error) {
    console.error('Transaction History Error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction history' });
  }
};

// POST /api/wallets/import
exports.importWalletFromMnemonic = async (req, res) => {
  const userId = req.user.userId;
  const { mnemonic } = req.body;

  if (!bip39.validateMnemonic(mnemonic)) {
    return res.status(400).json({ message: 'Invalid seed phrase' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.walletAddress && user.encryptedPrivateKey) {
      return res.status(400).json({ message: 'Wallet already exists. Cannot overwrite.' });
    }

    const wallet = Wallet.fromPhrase(mnemonic);
    const encryptedPrivateKey = encrypt(wallet.privateKey);

    user.walletAddress = wallet.address;
    user.encryptedPrivateKey = encryptedPrivateKey;
    await user.save();

    res.status(200).json({
      success: true,
      walletAddress: wallet.address,
      message: 'Wallet imported successfully',
    });
  } catch (error) {
    console.error('Wallet import error:', error);
    res.status(500).json({ message: 'Failed to import wallet' });
  }
};

exports.buyTokenDummy = async (req, res) => {
  const userId = req.user.userId;
  const { amountUsd } = req.body;

  try {
    const fakeTxHash = `0xmocktx_${Date.now()}`;
    const tokenAmount = amountUsd * 10;

    
    await Transaction.create({
      userId,
      from: 'system',
      to: 'user',
      txHash: fakeTxHash,
      type: 'buy',
      status: 'mocked',
      amount: tokenAmount.toString(),
      chain: 'MockChain'
    });

    res.status(200).json({
      success: true,
      message: 'Token purchase simulated',
      tokensMocked: tokenAmount,
      txHash: fakeTxHash
    });
  } catch (error) {
    console.error('Dummy Buy Error:', error);
    res.status(500).json({ message: 'Failed to simulate token purchase' });
  }
};

// Get user's receive address (main wallet)
exports.getReceiveAddress = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      walletAddress: user.walletAddress,
      message: 'This is your wallet address to receive funds.'
    });
  } catch (error) {
    console.error('Get Receive Address Error:', error);
    res.status(500).json({ message: 'Failed to fetch receive address' });
  }
};

// Yeh code backend me background process me chalega, API call par nahi
// provider.on('pending', async (txHash) => {
//   const tx = await provider.getTransaction(txHash);
//   if (tx && tx.to && tx.to.toLowerCase() === userWalletAddress.toLowerCase()) {
//     // Transaction user ke wallet par aa rahi hai
//     // Save to DB
//     await Transaction.create({
//       userId: userId,
//       from: tx.from,
//       to: tx.to,
//       txHash: tx.hash,
//       type: 'receive',
//       status: 'pending',
//       amount: ethers.formatEther(tx.value),
//       chain: 'Ethereum',
//     });
//   }
// });

// Get all received transactions for the logged-in user
exports.getReceivedTransactions = async (req, res) => {
  const userId = req.user.userId;
  try {
    const receivedTxs = await Transaction.find({
      userId,
      type: 'receive'
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: receivedTxs.length,
      transactions: receivedTxs
    });
  } catch (error) {
    console.error('Received Transactions Error:', error);
    res.status(500).json({ message: 'Failed to fetch received transactions' });
  }
};




exports.syncWallet = async (req, res) => {
  const userId = req.user.userId;
  const walletId = req.params.walletId;

  let walletAddress = null;

  try {
    // 1️⃣ Check if walletId refers to LinkedWallet first
    const linkedWallet = await LinkedWallet.findOne({ _id: walletId, userId });
    if (linkedWallet) {
      walletAddress = linkedWallet.walletAddress;
      console.log(`🔔 Syncing linked wallet: ${walletAddress}`);
    }

    // 2️⃣ If not found, check if walletId refers to User's main wallet
    if (!walletAddress) {
      const user = await User.findOne({ _id: walletId });
      if (user && user.walletAddress) {
        walletAddress = user.walletAddress;
        console.log(`🔔 Syncing native user wallet: ${walletAddress}`);
      }
    }

    if (!walletAddress) {
      return res.status(404).json({ message: 'Wallet not found for this user' });
    }

    // ✅ Fetch balance from blockchain
    const balanceWei = await provider.getBalance(walletAddress);
    const balanceEth = ethers.formatEther(balanceWei);
    // ✅ Fetch transactions from Etherscan API
    const txResponse = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        address: walletAddress,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: process.env.ETHERSCAN_API_KEY
      }
    });

    console.log('🔔 Syncing wallet response:', txResponse.data.result);

    const txs = txResponse.data.result || [];

    let savedCount = 0;
    for (const tx of txs) {
      const exists = await Transaction.findOne({ txHash: tx.hash });
      if (!exists) {
        await Transaction.create({
          userId,
          from: tx.from,
          to: tx.to,
          txHash: tx.hash,
          type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive',
          status: tx.isError === '0' ? 'confirmed' : 'failed',
          amount: ethers.formatEther(tx.value),
          chain: 'Ethereum'
        });
        savedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      wallet: walletAddress,
      balance: balanceEth,
      transactionsFetched: txs.length,
      transactionsSaved: savedCount
    });

  } catch (err) {
    console.error('❌ syncWallet error:', err);
    res.status(500).json({ message: 'Failed to sync wallet' });
  }
};
