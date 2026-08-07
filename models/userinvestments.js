const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDetails', required: true },
  principalAmount: { type: Number, required: true },
  dailyRate: { type: Number, required: true }, // e.g., 0.2, 0.5, 1
  payoutFrequency: { type: Number, required: true }, // e.g., 5, 10, 20, 30 days
  nextPayoutDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('UserInvestments', investmentSchema);