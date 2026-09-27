# 🛍️ SheryCart — Step-by-Step Full-Stack E-Commerce Project Guide

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Welcome to **SheryCart**, a production-grade full-stack e-commerce web platform engineered with a secure Node.js/Express REST API and a high-performance, responsive React frontend.

This document details the **entire project architecture, data flow, security model, and implementation step-by-step**, designed to serve as both the complete project documentation and a review/viva preparation guide.

---

## 📑 Step-by-Step Table of Contents

- [Step 1: Project Overview & System Architecture](#step-1-project-overview--system-architecture)
- [Step 2: Technology Stack](#step-2-technology-stack)
- [Step 3: Project Folder Structure](#step-3-project-folder-structure)
- [Step 4: Database Design & Data Models](#step-4-database-design--data-models)
- [Step 5: Authentication & Security Implementation](#step-5-authentication--security-implementation)
- [Step 6: Product CRUD & Role-Based Access Control (RBAC)](#step-6-product-crud--role-based-access-control-rbac)
- [Step 7: Input Validation with express-validator](#step-7-input-validation-with-express-validator)
- [Step 8: Frontend Architecture & UI Features](#step-8-frontend-architecture--ui-features)
- [Step 9: Step-by-Step Installation & Local Setup](#step-9-step-by-step-installation--local-setup)
- [Step 10: Environment Configuration Reference](#step-10-environment-configuration-reference)
- [Step 11: Comprehensive API Reference](#step-11-comprehensive-api-reference)
- [Step 12: Deployment Guide](#step-12-deployment-guide)
- [Step 13: Viva & Code Review Preparation](#step-13-viva--code-review-preparation)

---

## Step 1: Project Overview & System Architecture

SheryCart connects customers and merchants on a single unified platform with strict role scoping and dual-token JWT security.

### High-Level Authentication & Request Lifecycle

```
[ React Client (Axios) ]
          │
          ├── 1. POST /api/auth/login { email, password }
          ▼
[ Express Server ] ──────────────▶ [ MongoDB Database ]
          │                           (Verify bcrypt hash)
          ├─────▶ Generates Access Token (15 min)
          ├─────▶ Generates Refresh Token (7 days) & saves token into User document
          │
          ├── 2. Response:
          │      • Body:   { accessToken, user: { name, email, role } }
          │      • Cookie: Set-Cookie: refreshToken=...; HttpOnly; SameSite=Strict
          ▼
[ Browser Application ]
          │
          ├── 3. Subsequent API calls include Header:
          │      Authorization: Bearer <accessToken>
          ▼
[ authenticate Middleware ] ─────▶ Verifies Bearer JWT signature
          │
          │ (When Access Token expires after 15 min ──▶ 401 Unauthorized)
          ▼
[ Axios Response Interceptor ]
          │
          ├── 4. Intercepts 401, pauses outgoing requests
          ├── 5. POST /api/auth/refresh-token (Browser sends httpOnly cookie automatically)
          ▼
[ Express Server ] ──────────────▶ Validates cookie token against MongoDB record
          │
          ├─────▶ Rotates tokens, issues new Access Token + fresh Refresh Token in DB
          ▼
[ Axios Interceptor ] ───────────▶ Updates memory token & replays original failed request seamlessly!
```

---

## Step 2: Technology Stack

| Layer | Technology | Key Purpose |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js (v18+) | Non-blocking asynchronous JavaScript execution |
| **Web Framework** | Express.js (v4.21) | REST API routing, controllers, and middleware |
| **Database** | MongoDB & Mongoose (v8.18) | Document database & schema-based object modeling |
| **Security & Auth** | `jsonwebtoken` & `bcrypt` | Stateless access tokens & salt-hashed password security (10 rounds) |
| **Input Validation** | `express-validator` (v7.2) | Declarative payload, query, and parameter validation rules |
| **Cookie Parsing** | `cookie-parser` | Secure parsing of incoming `httpOnly` refresh token cookies |
| **Media Storage** | ImageKit SDK & Multer | Multi-part cloud storage and CDN delivery for product photos |
| **Frontend UI** | React 19 + Vite 8 | Ultra-fast component rendering and hot module reloading |
| **Styling** | Tailwind CSS v4 | Utility-first styling with modern responsive design |
| **Animations** | GSAP (GreenSock) | Smooth page entrances, card popups, and modal transitions |
| **HTTP Client** | Axios | Request/response interceptors with automated token refresh queue |

---

## Step 3: Project Folder Structure

```
SheryCart/
├── backend/
│   ├── src/
│   │   ├── app/
│   │   │   └── app.js                 # Express app setup, CORS, JSON parser, cookie parser
│   │   ├── config/
│   │   │   ├── config.js              # Environment variable loader
│   │   │   └── imagekit.config.js     # ImageKit SDK client configuration
│   │   ├── controllers/
│   │   │   ├── auth.controllers.js    # Register, login, refresh-token, me, logout
│   │   │   └── products.controller.js # Product CRUD operations & existence checks
│   │   ├── middleware.js/
│   │   │   ├── auth.middleware.js     # Bearer token verification & role authorization
│   │   │   └── multer.middleware.js   # Multi-part file upload handler
│   │   ├── models/
│   │   │   ├── user.model.js          # User schema with refreshToken persistence
│   │   │   └── product.model.js       # Product schema (title, price, stock, category)
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # /api/auth routes
│   │   │   └── products.routes.js     # /api/products routes
│   │   ├── utils/
│   │   │   └── auth.js                # JWT sign, verify, and cookie helper utilities
│   │   └── validators/
│   │       ├── auth.validator.js      # express-validator rules for auth payloads
│   │       └── product.validator.js   # express-validator rules for product bodies & params
│   ├── server.js                      # Database connection and server listener (port 3000)
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── assets/                    # Project logos, graphics, and background vectors
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Responsive navigation with logo, drawer, and profile menu
│   │   │   ├── HomePage.jsx           # Landing view with GSAP hero animations & highlights
│   │   │   ├── ProductPage.jsx        # Product catalog, category pills, search, and seller CRUD modal
│   │   │   ├── LoginPage.jsx          # User login form with animated card
│   │   │   ├── RegisterPage.jsx       # Registration with password confirmation & live validation
│   │   │   ├── ProfileModal.jsx       # Account details modal with role-based permission badges
│   │   │   └── AboutPage.jsx          # About the SheryCart marketplace
│   │   ├── config/
│   │   │   └── AxiosInstance.js       # Axios instance with 401 silent token refresh queue
│   │   ├── hooks/
│   │   │   ├── auth.hook.jsx          # Authentication context & hooks (useAuth, useLogin, useRegister)
│   │   │   └── product.hook.jsx       # Product API data fetching hooks
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx         # Main layout wrapper with Navbar & Outlet
│   │   │   └── AuthLayout.jsx         # Centered wrapper for auth forms
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx          # BrowserRouter definitions
│   │   │   ├── ProtectedRoute.jsx     # Client-side protected route guard
│   │   │   └── PublicRoute.jsx        # Public route redirect for logged-in users
│   │   ├── App.jsx                    # Root app component
│   │   ├── index.css                  # Tailwind CSS root import
│   │   └── main.jsx                   # React DOM entry point
│   ├── package.json
│   ├── vite.config.js                 # Vite configuration with /api proxy to localhost:3000
│   └── .env.example
│
├── .gitignore                         # Excludes node_modules, build outputs, and local .env files
└── README.md                          # Root project documentation
```

---

## Step 4: Database Design & Data Models

### 4.1 User Schema (`backend/src/models/user.model.js`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | `required: true`, `trim: true` | User's full name |
| `email` | `String` | `required: true`, `unique: true`, `lowercase: true` | Account email address |
| `password` | `String` | `required: true`, `minlength: 6` | Bcrypt salt-hashed password string |
| `mobile` | `String` | `required: true`, `unique: true` | 10-digit mobile contact number |
| `role` | `String` | `enum: ["user", "seller", "admin"]`, default: `"user"` | Role for authorization |
| `refreshToken` | `String` | `default: null` | Stored long-lived token for session revocation |
| `createdAt` | `Date` | Timestamp auto-generated | Registration timestamp |

### 4.2 Product Schema (`backend/src/models/product.model.js`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `title` | `String` | `required: true`, `trim: true` | Product title/name |
| `description` | `String` | `trim: true` | Detailed product specifications |
| `price` | `Number` | `required: true`, `min: 0` | Price in INR (₹) |
| `stock` | `Number` | `required: true`, `min: 0`, default: `0` | Available inventory quantity |
| `category` | `String` | `required: true` | Electronics, Clothing, Books, Beauty, etc. |
| `images` | `[String]` | Array of URLs | Cloud-hosted product image links |
| `createdBy` | `ObjectId` | `ref: "User"` | ID of the seller who created the listing |

---

## Step 5: Authentication & Security Implementation

### 5.1 Password Hashing with Bcrypt
- During registration, passwords are never stored in plaintext.
- The password string is passed through `bcrypt.hash(password, 10)`, using **10 salt rounds** to create a one-way secure hash.
- During login, `bcrypt.compare(candidatePassword, storedHash)` securely validates credentials.

### 5.2 Dual-Token JWT Strategy
1. **Access Token (Short-Lived: 15 minutes)**:
   - Generated with `ACCESS_TOKEN_SECRET`.
   - Delivered in the JSON response body.
   - Sent by the client in the HTTP header: `Authorization: Bearer <accessToken>`.
2. **Refresh Token (Long-Lived: 7 days)**:
   - Generated with `REFRESH_TOKEN_SECRET`.
   - Set as an `httpOnly: true`, `sameSite: "strict"`, `secure: process.env.NODE_ENV === "production"` cookie named `refreshToken`.
   - Stored in the MongoDB User record (`user.refreshToken`).
3. **Session Revocation (Logout)**:
   - Calling `POST /api/auth/logout` sets `user.refreshToken = null` in MongoDB and clears the browser cookie.
   - Any replayed refresh token is immediately rejected with a `403 Forbidden` status.

### 5.3 Step-by-Step Auth Workflow
- **Registration (`POST /api/auth/register`)**:
  - Validates name, email, password strength, matching `confirmPassword`, and 10-digit mobile number.
  - Checks if email or mobile is already in use; returns **`409 Conflict`** if duplicate.
  - Saves the new user with hashed password.
  - Returns status **`201 Created`** with user details **without passwords or tokens** (tokens are only issued on login).
- **Login (`POST /api/auth/login`)**:
  - Validates credentials.
  - Issues Access Token in body + Refresh Token in `httpOnly` cookie.
  - Returns `200 OK` with user profile.
- **Refresh Token (`POST /api/auth/refresh-token`)**:
  - Extracts `refreshToken` cookie.
  - Validates JWT signature and ensures it matches the value stored in the database.
  - Rotates both tokens and returns the fresh `accessToken`.
- **Get Profile (`GET /api/auth/me`)**:
  - Protected with `authenticate` middleware.
  - Returns current logged-in user profile.
- **Logout (`POST /api/auth/logout`)**:
  - Protected with `authenticate` middleware.
  - Wipes database token and expires the cookie.

---

## Step 6: Product CRUD & Role-Based Access Control (RBAC)

### 6.1 Access Levels

| Endpoint | Method | Access Level | Middleware |
| :--- | :--- | :--- | :--- |
| `/api/products` | `GET` | **Public** | `getProductsQueryValidator` |
| `/api/products/:id` | `GET` | **Public** | `productIdValidator` |
| `/api/products` | `POST` | **Protected (Seller/Admin)** | `authenticate`, `authorizeRole(["seller", "admin"])`, `createProductValidator` |
| `/api/products/:id` | `PUT` | **Protected (Seller/Admin)** | `authenticate`, `authorizeRole(["seller", "admin"])`, `productIdValidator`, `updateProductValidator` |
| `/api/products/:id` | `DELETE` | **Protected (Seller/Admin)** | `authenticate`, `authorizeRole(["seller", "admin"])`, `productIdValidator` |

### 6.2 Resource Existence Verification
Before performing any `PUT` (update) or `DELETE` (delete) operation, the controller executes:
```javascript
const product = await Product.findById(id);
if (!product) {
  return res.status(404).json({ success: false, message: "Product not found" });
}
```
This ensures clear `404 Not Found` responses rather than unhandled server errors.

---

## Step 7: Input Validation with express-validator

Validation rules are enforced across all three layers of incoming requests:

### 7.1 Request Bodies (`body(...)`)
- **`registerValidator`**:
  - `name`: Must not be empty.
  - `email`: Normalized to lowercase and checked for RFC email format.
  - `password`: Enforces minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 number.
  - `confirmPassword`: Custom validator checking `confirmPassword === req.body.password`.
  - `mobile`: Checked for exactly 10 digits (`/^[0-9]{10}$/`).
- **`createProductValidator`**:
  - `title`: Required, length between 3 and 120 characters.
  - `price`: Must be a positive number (`min: 0.01`).
  - `stock`: Must be an integer greater than or equal to 0.
  - `category`: Must match permissible catalog categories.

### 7.2 Query Parameters (`query(...)`)
- **`getProductsQueryValidator`**:
  - `category`: Optional string, trimmed and sanitized.
  - `search`: Optional string, trimmed to prevent regex injection attacks.

### 7.3 Route Parameters (`param(...)`)
- **`productIdValidator`**:
  - Enforces `param('id').isMongoId()` on all `:id` routes.
  - Malformed IDs (e.g., `/api/products/123`) fail immediately with `400 Bad Request` before reaching the database, avoiding MongoDB CastErrors.

### 7.4 Standardized Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    }
  ]
}
```

---

## Step 8: Frontend Architecture & UI Features

### 8.1 Axios Interceptor & Silent Token Refreshing (`AxiosInstance.js`)
- An Axios instance automatically attaches `Authorization: Bearer <accessToken>` to every outgoing request.
- When an access token expires (15 minutes), the server responds with `401 Unauthorized`.
- The Axios **response interceptor** intercepts this 401 error:
  1. Sets `isRefreshing = true` and queues any incoming requests in `pendingQueue`.
  2. Sends `POST /api/auth/refresh-token` to rotate the token.
  3. Updates the in-memory access token.
  4. Resolves and replays all queued requests seamlessly without interrupting the user.

### 8.2 Modern Animated UI
- **Navbar (`Navbar.jsx`)**:
  - Brand Logo: **`SheryCart`** with lime-500 accent text.
  - Responsive layout: Desktop navigation links + Collapsible Mobile Hamburger Menu.
  - User Profile Menu: Circular avatar with user initials, live online indicator dot, and dropdown.
- **Product Management (`ProductPage.jsx`)**:
  - Live search bar and horizontal scrollable category pills.
  - Role-gated controls: "Add New Product", "Edit", and "Delete" buttons appear strictly for sellers and admins.
  - Responsive modal dialogs with sticky headers/footers and image previews.
- **GSAP Animations**:
  - Staggered entrances for products, cards, and modal dialogs with `clearProps: "all"` to eliminate opacity trapping.

---

## Step 9: Step-by-Step Installation & Local Setup

### Step 9.1: Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **MongoDB**: Local MongoDB instance running on `localhost:27017` or a free [MongoDB Atlas](https://www.mongodb.com/) cluster URI.
- **Git**

### Step 9.2: Clone the Repository
```bash
git clone https://github.com/thakormahendra4-art/SheryCart.git
cd SheryCart
```

### Step 9.3: Setup & Run the Backend
```bash
# 1. Open the backend directory
cd backend

# 2. Install backend dependencies
npm install

# 3. Create your environment configuration file
copy .env.example .env    # On Windows
# cp .env.example .env     # On Linux / macOS

# 4. Start the backend development server
npm run dev
```
*Backend server will start on `http://localhost:3000`.*

### Step 9.4: Setup & Run the Frontend
```bash
# 1. Open a new terminal and navigate to the frontend directory
cd frontend

# 2. Install frontend dependencies
npm install

# 3. Start the Vite development server
npm run dev
```
*Frontend application will launch on `http://localhost:5173`.*

---

## Step 10: Environment Configuration Reference

### Backend (`backend/.env`)
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/authentication

# JWT Secrets (Use strong random strings)
ACCESS_TOKEN_SECRET=your_super_secret_jwt_access_key_12345
REFRESH_TOKEN_SECRET=your_super_secret_jwt_refresh_key_67890

# ImageKit Credentials (Optional for cloud product images)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

### Frontend (`frontend/.env`)
```env
# In development, leave blank to use the Vite proxy to http://localhost:3000
# In production, set to your hosted backend URL:
VITE_API_BASE_URL=
```

---

## Step 11: Comprehensive API Reference

Base URL: `http://localhost:3000/api`

### 11.1 Authentication Routes

#### `POST /api/auth/register` (Public)
- **Status Codes**: `201 Created`, `400 Bad Request`, `409 Conflict`.
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "mobile": "9876543210",
  "role": "user"
}
```
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "6745f1b2c45e12a9b3d8810a",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "mobile": "9876543210",
    "role": "user"
  }
}
```

#### `POST /api/auth/login` (Public)
- **Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`.
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123"
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6745f1b2c45e12a9b3d8810a",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```
*Sets `httpOnly` cookie: `refreshToken=...; SameSite=Strict; Max-Age=604800`*

#### `POST /api/auth/refresh-token` (Public / Cookie-based)
- **Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `GET /api/auth/me` (Protected)
- **Header**: `Authorization: Bearer <accessToken>`
- **Status Codes**: `200 OK`, `401 Unauthorized`.

#### `POST /api/auth/logout` (Protected)
- **Header**: `Authorization: Bearer <accessToken>`
- **Status Codes**: `200 OK`, `401 Unauthorized`.
- Clears the database refresh token and invalidates the cookie.

---

### 11.2 Product CRUD Routes

#### `GET /api/products` (Public)
- **Query Params**: `?category=Electronics&search=wireless`
- **Status Code**: `200 OK`

#### `GET /api/products/:id` (Public)
- **Route Param**: `:id` (24-character MongoDB ObjectId)
- **Status Codes**: `200 OK`, `400 Bad Request` (invalid ObjectId), `404 Not Found`.

#### `POST /api/products` (Protected - Seller/Admin)
- **Header**: `Authorization: Bearer <accessToken>`
- **Body**:
```json
{
  "title": "Mechanical RGB Keyboard",
  "description": "Tactile hot-swappable gaming keyboard",
  "price": 89.99,
  "stock": 50,
  "category": "Electronics"
}
```
- **Status Codes**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.

#### `PUT /api/products/:id` (Protected - Seller/Admin)
- **Header**: `Authorization: Bearer <accessToken>`
- **Status Codes**: `200 OK`, `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

#### `DELETE /api/products/:id` (Protected - Seller/Admin)
- **Header**: `Authorization: Bearer <accessToken>`
- **Status Codes**: `200 OK`, `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

---

## Step 12: Deployment Guide (Separate Frontend & Backend)

### Part 1: Cloud Database Setup (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create or log into your account.
2. Create a free shared cluster (**M0 Free Tier**).
3. **Database Access**: Under **Security > Database Access**, add a new database user with read/write privileges (note down the username and password).
4. **Network Access**: Under **Security > Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) so Render can connect to your database.
5. **Get Connection String**: Go to **Database > Connect > Drivers > Node.js**, copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sherycart?retryWrites=true&w=majority
   ```
   *(Replace `<username>`, `<password>`, and optionally replace the database name before `?` with `sherycart`)*.

---

### Part 2: Deploy Backend to Render ([render.com](https://render.com))
1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "feat: configure backend for cross-origin deployment"
   git push origin main
   ```
2. Log into [Render Dashboard](https://dashboard.render.com/) and click **New + > Web Service**.
3. Select **Build and deploy from a Git repository** and connect your `SheryCart` repository.
4. Configure the service settings:
   - **Name**: `sherycart-backend` (or your preferred name)
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend` *(CRITICAL: ensure this is set to `backend`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables secure cookies & production optimizations |
   | `PORT` | `3000` | Port for Express listener |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI |
   | `ACCESS_TOKEN_SECRET` | *(64-char random string)* | E.g. generate via `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `REFRESH_TOKEN_SECRET`| *(64-char random string)* | Distinct secret for refresh tokens |
   | `CLIENT_URL` | `https://your-frontend.vercel.app` | *Leave blank or set to `http://localhost:5173` initially; update after deploying frontend* |
   | `IMAGEKIT_PRIVATE_KEY` | *(optional)* | Only if using ImageKit uploads |
6. Click **Create Web Service**. Wait for the build and deployment to complete.
7. Once deployed, copy your backend URL (e.g., `https://sherycart-backend.onrender.com`).
8. Test in browser: visiting `https://sherycart-backend.onrender.com/` should respond with `"Server is running"`.

---

### Part 3: Deploy Frontend to Vercel ([vercel.com](https://vercel.com))
1. Log into [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... > Project**.
2. Select and import your `SheryCart` GitHub repository.
3. Configure the Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend` *(CRITICAL: must be `frontend`)*
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
4. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://sherycart-backend.onrender.com` *(your Render backend URL from Part 2)* |
5. Click **Deploy**.
6. Vercel will install dependencies, build the React bundle, and deploy with the custom `vercel.json` SPA rewrite rules.

---

### Part 4: Connect Backend & Frontend (Final Handshake)
1. Copy your live Vercel frontend URL (e.g., `https://sherycart.vercel.app`).
2. Go back to your **Render Dashboard > sherycart-backend > Environment**.
3. Set/update the `CLIENT_URL` environment variable:
   ```
   CLIENT_URL = https://sherycart.vercel.app
   ```
4. Click **Save Changes**. Render will automatically redeploy with the updated CORS origin allowed.
5. Open your live Vercel app in the browser:
   - Register a new account (`customer` or `seller`).
   - Test login and check DevTools Network tab: cookies and JWT tokens flow securely across domains!
   - Refresh the page on `/main` or `/create-product` to confirm SPA routing works without 404s.

---

## Step 13: Viva & Code Review Preparation

Be prepared to answer these common technical review questions during evaluation:

### Q1: Why do we use both Access Tokens and Refresh Tokens?
> **Answer**: Access tokens are short-lived (15 min) to minimize the damage if a token is intercepted. Refresh tokens are long-lived (7 days) and stored in an `httpOnly` cookie that JavaScript cannot access (preventing XSS attacks). Furthermore, refresh tokens are stored in MongoDB so the server can revoke a session on logout.

### Q2: Why does `POST /api/auth/register` return HTTP 409 for duplicate emails?
> **Answer**: `409 Conflict` is the official RFC HTTP status code indicating that a request cannot be processed due to a conflict with the existing database state (i.e., a user with that email or mobile number already exists).

### Q3: Why doesn't registration return JWT tokens?
> **Answer**: According to security best practices and our project specification, registration only creates the user account. Users must explicitly log in to verify their credentials and receive active session tokens.

### Q4: How does `param('id').isMongoId()` protect the backend?
> **Answer**: It validates that the `:id` parameter matches a 24-character hexadecimal MongoDB ObjectId string before the database query is executed. This prevents MongoDB from throwing uncaught `CastError` exceptions and immediately returns a clean `400 Bad Request`.

### Q5: How does Axios handle silent token refreshing?
> **Answer**: The Axios response interceptor intercepts any `401 Unauthorized` response, queues pending requests, requests a new access token via `/api/auth/refresh-token` using the `httpOnly` cookie, updates the authorization header, and replays the failed requests without interrupting the user.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
