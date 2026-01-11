# Node.js Technical Assessment

## Features
- User authentication with JWT
- Role-based access (Admin & Customer)
- Inventory management with stock protection
- Order lifecycle with payment simulation
- Atomic stock updates and rollback
- Pagination and filtering
- Rate limiting and caching
- Centralized error handling

## Tech Stack
- Node.js
- Express.js
- MongoDB
- JWT
- bcrypt

## Setup
```bash
npm install
npm run dev

rename .env.sample to .env

## Environment Variables
PORT
MONGO_URI
JWT_SECRET
JWT_EXPIRES_IN

## API Highlights

POST /api/auth/register
POST /api/auth/login
GET /api/products
POST /api/orders
PUT /api/orders/:orderId/cancel

## API Testing
Postman collection included