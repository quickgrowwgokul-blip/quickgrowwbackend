const express = require('express');
const jwt = require('jsonwebtoken');
const UserDetails = require('../models/userdetails');
const Wallet = require('../models/wallet');
const UserInvestments = require('../models/userinvestments');

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) { res.status(400).json({ message: 'Invalid Token' }); }
};

// 1. CREATE NEW INVESTMENT (WITH 5000 MINIMUM)
router.post('/invest', authenticateToken, async (req, res) => {
  try {
    const { amount, dailyRate, payoutFrequency } = req.body;
    const principalAmount = Number(amount);

    if (!principalAmount || !dailyRate || !payoutFrequency) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // ENFORCING THE MINIMUM AMOUNT
    if (principalAmount < 5000) {
      return res.status(400).json({ message: 'Minimum investment amount is ₹5000' });
    }

    const user = await UserDetails.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.walletBalance < principalAmount) return res.status(400).json({ message: 'Insufficient wallet balance' });

    user.walletBalance -= principalAmount;
    await user.save();

    await new Wallet({
      userId: req.user.id, type: 'investment', amount: principalAmount, status: 'approved'
    }).save();

    const nextPayoutDate = new Date();
    nextPayoutDate.setDate(nextPayoutDate.getDate() + Number(payoutFrequency));

    const newInvestment = new UserInvestments({
      userId: req.user.id, principalAmount, dailyRate: Number(dailyRate), payoutFrequency: Number(payoutFrequency), nextPayoutDate
    });
    await newInvestment.save();

    res.status(201).json({ message: 'Investment started successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. GET USER'S INVESTMENTS
router.get('/my-investments', authenticateToken, async (req, res) => {
  try {
    const investments = await UserInvestments.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(investments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;