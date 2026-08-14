const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  rate: { type: Number, required: true, unique: true },
  
  // NEW: Risk Level Field
  riskLevel: { 
    type: String, 
    enum: ['Safest', 'Safe', 'High Risk'], 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('InterestRate', rateSchema);