// // const User = require('../models/User');
// // const Transaction = require('../models/Transaction');
// // const ethers = require('ethers');
// // const provider = new ethers.JsonRpcProvider(process.env.INFURA_API_URL);

// // async function startReceiveListener() {
// //   // 1. Sabhi users ke addresses nikaalein
// //   const users = await User.find({}, '_id walletAddress');
// //   const addressMap = {};
// //   users.forEach(user => {
// //     if (user.walletAddress) {
// //       addressMap[user.walletAddress.toLowerCase()] = user._id;
// //     }
// //   });

// //   // 2. Pending txs par listen karein
// //   provider.on('block', async (blockNumber) => {
// //     console.log(`New block received: #${blockNumber}`);
// //     try {
// //       const block = await provider.getBlock(blockNumber);
// //       if (!block) {
// //         console.log(`Block #${blockNumber} not found.`);
// //         return;
// //       }
// //       if (!block.transactions || block.transactions.length === 0) {
// //         console.log(`Block #${blockNumber} has no transactions.`);
// //         return;
// //       }
// //       console.log(`Block #${blockNumber} has ${block.transactions.length} transactions.`);

// //       for (const txHash of block.transactions) {
// //         const tx = await provider.getTransaction(txHash);
// //         console.log("Received transaction:", tx);
        
// //         if (tx && tx.to && addressMap[tx.to.toLowerCase()]) {
// //           console.log(`User received ETH! Block: ${blockNumber}, TxHash: ${tx.hash}, From: ${tx.from}, To: ${tx.to}, Amount: ${ethers.formatEther(tx.value)}`);
// //           await Transaction.create({
// //             userId: addressMap[tx.to.toLowerCase()],
// //             from: tx.from,
// //             to: tx.to,
// //             txHash: tx.hash,
// //             type: 'receive',
// //             status: 'confirmed',
// //             amount: ethers.formatEther(tx.value),
// //             chain: 'Ethereum',
// //           });
// //         }
// //       }
// //     } catch (err) {
// //       console.error('Listener error:', err);
// //     }
// //   });

// //   console.log('Real-time receive listener started for all user wallets.');
// // }

// // startReceiveListener();

// const User = require('../models/User');
// const Transaction = require('../models/Transaction');
// const ethers = require('ethers');
// const provider = new ethers.JsonRpcProvider(process.env.INFURA_API_URL);

// async function startReceiveListener() {
//   // 1️⃣ Load all user wallet addresses
//   const users = await User.find({}, '_id walletAddress');
//   const addressMap = {};
//   users.forEach(user => {
//     if (user.walletAddress) {
//       const normalized = user.walletAddress.toLowerCase().trim();
//       addressMap[normalized] = user._id;
//     }
//   });

//   console.log('✅ Loaded user wallet addressMap at startup:');
//   console.log(addressMap);

//   // 2️⃣ Listen for new blocks
//   provider.on('block', async (blockNumber) => {
//     console.log(`🔔 New block received: #${blockNumber}`);
//     try {
//       const block = await provider.getBlock(blockNumber);
//       if (!block || !block.transactions || block.transactions.length === 0) {
//         console.log(`Block #${blockNumber} has no transactions.`);
//         return;
//       }
//       console.log(`Block #${blockNumber} has ${block.transactions.length} transactions.`);

//       for (const txHash of block.transactions) {
//         const tx = await provider.getTransaction(txHash);
//         if (tx) {
//           const txTo = tx.to ? tx.to.toLowerCase().trim() : null;
//           const txFrom = tx.from ? tx.from.toLowerCase().trim() : null;

//           console.log(`🔎 Inspecting tx: ${tx.hash}`);
//           console.log(`     From: ${txFrom}`);
//           console.log(`     To: ${txTo}`);
//           console.log(`     Value: ${ethers.formatEther(tx.value)} ETH`);

//           if (txTo && addressMap[txTo]) {
//             console.log(`✅ MATCH FOUND! UserId: ${addressMap[txTo]}, Address: ${txTo}, Amount: ${ethers.formatEther(tx.value)} ETH`);
//             await Transaction.create({
//               userId: addressMap[txTo],
//               from: tx.from,
//               to: tx.to,
//               txHash: tx.hash,
//               type: 'receive',
//               status: 'confirmed',
//               amount: ethers.formatEther(tx.value),
//               chain: 'Ethereum',
//             });
//           }
//         }
//       }
//     } catch (err) {
//       console.error('❌ Listener error:', err);
//     }
//   });

//   console.log('🚀 Real-time receive listener started and waiting for blocks...');
// }

// startReceiveListener();

