const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true }, // <-- Add this

    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    walletAddress: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    mnemonic: {
      type: String,
      required: function () {
        return this.isNew; // Only required when creating a new user
      },
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    otpType: {
      type: String,
      enum: ["login", "reset", "login-mnemonic", null],
      default: null,
    },
    phoneNumber: { type: String, default: null },
    currency: { type: String, default: "USD" },
    image: { type: String, default: null }, // Will store image URL or filename
    bio: { type: String, default: "" },
    timeZone: { type: String, default: "Asia/Karachi" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
