const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
require('dotenv').config();

// Sample product data
const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals.",
    price: 89.99,
    category: "Electronics",
    images: [
      {
        public_id: "headphones_1",
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
      },
      {
        public_id: "headphones_2",
        url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500"
      }
    ],
    stock: 45,
    ratings: {
      average: 4.5,
      count: 128
    },
    tags: ["Wireless", "Noise Cancellation", "Bluetooth", "Premium"],
    specifications: [
      { name: "Battery Life", value: "30 hours" },
      { name: "Connectivity", value: "Bluetooth 5.0" },
      { name: "Weight", value: "250g" },
      { name: "Warranty", value: "2 years" }
    ]
  },
  {
    name: "Smart Fitness Watch",
    description: "Advanced fitness tracker with heart rate monitoring, GPS, sleep tracking, and 7-day battery life. Track your workouts and health metrics.",
    price: 199.99,
    category: "Electronics",
    images: [
      {
        public_id: "fitness_watch_1",
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
      },
      {
        public_id: "fitness_watch_2",
        url: "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500"
      }
    ],
    stock: 32,
    ratings: {
      average: 4.3,
      count: 89
    },
    tags: ["Fitness", "Heart Rate", "GPS", "Sleep Tracking"],
    specifications: [
      { name: "Battery Life", value: "7 days" },
      { name: "Water Resistance", value: "5ATM" },
      { name: "Display", value: "1.4 inch AMOLED" },
      { name: "Compatibility", value: "iOS & Android" }
    ]
  },
  {
    name: "Organic Cotton T-Shirt",
    description: "Comfortable and sustainable organic cotton t-shirt. Available in multiple colors and sizes. Perfect for everyday wear.",
    price: 24.99,
    category: "Clothing",
    images: [
      {
        public_id: "tshirt_1",
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
      },
      {
        public_id: "tshirt_2",
        url: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500"
      }
    ],
    stock: 120,
    ratings: {
      average: 4.7,
      count: 256
    },
    tags: ["Organic", "Cotton", "Sustainable", "Comfortable"],
    specifications: [
      { name: "Material", value: "100% Organic Cotton" },
      { name: "Care", value: "Machine Washable" },
      { name: "Fit", value: "Regular" },
      { name: "Origin", value: "Made in USA" }
    ]
  },
  {
    name: "Stainless Steel Water Bottle",
    description: "Eco-friendly stainless steel water bottle with double-wall insulation. Keeps drinks cold for 24 hours or hot for 12 hours.",
    price: 34.99,
    category: "Home & Garden",
    images: [
      {
        public_id: "water_bottle_1",
        url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500"
      },
      {
        public_id: "water_bottle_2",
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"
      }
    ],
    stock: 78,
    ratings: {
      average: 4.6,
      count: 167
    },
    tags: ["Eco-friendly", "Insulated", "BPA Free", "Portable"],
    specifications: [
      { name: "Capacity", value: "32 oz" },
      { name: "Material", value: "Stainless Steel" },
      { name: "Insulation", value: "Double-wall" },
      { name: "BPA Free", value: "Yes" }
    ]
  },
  {
    name: "Wireless Charging Pad",
    description: "Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator and overcharge protection.",
    price: 49.99,
    category: "Electronics",
    images: [
      {
        public_id: "charging_pad_1",
        url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500"
      },
      {
        public_id: "charging_pad_2",
        url: "https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=500"
      }
    ],
    stock: 56,
    ratings: {
      average: 4.4,
      count: 94
    },
    tags: ["Wireless Charging", "Qi Compatible", "Fast Charging", "LED Indicator"],
    specifications: [
      { name: "Output", value: "10W" },
      { name: "Compatibility", value: "Qi Standard" },
      { name: "Material", value: "Silicone & Plastic" },
      { name: "Warranty", value: "1 year" }
    ]
  },
  {
    name: "Yoga Mat Premium",
    description: "Non-slip yoga mat made from eco-friendly materials. Perfect thickness for comfort and stability during yoga practice.",
    price: 39.99,
    category: "Sports",
    images: [
      {
        public_id: "yoga_mat_1",
        url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"
      },
      {
        public_id: "yoga_mat_2",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500"
      }
    ],
    stock: 89,
    ratings: {
      average: 4.8,
      count: 203
    },
    tags: ["Yoga", "Non-slip", "Eco-friendly", "Premium"],
    specifications: [
      { name: "Thickness", value: "6mm" },
      { name: "Material", value: "Eco-friendly TPE" },
      { name: "Size", value: "72\" x 24\"" },
      { name: "Weight", value: "2.5 lbs" }
    ]
  },
  {
    name: "Ceramic Coffee Mug Set",
    description: "Beautiful handcrafted ceramic coffee mug set. Microwave and dishwasher safe. Perfect for home or office use.",
    price: 29.99,
    category: "Home & Garden",
    images: [
      {
        public_id: "coffee_mugs_1",
        url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500"
      },
      {
        public_id: "coffee_mugs_2",
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500"
      }
    ],
    stock: 67,
    ratings: {
      average: 4.5,
      count: 145
    },
    tags: ["Ceramic", "Handcrafted", "Microwave Safe", "Set of 4"],
    specifications: [
      { name: "Capacity", value: "12 oz each" },
      { name: "Material", value: "Ceramic" },
      { name: "Set Size", value: "4 mugs" },
      { name: "Care", value: "Microwave & Dishwasher Safe" }
    ]
  },
  {
    name: "Portable Bluetooth Speaker",
    description: "Waterproof portable speaker with 360-degree sound and 20-hour battery life. Perfect for outdoor activities and parties.",
    price: 79.99,
    category: "Electronics",
    images: [
      {
        public_id: "bluetooth_speaker_1",
        url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"
      },
      {
        public_id: "bluetooth_speaker_2",
        url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500"
      }
    ],
    stock: 43,
    ratings: {
      average: 4.2,
      count: 112
    },
    tags: ["Portable", "Waterproof", "360° Sound", "Long Battery"],
    specifications: [
      { name: "Battery Life", value: "20 hours" },
      { name: "Water Resistance", value: "IPX7" },
      { name: "Connectivity", value: "Bluetooth 5.0" },
      { name: "Weight", value: "1.2 lbs" }
    ]
  },
  {
    name: "Organic Face Moisturizer",
    description: "Natural and organic face moisturizer with hyaluronic acid and vitamin E. Suitable for all skin types.",
    price: 19.99,
    category: "Beauty",
    images: [
      {
        public_id: "moisturizer_1",
        url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500"
      },
      {
        public_id: "moisturizer_2",
        url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500"
      }
    ],
    stock: 95,
    ratings: {
      average: 4.6,
      count: 178
    },
    tags: ["Organic", "Hyaluronic Acid", "Vitamin E", "All Skin Types"],
    specifications: [
      { name: "Size", value: "50ml" },
      { name: "Ingredients", value: "100% Natural" },
      { name: "Skin Type", value: "All Types" },
      { name: "Cruelty Free", value: "Yes" }
    ]
  },
  {
    name: "Smart LED Light Bulb",
    description: "WiFi-enabled smart LED bulb with 16 million colors and voice control. Compatible with Alexa and Google Home.",
    price: 24.99,
    category: "Home & Garden",
    images: [
      {
        public_id: "smart_bulb_1",
        url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500"
      },
      {
        public_id: "smart_bulb_2",
        url: "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500"
      }
    ],
    stock: 71,
    ratings: {
      average: 4.3,
      count: 89
    },
    tags: ["Smart Home", "WiFi", "Voice Control", "16M Colors"],
    specifications: [
      { name: "Wattage", value: "9W" },
      { name: "Lumens", value: "800lm" },
      { name: "Compatibility", value: "Alexa & Google Home" },
      { name: "Lifespan", value: "25,000 hours" }
    ]
  },
  {
    name: "Wireless Gaming Mouse",
    description: "High-precision wireless gaming mouse with RGB lighting and programmable buttons. Perfect for gaming and productivity.",
    price: 69.99,
    category: "Electronics",
    images: [
      {
        public_id: "gaming_mouse_1",
        url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500"
      },
      {
        public_id: "gaming_mouse_2",
        url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500"
      }
    ],
    stock: 38,
    ratings: {
      average: 4.7,
      count: 156
    },
    tags: ["Gaming", "Wireless", "RGB", "High DPI"],
    specifications: [
      { name: "DPI", value: "25,600" },
      { name: "Battery Life", value: "70 hours" },
      { name: "Buttons", value: "7 programmable" },
      { name: "Weight", value: "95g" }
    ]
  },
  {
    name: "Bamboo Cutting Board",
    description: "Eco-friendly bamboo cutting board with juice groove and non-slip feet. Perfect for food preparation and serving.",
    price: 44.99,
    category: "Home & Garden",
    images: [
      {
        public_id: "cutting_board_1",
        url: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500"
      },
      {
        public_id: "cutting_board_2",
        url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500"
      }
    ],
    stock: 52,
    ratings: {
      average: 4.8,
      count: 234
    },
    tags: ["Bamboo", "Eco-friendly", "Juice Groove", "Non-slip"],
    specifications: [
      { name: "Size", value: "18\" x 12\"" },
      { name: "Material", value: "Bamboo" },
      { name: "Thickness", value: "1 inch" },
      { name: "Care", value: "Hand wash only" }
    ]
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Add sample products
const addSampleProducts = async () => {
  try {
    // Get a vendor user to assign products to
    const vendor = await User.findOne({ role: 'vendor' });
    
    if (!vendor) {
      console.log('No vendor found. Creating a sample vendor...');
      const sampleVendor = new User({
        name: 'Sample Vendor',
        email: 'vendor@sample.com',
        password: 'vendor123',
        role: 'vendor',
        phone: '+1234567890',
        address: {
          street: '123 Vendor St',
          city: 'Sample City',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        }
      });
      await sampleVendor.save();
      console.log('Sample vendor created');
    }

    const vendorUser = await User.findOne({ role: 'vendor' });
    
    // Clear existing products (optional - comment out if you want to keep existing)
    // await Product.deleteMany({});
    
    // Add sample products
    const productsToAdd = sampleProducts.map(product => ({
      ...product,
      vendor: vendorUser._id,
      isActive: true
    }));

    const addedProducts = await Product.insertMany(productsToAdd);
    
    console.log(`✅ Successfully added ${addedProducts.length} sample products!`);
    console.log('\n📋 Sample Products Added:');
    addedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price}`);
    });
    
    console.log('\n🎉 Your e-commerce platform now has sample products to test with!');
    console.log('🌐 Visit http://localhost:3000 to see the products in action.');
    
  } catch (error) {
    console.error('Error adding sample products:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await addSampleProducts();
};

runScript(); 