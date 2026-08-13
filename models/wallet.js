const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDetails', required: true },
  
  type: { type: String, enum: ['deposit', 'withdraw', 'investment', 'interest'], required: true },
  amount: { type: Number, required: true }, // The gross amount (e.g., 5000)
  
  // NEW TDS FIELDS
  tdsAmount: { type: Number, default: 0 }, // The 1% cut (e.g., 50)
  netAmount: { type: Number }, // What the user actually receives (e.g., 4950)
  
  // Deposit field
  utr: { type: String }, 
  
  // Withdrawal fields
  bankName: { type: String },
  branchName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);