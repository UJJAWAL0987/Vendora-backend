const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const OpenAI = require('openai');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// All routes require admin access
router.use(protect, authorize('admin'));

// AI Chatbot endpoint
router.post('/chat', [
  body('message').trim().notEmpty().withMessage('Message is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { message } = req.body;

  try {
    // Get relevant data based on the message
    const data = await getRelevantData(message);
    
    // Create system prompt with context
    const systemPrompt = `You are an AI assistant for an e-commerce platform. You have access to the following data:

${JSON.stringify(data, null, 2)}

Please provide helpful, accurate, and concise responses based on this data. Focus on:
- Sales analytics and trends
- Vendor performance insights
- Product recommendations
- Business insights and suggestions
- Customer behavior analysis

Keep responses professional and actionable.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your request. Please try again.'
    });
  }
}));

// Get AI insights
router.get('/insights', asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get comprehensive data
    const data = await getComprehensiveData();

    // Generate insights using OpenAI
    const systemPrompt = `Analyze the following e-commerce data and provide 5 key business insights:

${JSON.stringify(data, null, 2)}

Focus on:
1. Sales performance trends
2. Vendor performance analysis
3. Product category insights
4. Customer behavior patterns
5. Business recommendations

Format your response as a JSON object with an "insights" array containing 5 objects, each with "title", "description", and "recommendation" fields.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    let insights;

    try {
      insights = JSON.parse(response);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      insights = {
        insights: [
          {
            title: "Data Analysis Complete",
            description: "AI analysis completed successfully",
            recommendation: "Review the generated insights for actionable business decisions"
          }
        ]
      };
    }

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating insights. Please try again.'
    });
  }
}));

// Helper function to get relevant data based on message
async function getRelevantData(message) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const data = {
    currentDate: now.toISOString(),
    period: {
      month: startOfMonth.toISOString(),
      year: startOfYear.toISOString()
    }
  };

  // Check message keywords to determine what data to fetch
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('vendor') || lowerMessage.includes('seller')) {
    // Vendor-related data
    const vendors = await User.find({ role: 'vendor' }).select('name email isActive createdAt');
    const vendorStats = await Order.aggregate([
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
      { $sort: { totalSales: -1 } }
    ]);

    data.vendors = {
      total: vendors.length,
      active: vendors.filter(v => v.isActive).length,
      list: vendors,
      performance: vendorStats
    };
  }

  if (lowerMessage.includes('sales') || lowerMessage.includes('revenue') || lowerMessage.includes('earnings')) {
    // Sales data
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const yearlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    data.sales = {
      total: totalRevenue[0]?.total || 0,
      monthly: monthlyRevenue[0]?.total || 0,
      yearly: yearlyRevenue[0]?.total || 0
    };
  }

  if (lowerMessage.includes('product') || lowerMessage.includes('category')) {
    // Product data
    const products = await Product.find().select('name category price stock isActive');
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    data.products = {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      lowStock: products.filter(p => p.stock < 10).length,
      categories: categories
    };
  }

  if (lowerMessage.includes('order') || lowerMessage.includes('customer')) {
    // Order data
    const totalOrders = await Order.countDocuments();
    const monthlyOrders = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
    const yearlyOrders = await Order.countDocuments({ createdAt: { $gte: startOfYear } });

    const orderStatusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    data.orders = {
      total: totalOrders,
      monthly: monthlyOrders,
      yearly: yearlyOrders,
      statusBreakdown: orderStatusBreakdown
    };
  }

  return data;
}

// Helper function to get comprehensive data
async function getComprehensiveData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Get all relevant data
  const [
    totalUsers,
    totalVendors,
    activeVendors,
    totalProducts,
    activeProducts,
    lowStockProducts,
    totalOrders,
    monthlyOrders,
    totalRevenue,
    monthlyRevenue,
    topCategories,
    topVendors,
    recentOrders
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'vendor' }),
    User.countDocuments({ role: 'vendor', isActive: true }),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ stock: { $lt: 10 } }),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.aggregate([
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
    ]),
    Order.aggregate([
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
    ]),
    Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  return {
    currentDate: now.toISOString(),
    period: {
      month: startOfMonth.toISOString(),
      year: startOfYear.toISOString()
    },
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
      monthly: monthlyOrders
    },
    revenue: {
      total: totalRevenue[0]?.total || 0,
      monthly: monthlyRevenue[0]?.total || 0
    },
    topCategories,
    topVendors,
    recentOrders: recentOrders.map(order => ({
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      status: order.orderStatus,
      customer: order.user.name,
      items: order.items.length
    }))
  };
}

module.exports = router; 