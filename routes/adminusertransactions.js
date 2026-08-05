const express = require('express');
const jwt = require('jsonwebtoken');
const UserDetails = require('../models/userdetails');
const Wallet = require('../models/wallet');

const router = express.Router();

// Inline Admin Middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.role !== 'admin') return res.status(403).json({ message: 'Access Denied: Not an admin' });
    req.admin = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

// 1. GET ALL USERS
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    // We use .select('-password') to make sure we don't accidentally send passwords to the frontend
    const users = await UserDetails.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
});

// 2. GET SPECIFIC USER TRANSACTIONS
router.get('/:userId/transactions', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch the user's basic details and their transactions
    const user = await UserDetails.findById(userId).select('name email walletBalance');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Wallet.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({ user, transactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching transactions', error: error.message });
  }
});

module.exports = router;