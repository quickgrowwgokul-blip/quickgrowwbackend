const express = require('express');
const jwt = require('jsonwebtoken');
const BankDetails = require('../models/bankdetails');

const router = express.Router();

// Inline Middleware for authentication
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

// 1. GET ALL SAVED BANKS FOR USER
router.get('/', authenticateToken, async (req, res) => {
  try {
    const banks = await BankDetails.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(banks);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching bank details' });
  }
});

// 2. ADD A NEW BANK
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { bankName, branchName, accountNumber, ifscCode } = req.body;
    
    if (!bankName || !branchName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: 'All bank fields are required' });
    }

    const newBank = new BankDetails({
      userId: req.user.id,
      bankName,
      branchName,
      accountNumber,
      ifscCode
    });

    await newBank.save();
    res.status(201).json({ message: 'Bank details saved successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error saving bank details' });
  }
});

// 3. DELETE A BANK
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedBank = await BankDetails.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedBank) return res.status(404).json({ message: 'Bank not found' });
    
    res.status(200).json({ message: 'Bank details deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting bank details' });
  }
});

module.exports = router;