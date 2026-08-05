const express = require('express');
const jwt = require('jsonwebtoken');
const AdminBankDetails = require('../models/adminbankdetails');

const router = express.Router();

// Middleware for Users (To view details)
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) { res.status(400).json({ message: 'Invalid Token' }); }
};

// Middleware for Admins (To update details)
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.role !== 'admin') return res.status(403).json({ message: 'Not an admin' });
    req.admin = verified;
    next();
  } catch (error) { res.status(400).json({ message: 'Invalid Token' }); }
};

// 1. GET ADMIN BANK DETAILS (Used by Users & Admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // We only ever need one document for this
    const bankDetails = await AdminBankDetails.findOne();
    res.status(200).json(bankDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching admin bank details' });
  }
});

// 2. UPDATE ADMIN BANK DETAILS (Admin Only)
router.post('/update', authenticateAdmin, async (req, res) => {
  try {
    const { bankName, accountName, accountNumber, ifscCode, branchName } = req.body;

    if (!bankName || !accountName || !accountNumber || !ifscCode || !branchName) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Upsert: Find the first document and update it. If it doesn't exist, create it.
    const updatedDetails = await AdminBankDetails.findOneAndUpdate(
      {}, // Empty filter targets the first document it finds
      { bankName, accountName, accountNumber, ifscCode, branchName },
      { new: true, upsert: true } 
    );

    res.status(200).json({ message: 'Admin bank details updated successfully!', data: updatedDetails });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating admin bank details' });
  }
});

module.exports = router;