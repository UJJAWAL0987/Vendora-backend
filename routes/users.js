const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const User = require('../models/User');

const router = express.Router();

// Get all users (admin only)
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  
  res.json({
    success: true,
    data: users
  });
}));

// Get user by ID (admin only)
router.get('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
}));

// Update user (admin only)
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
}));

// Delete user (admin only)
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  await user.remove();
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

module.exports = router; 