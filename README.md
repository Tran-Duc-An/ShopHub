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
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/shophub?retryWrites=true&w=majority
```

Replace `<username>`, `<password>`, and `<cluster>` with your MongoDB Atlas credentials.

### 3. Seed the database (optional)

This loads ~4,000 sample products from the CSV dataset into MongoDB:

```bash
node seed.js
```

### 4. Start the backend

```bash
npm start
```

Server runs at `http://localhost:3000`.

### 5. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Features

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

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| File Upload | Multer |
