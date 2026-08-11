const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  rate: { type: Number, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('InterestRate', rateSchema);