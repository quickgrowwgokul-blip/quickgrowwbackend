const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletBalance: { type: Number, default: 0 } // Added wallet balance
}, { timestamps: true });

module.exports = mongoose.model('UserDetails', userSchema);