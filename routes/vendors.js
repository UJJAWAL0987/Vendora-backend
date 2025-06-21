const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const router = express.Router();

// Get all vendors (admin only)
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const vendors = await User.find({ role: 'vendor' }).select('-password');
  
  res.json({
    success: true,
    data: vendors
  });
}));

// Get vendor by ID (admin only)
router.get('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ 
    _id: req.params.id, 
    role: 'vendor' 
  }).select('-password');
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }
  
  res.json({
    success: true,
    data: vendor
  });
}));

// Update vendor status (admin only)
router.put('/:id/status', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  
  const vendor = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'vendor' },
    { isActive },
    { new: true }
  ).select('-password');
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }
  
  res.json({
    success: true,
    data: vendor
  });
}));

// Get vendor statistics (admin only)
router.get('/:id/stats', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ 
    _id: req.params.id, 
    role: 'vendor' 
  });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  // Product count
  const productCount = await Product.countDocuments({ vendor: req.params.id });
  const activeProductCount = await Product.countDocuments({ 
    vendor: req.params.id, 
    isActive: true 
  });
  
  // Monthly orders and revenue
  const monthlyStats = await Order.aggregate([
    {
      $match: {
        'vendorOrders.vendor': req.params.id,
        createdAt: { $gte: startOfMonth }
      }
    },
    {
      $unwind: '$vendorOrders'
    },
    {
      $match: {
        'vendorOrders.vendor': req.params.id
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' }
      }
    }
  ]);
  
  // Yearly stats
  const yearlyStats = await Order.aggregate([
    {
      $match: {
        'vendorOrders.vendor': req.params.id,
        createdAt: { $gte: startOfYear }
      }
    },
    {
      $unwind: '$vendorOrders'
    },
    {
      $match: {
        'vendorOrders.vendor': req.params.id
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' }
      }
    }
  ]);
  
  const stats = {
    vendor: {
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      isActive: vendor.isActive,
      createdAt: vendor.createdAt
    },
    products: {
      total: productCount,
      active: activeProductCount
    },
    monthly: monthlyStats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
    yearly: yearlyStats[0] || { totalOrders: 0, totalRevenue: 0 }
  };
  
  res.json({
    success: true,
    data: stats
  });
}));

// Get vendor products (admin only)
router.get('/:id/products', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ 
    _id: req.params.id, 
    role: 'vendor' 
  });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }
  
  const products = await Product.find({ vendor: req.params.id })
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: products
  });
}));

// Get vendor orders (admin only)
router.get('/:id/orders', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ 
    _id: req.params.id, 
    role: 'vendor' 
  });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }
  
  const orders = await Order.find({ 'vendorOrders.vendor': req.params.id })
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 });
  
  const vendorOrders = orders.map(order => {
    const vendorOrder = order.vendorOrders.find(vo => 
      vo.vendor.toString() === req.params.id
    );
    
    return {
      ...order.toObject(),
      items: order.items.filter(item => 
        item.vendor.toString() === req.params.id
      ),
      vendorOrder
    };
  });
  
  res.json({
    success: true,
    data: vendorOrders
  });
}));

module.exports = router; 