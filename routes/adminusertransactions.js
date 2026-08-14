const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Added for password hashing
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
    const user = await UserDetails.findById(userId).select('name email walletBalance');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Wallet.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ user, transactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching transactions', error: error.message });
  }
});

// 3. UPDATE USER PASSWORD (NEW)
router.put('/:userId/password', authenticateAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await UserDetails.findByIdAndUpdate(req.params.userId, { password: hashedPassword });
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating password', error: error.message });
  }
});

// 4. ADJUST WALLET BALANCE (NEW)
router.post('/:userId/balance', authenticateAdmin, async (req, res) => {
  try {
    const { amount, action } = req.body;
    const numAmount = Number(amount);
    
    if (!numAmount || numAmount <= 0) return res.status(400).json({ message: 'Invalid amount provided' });

    const user = await UserDetails.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'add') {
      user.walletBalance += numAmount;
      // Log as an approved system deposit
      await Wallet.create({ userId: user._id, type: 'deposit', amount: numAmount, status: 'approved' });
    } else if (action === 'subtract') {
      if (user.walletBalance < numAmount) return res.status(400).json({ message: 'Insufficient wallet balance' });
      user.walletBalance -= numAmount;
      // Log as an approved system withdrawal
      await Wallet.create({ userId: user._id, type: 'withdraw', amount: numAmount, status: 'approved' });
    } else {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    await user.save();
    res.status(200).json({ message: `Successfully ${action === 'add' ? 'added' : 'deducted'} ₹${numAmount}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error adjusting balance', error: error.message });
  }
});

// 5. DELETE USER (NEW)
router.delete('/:userId', authenticateAdmin, async (req, res) => {
  try {
    const user = await UserDetails.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Optional but highly recommended: clean up their wallet history
    await Wallet.deleteMany({ userId: user._id }); 
    
    // Delete the actual user
    await UserDetails.findByIdAndDelete(req.params.userId);

    res.status(200).json({ message: 'User permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
});

module.exports = router;