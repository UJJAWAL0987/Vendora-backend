# 🛍️ Vendora - Dynamic Multi-Vendor E-commerce + Admin AI Assistant

A comprehensive e-commerce platform built with the MERN stack, featuring multi-vendor support, AI-powered admin assistant, and modern UI/UX.

## 🏗️ Architecture

This project is split into two separate repositories for better maintainability and deployment:

- **[Vendora Frontend](https://github.com/UJJAWAL0987/Vendora-frontend)** - React.js client application
- **[Vendora Backend](https://github.com/UJJAWAL0987/Vendora-backend)** - Node.js/Express.js server API

## ✨ Features

### 🎯 Core E-commerce Features
- **Multi-vendor marketplace** - Vendors can list and manage their products
- **Advanced product catalog** - Search, filter, and browse products
- **Shopping cart & checkout** - Seamless purchasing experience
- **Order management** - Track orders from placement to delivery
- **User profiles** - Personalized user experience

### 👨‍💼 Admin Panel
- **Dashboard analytics** - Real-time sales and performance metrics
- **User management** - Manage customers, vendors, and permissions
- **Product moderation** - Approve/reject vendor products
- **Order oversight** - Monitor and manage all orders
- **AI Assistant** - OpenAI-powered admin support

### 🏪 Vendor Portal
- **Product management** - Add, edit, and manage products
- **Order processing** - Handle incoming orders
- **Sales analytics** - Track performance and revenue
- **Profile management** - Update store information

### 🎨 Modern UI/UX
- **Responsive design** - Works on all devices
- **Dark/Light mode** - User preference support
- **Real-time updates** - Socket.IO integration
- **Loading states** - Smooth user experience

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Redux Toolkit** - State management
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Socket.IO** - Real-time features
- **OpenAI API** - AI assistant integration
- **Multer** - File uploads
- **Bcrypt** - Password hashing

## 📁 Project Structure

```
Dynamic Multi-Vendor E-commerce + Admin AI Assistant/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # State management
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Backend Node.js application
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middlewares/      # Custom middlewares
│   ├── utils/            # Utility functions
│   └── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Git

### Backend Setup
```bash
# Clone the backend repository
git clone https://github.com/UJJAWAL0987/Vendora-backend.git
cd Vendora-backend

# Install dependencies
npm install

# Create .env file
cp env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Clone the frontend repository
git clone https://github.com/UJJAWAL0987/Vendora-frontend.git
cd Vendora-frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
OPENAI_API_KEY=your_openai_api_key
ADMIN_EMAIL=admin@ecommerce.com
ADMIN_PASSWORD=admin123
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 👥 User Roles

### Customer
- Browse and search products
- Add items to cart
- Place orders
- Track order status
- Manage profile

### Vendor
- List and manage products
- Process orders
- View sales analytics
- Manage store profile

### Admin
- Oversee all operations
- Manage users and vendors
- Moderate products
- View platform analytics
- Use AI assistant

## 🔐 Authentication

The application uses JWT-based authentication with role-based access control:

- **Customer routes** - Basic e-commerce functionality
- **Vendor routes** - Product and order management
- **Admin routes** - Platform administration

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (vendor)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `GET /api/admin/vendors` - Get all vendors
- `PUT /api/admin/users/:id/status` - Update user status

## 🤖 AI Assistant

The admin panel includes an AI assistant powered by OpenAI that can help with:
- Data analysis and insights
- Customer support suggestions
- Inventory management recommendations
- Sales forecasting
- Platform optimization tips

## 🚀 Deployment

### Backend Deployment
- Deploy to platforms like Heroku, Railway, or DigitalOcean
- Set up MongoDB Atlas for database
- Configure environment variables
- Set up CI/CD pipeline

### Frontend Deployment
- Deploy to Vercel, Netlify, or similar platforms
- Configure build settings
- Set up environment variables
- Enable automatic deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Ujjawal Kumar**
- GitHub: [@UJJAWAL0987](https://github.com/UJJAWAL0987)

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Tailwind CSS for the utility-first approach
- MongoDB for the flexible database
- OpenAI for the AI capabilities
- All contributors and supporters

---

⭐ **Star this repository if you find it helpful!** 
