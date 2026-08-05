const express = require('express');
const jwt = require('jsonwebtoken');
const Wallet = require('../models/wallet');
const UserDetails = require('../models/userdetails');

const router = express.Router();

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

router.get('/requests', authenticateAdmin, async (req, res) => {
  try {
    const requests = await Wallet.find({ status: 'pending' }).populate('userId', 'name email').sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching requests', error: error.message });
  }
});

router.post('/resolve', authenticateAdmin, async (req, res) => {
  try {
    const { requestId, action } = req.body; 

    const request = await Wallet.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already resolved' });

    const user = await UserDetails.findById(request.userId);

    if (action === 'accept') {
      request.status = 'approved';
      if (request.type === 'deposit') user.walletBalance += request.amount;
    } else if (action === 'reject') {
      request.status = 'rejected';
      if (request.type === 'withdraw') user.walletBalance += request.amount;
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await user.save();
    await request.save();
    res.status(200).json({ message: `Request successfully ${action}ed!` });
  } catch (error) {
    res.status(500).json({ message: 'Server error resolving request', error: error.message });
  }
});

// GET RESOLVED HISTORY
router.get('/history', authenticateAdmin, async (req, res) => {
  try {
    // Fetch only requests that are approved or rejected, newest first
    const history = await Wallet.find({ status: { $in: ['approved', 'rejected'] } })
                                .populate('userId', 'name email')
                                .sort({ updatedAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching history', error: error.message });
  }
});

module.exports = router;