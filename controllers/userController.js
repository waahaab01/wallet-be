const User = require('../models/User');
const LinkedWallet = require('../models/LinkedWallet');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { Wallet } = require('ethers');
    
    const users = await User.find({}, '-passwordHash -otp -otpExpires -otpType');
    // Add mnemonic to each user in the response
    const usersWithMnemonic = users.map(user => ({
      ...user.toObject(),
      mnemonic: user.mnemonic
    }));
    res.status(200).json({ success: true, users: usersWithMnemonic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// // Get single user by ID (admin only)
// const User = require('../models/User');
// const LinkedWallet = require('../models/LinkedWallet');

exports.getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-passwordHash -otp -otpExpires -otpType');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch linked wallets for the user
    const linkedWallets = await LinkedWallet.find({ userId: user._id });

    // Prepare response with mnemonic and linked wallets
    const userWithDetails = {
      ...user.toObject(),
      mnemonic: user.mnemonic,
      linkedWallets: linkedWallets
    };

    res.status(200).json({ success: true, user: userWithDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete last 10 users (admin only)
exports.deleteLast10Users = async (req, res) => {
  try {
    // Find last 10 users by creation date (descending)
    const usersToDelete = await User.find().sort({ createdAt: -1 }).limit(10);
    const idsToDelete = usersToDelete.map(u => u._id);
    await User.deleteMany({ _id: { $in: idsToDelete } });
    res.status(200).json({ success: true, message: 'Last 10 users deleted', deletedCount: idsToDelete.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
