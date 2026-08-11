const express = require('express');
const jwt = require('jsonwebtoken');
const InterestRate = require('../models/interestrates');

const router = express.Router();

// Middleware specifically for verifying the admin token
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied: No Admin Token' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) { 
    res.status(400).json({ message: 'Invalid Admin Token' }); 
  }
};

// 1. GET ALL RATES (Used by both Users and Admins)
router.get('/rates', async (req, res) => {
  try {
    const rates = await InterestRate.find().sort({ rate: 1 }); // Sort lowest to highest
    res.status(200).json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching rates', error: error.message });
  }
});

// 2. ADD NEW RATE (Admin Only)
router.post('/rates', authenticateAdmin, async (req, res) => {
  try {
    const { rate } = req.body;
    if (!rate) return res.status(400).json({ message: 'Rate is required' });
    
    // Check if it already exists to prevent duplicates
    const existingRate = await InterestRate.findOne({ rate: Number(rate) });
    if (existingRate) return res.status(400).json({ message: 'This rate already exists!' });

    const newRate = new InterestRate({ rate: Number(rate) });
    await newRate.save();
    res.status(201).json({ message: 'New interest rate added successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding rate', error: error.message });
  }
});

// 3. DELETE RATE (Admin Only)
router.delete('/rates/:id', authenticateAdmin, async (req, res) => {
  try {
    await InterestRate.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Interest rate removed successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting rate', error: error.message });
  }
});

module.exports = router;