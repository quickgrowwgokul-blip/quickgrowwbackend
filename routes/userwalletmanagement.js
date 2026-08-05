const express = require('express');
const jwt = require('jsonwebtoken');
const UserDetails = require('../models/userdetails');
const Wallet = require('../models/wallet');

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

// 1. GET USER BALANCE
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const user = await UserDetails.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. SUBMIT DEPOSIT REQUEST
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount, utr } = req.body;
    if (!amount || !utr) return res.status(400).json({ message: 'Amount and UTR required.' });

    const newRequest = new Wallet({ userId: req.user.id, type: 'deposit', amount, utr, status: 'pending' });
    await newRequest.save();
    res.status(201).json({ message: 'Deposit request submitted successfully! Awaiting admin approval.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error submitting deposit.', error: error.message });
  }
});

// 3. SUBMIT WITHDRAW REQUEST
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, bankName, branchName, accountNumber, ifscCode } = req.body;
    if (!amount || !bankName || !branchName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: 'All bank details and amount are required.' });
    }

    const user = await UserDetails.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.walletBalance < amount) return res.status(400).json({ message: 'Insufficient wallet balance, bro.' });

    user.walletBalance -= amount;
    await user.save();

    const newRequest = new Wallet({
      userId: req.user.id, type: 'withdraw', amount, bankName, branchName, accountNumber, ifscCode, status: 'pending'
    });
    await newRequest.save();
    res.status(201).json({ message: 'Withdraw request submitted! Amount placed on hold.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error submitting withdrawal.', error: error.message });
  }
});

// 4. GET USER TRANSACTION HISTORY
router.get('/history', authenticateToken, async (req, res) => {
  try {
    // Fetch user's requests and sort by newest first
    const history = await Wallet.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching history.', error: error.message });
  }
});

module.exports = router;