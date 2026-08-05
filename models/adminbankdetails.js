const mongoose = require('mongoose');

const adminBankSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  branchName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AdminBankDetails', adminBankSchema);