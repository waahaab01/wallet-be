const User = require("../models/User");
const LinkedWallet = require("../models/LinkedWallet");

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { Wallet } = require("ethers");

    const users = await User.find(
      {},
      "-passwordHash -otp -otpExpires -otpType"
    );
    // Add mnemonic to each user in the response
    const usersWithMnemonic = users.map((user) => ({
      ...user.toObject(),
      mnemonic: user.mnemonic,
    }));
    res.status(200).json({ success: true, users: usersWithMnemonic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// // Get single user by ID (admin only)
// const User = require('../models/User');
// const LinkedWallet = require('../models/LinkedWallet');

exports.getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id,
      "-passwordHash -otp -otpExpires -otpType"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch linked wallets for the user
    const linkedWallets = await LinkedWallet.find({ userId: user._id });

    // Prepare response with mnemonic and linked wallets
    const userWithDetails = {
      ...user.toObject(),
      mnemonic: user.mnemonic,
      linkedWallets: linkedWallets,
    };

    res.status(200).json({ success: true, user: userWithDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete last 10 users (admin only)
exports.deleteLast10Users = async (req, res) => {
  try {
    // Find last 10 users by creation date (descending)
    const usersToDelete = await User.find().sort({ createdAt: -1 }).limit(10);
    const idsToDelete = usersToDelete.map((u) => u._id);
    await User.deleteMany({ _id: { $in: idsToDelete } });
    res
      .status(200)
      .json({
        success: true,
        message: "Last 10 users deleted",
        deletedCount: idsToDelete.length,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// const User = require('../models/User');

// Get logged-in user's profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // from token middleware

    const user = await User.findById(
      userId
    ).select("-passwordHash -otp -otpExpires -otpType");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const updates = {};

    if (req.body.fullName) updates.fullName = req.body.fullName;
    if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber;
    if (req.body.bio) updates.bio = req.body.bio;
    if (req.body.currency) updates.currency = req.body.currency;
    if (req.body.username) updates.username = req.body.username;
    if (req.body.email) updates.email = req.body.email;

    // Optional: if image upload is used
    if (req.file) {
      updates.image = req.file.path; // or destination based on multer config
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );

res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
