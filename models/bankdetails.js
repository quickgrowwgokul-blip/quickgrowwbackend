const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDetails', required: true },
  bankName: { type: String, required: true },
  branchName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('BankDetails', bankDetailsSchema);