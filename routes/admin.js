const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const router = express.Router();

// All routes require admin access
router.use(protect, authorize('admin'));

// Get admin dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // User stats
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalVendors = await User.countDocuments({ role: 'vendor' });
  const activeVendors = await User.countDocuments({ role: 'vendor', isActive: true });
  
  // Product stats
  const totalProducts = await Product.countDocuments();
  const activeProducts = await Product.countDocuments({ isActive: true });
  const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });
  
  // Order stats
  const totalOrders = await Order.countDocuments();
  const monthlyOrders = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
  const lastMonthOrders = await Order.countDocuments({ createdAt: { $gte: lastMonth, $lt: startOfMonth } });
  
  // Revenue stats
  const totalRevenue = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  
  const monthlyRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  
  const lastMonthRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: lastMonth, $lt: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  
  // Top selling categories
  const topCategories = await Order.aggregate([
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        totalSales: { $sum: '$items.totalPrice' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalSales: -1 } },
    { $limit: 5 }
  ]);
  
  // Top vendors by sales
  const topVendors = await Order.aggregate([
    { $unwind: '$vendorOrders' },
    {
      $group: {
        _id: '$vendorOrders.vendor',
        totalSales: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'vendor'
      }
    },
    { $unwind: '$vendor' },
    { $sort: { totalSales: -1 } },
    { $limit: 5 }
  ]);
  
  // Recent orders
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .limit(10);
  
  const stats = {
    users: {
      total: totalUsers,
      vendors: totalVendors,
      activeVendors
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      lowStock: lowStockProducts
    },
    orders: {
      total: totalOrders,
      monthly: monthlyOrders,
      lastMonth: lastMonthOrders,
      growth: lastMonthOrders > 0 ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(2) : 0
    },
    revenue: {
      total: totalRevenue[0]?.total || 0,
      monthly: monthlyRevenue[0]?.total || 0,
      lastMonth: lastMonthRevenue[0]?.total || 0,
      growth: lastMonthRevenue[0]?.total > 0 ? 
        ((monthlyRevenue[0]?.total - lastMonthRevenue[0]?.total) / lastMonthRevenue[0]?.total * 100).toFixed(2) : 0
    },
    topCategories,
    topVendors,
    recentOrders
  };
  
  res.json({
    success: true,
    data: stats
  });
}));

// Get all products (admin view)
router.get('/products', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const filter = {};
  if (req.query.status) {
    filter.isActive = req.query.status === 'active';
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.vendor) {
    filter.vendor = req.query.vendor;
  }
  
  const products = await Product.find(filter)
    .populate('vendor', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Product.countDocuments(filter);
  
  res.json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Update product status (admin only)
router.put('/products/:id/status', asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true }
  ).populate('vendor', 'name email');
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
}));

// Get all orders (admin view)
router.get('/orders', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const filter = {};
  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }
  
  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .populate('items.vendor', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Order.countDocuments(filter);
  
  res.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Update order status (admin only)
router.put('/orders/:id/status', asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus },
    { new: true }
  )
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .populate('items.vendor', 'name');
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  res.json({
    success: true,
    data: order
  });
}));

// Get order details (admin view)
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .populate('items.vendor', 'name');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, data: order });
}));

// Get analytics data
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const now = new Date();
  
  let startDate;
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  // Sales by day
  const salesByDay = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Category performance
  const categoryPerformance = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        sales: { $sum: '$items.totalPrice' },
        orders: { $sum: 1 },
        items: { $sum: '$items.quantity' }
      }
    },
    { $sort: { sales: -1 } }
  ]);
  
  // Vendor performance
  const vendorPerformance = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: '$vendorOrders' },
    {
      $group: {
        _id: '$vendorOrders.vendor',
        sales: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'vendor'
      }
    },
    { $unwind: '$vendor' },
    { $sort: { sales: -1 } }
  ]);
  
  const analytics = {
    period,
    startDate,
    endDate: now,
    salesByDay,
    categoryPerformance,
    vendorPerformance
  };
  
  res.json({
    success: true,
    data: analytics
  });
}));

module.exports = router; 