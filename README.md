# ShopHub — E-Commerce Platform

A full-stack e-commerce application built with **React** (Vite) and **Node.js** (Express + MongoDB).

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Tran-Duc-An/ShopHub.git
cd ShopHub
```


### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```
JWT_SECRET=your_jwt_secret_here
MONGO_URI=<ask the project owner for the MongoDB connection string>
GROQ_API_KEY=<your_groq_api_key>
```

### 3. Start the backend

```bash
npm start
```

Server runs at `http://localhost:3000`.

### 4. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---


## Features
### AI Gift Assistant (NEW!)
- Personalized AI-powered gift recommendations for any occasion
- Chat with the assistant to get tailored gift ideas for your loved ones
- Select a saved profile or describe the recipient for better suggestions
- AI only recommends products available in your store
- Feedback system: rate and comment on AI suggestions to improve results

### Authentication
- **Sign up** as a Customer or Seller
- **Log in** with email and password
- JWT-based authentication

### Products (Public)
- Browse products by **category** on the homepage
- **Search** products by keyword
- **Filter** by brand, category, price range, and rating
- **Sort** by price, rating, or newest
- View **product details** with images, description, price, and stock info
- Paginated product listing

### Shopping Cart (Requires Login)
- Add products to cart with quantity
- Update item quantity
- Remove individual items or clear entire cart
- View cart total

### Orders (Requires Login)
- Place an order from the cart (auto stock check)
- View all past orders with status
- View order details with item breakdown
- Cancel pending orders (stock is restored)

### Seller Dashboard (Seller Role Only)
- Create new products with image upload (drag & drop)
- Edit existing products
- Delete products
- View all your listed products

### User Profile
- View profile info (name, email, role, member since)
- Quick links to orders, cart, and seller dashboard

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Log in |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (with search, filter, sort, pagination) |
| GET | `/api/products/categories` | Get categories with sample products |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/seller/:sellerId` | Public seller page |
| GET | `/api/products/seller/me` | Seller's own products (auth + seller) |
| POST | `/api/products` | Create product (auth + seller) |
| PUT | `/api/products/:id` | Update product (auth + seller, owner only) |
| DELETE | `/api/products/:id` | Delete product (auth + seller, owner only) |

### Cart (All require auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:cartItemId` | Update item quantity |
| DELETE | `/api/cart/:cartItemId` | Remove item |
| DELETE | `/api/cart` | Clear cart |

### Orders (All require auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id/cancel` | Cancel pending order |

### Users (Requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |


### Upload (Auth + Seller)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload product image |

### AI Chat & Feedback (Requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai-chat` | Chat with AI assistant |
| POST | `/api/ai-chat/suggest` | Get AI gift suggestions for a profile & occasion |
| GET | `/api/ai-chat/feedback` | Get feedback for AI suggestions |
| POST | `/api/ai-chat/feedback` | Submit feedback on AI suggestions |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| File Upload | Multer |
| AI | Groq API (Llama 3), Custom Prompt Engineering |

---

## Screenshots

![AI Assistant Chat](./screenshots/ai-assistant-demo.png)

---

## License

MIT
