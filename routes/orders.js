const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { protect, authorize, isCustomer, isVendor } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// Create new order
router.post('/', protect, isCustomer, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.name').trim().notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Shipping phone is required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Shipping street is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('Shipping city is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('Shipping state is required'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('Shipping zip code is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Shipping country is required'),
  body('paymentInfo.id').trim().notEmpty().withMessage('Payment ID is required'),
  body('paymentInfo.method').isIn(['stripe', 'paypal', 'cod', 'bank_transfer']).withMessage('Invalid payment method')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { items, shippingAddress, paymentInfo } = req.body;

  let itemsPrice = 0;
  const orderItems = [];
  const vendorOrders = {};

  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product ${item.product} not found`
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: `Product ${product.name} is not available`
      });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.name}`
      });
    }

    const itemTotal = product.price * item.quantity;
    itemsPrice += itemTotal;

    const orderItem = {
      product: product._id,
      vendor: product.vendor,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      discount: product.discount || 0,
      totalPrice: itemTotal,
      image: product.images[0]?.url || ''
    };

    orderItems.push(orderItem);

    const vendorId = product.vendor.toString();
    if (!vendorOrders[vendorId]) {
      vendorOrders[vendorId] = {
        vendor: product.vendor,
        items: [],
        status: 'pending'
      };
    }
    vendorOrders[vendorId].items.push(orderItem);
  }

  const taxPrice = itemsPrice * 0.1;
  const shippingPrice = 10;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentInfo: {
      ...paymentInfo,
      status: 'completed'
    },
    paymentStatus: 'completed',
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    vendorOrders: Object.values(vendorOrders),
    paidAt: new Date()
  });

  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }

  // Emit real-time event for new order
  const io = req.app.get('io');
  if (io) {
    io.emit('orderCreated', order); // You can filter/target by role or vendor if needed
  }

  res.status(201).json({
    success: true,
    data: order
  });
}));

// Get user orders
router.get('/my-orders', protect, isCustomer, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  
  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  const orders = await Order.find(filter)
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

// Get single order
router.get('/my-orders/:id', protect, isCustomer, asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  })
    .populate('items.product', 'name images description')
    .populate('items.vendor', 'name email')
    .populate('vendorOrders.vendor', 'name email');

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

// Get vendor orders
router.get('/vendor/orders', protect, isVendor, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { 'vendorOrders.vendor': req.user._id };
  
  if (req.query.status) {
    filter['vendorOrders.status'] = req.query.status;
  }

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const vendorOrders = orders.map(order => {
    const vendorOrder = order.vendorOrders.find(vo => 
      vo.vendor.toString() === req.user._id.toString()
    );
    
    return {
      ...order.toObject(),
      items: order.items.filter(item => 
        item.vendor.toString() === req.user._id.toString()
      ),
      vendorOrder
    };
  });

  const total = await Order.countDocuments(filter);

  res.json({
    success: true,
    data: vendorOrders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Update vendor order status
router.put('/vendor/orders/:orderId/status', protect, isVendor, [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('trackingNumber').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { status, trackingNumber } = req.body;

  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const vendorOrder = order.vendorOrders.find(vo => 
    vo.vendor.toString() === req.user._id.toString()
  );

  if (!vendorOrder) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this order'
    });
  }

  vendorOrder.status = status;
  if (trackingNumber) {
    vendorOrder.trackingNumber = trackingNumber;
  }

  if (status === 'shipped') {
    vendorOrder.shippedAt = new Date();
  } else if (status === 'delivered') {
    vendorOrder.deliveredAt = new Date();
  }

  await order.save();

  res.json({
    success: true,
    data: order
  });
}));

// Cancel order
router.put('/my-orders/:id/cancel', protect, isCustomer, asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.orderStatus !== 'pending' && order.orderStatus !== 'processing') {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  await order.save();

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }

  res.json({
    success: true,
    data: order
  });
}));

// Get vendor stats
router.get('/vendor/stats', protect, isVendor, asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const monthlyOrders = await Order.aggregate([
    {
      $match: {
        'vendorOrders.vendor': req.user._id,
        createdAt: { $gte: startOfMonth }
      }
    },
    {
      $unwind: '$vendorOrders'
    },
    {
      $match: {
        'vendorOrders.vendor': req.user._id
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

  const yearlyOrders = await Order.aggregate([
    {
      $match: {
        'vendorOrders.vendor': req.user._id,
        createdAt: { $gte: startOfYear }
      }
    },
    {
      $unwind: '$vendorOrders'
    },
    {
      $match: {
        'vendorOrders.vendor': req.user._id
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

  const statusBreakdown = await Order.aggregate([
    {
      $match: {
        'vendorOrders.vendor': req.user._id
      }
    },
    {
      $unwind: '$vendorOrders'
    },
    {
      $match: {
        'vendorOrders.vendor': req.user._id
      }
    },
    {
      $group: {
        _id: '$vendorOrders.status',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    monthly: monthlyOrders[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
    yearly: yearlyOrders[0] || { totalOrders: 0, totalRevenue: 0 },
    statusBreakdown: statusBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router; 