# 🧵 STITCH — Full Stack Clothing Store

A modern, luxury-themed clothing store built with **Node.js + Express** (backend) and **vanilla HTML/CSS/JS** (frontend), using a JSON flat-file database.

---

## 📁 Project Structure

```
clothingstore/
├── server.js               ← Express server (entry point)
├── package.json
├── backend/
│   └── db.json             ← JSON flat-file database (products + cart)
└── frontend/
    ├── index.html          ← Home page
    ├── css/
    │   └── style.css       ← All styles
    ├── js/
    │   └── main.js         ← Shared JS (API helpers, nav, toast)
    └── pages/
        ├── products.html   ← Product listing + filters
        ├── product.html    ← Single product detail
        ├── cart.html       ← Shopping cart
        ├── checkout.html   ← Checkout form
        └── admin.html      ← Admin panel (add/delete products)
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** v16+ — [https://nodejs.org](https://nodejs.org)
- **npm** (comes with Node)

### 2. Install Dependencies

```bash
cd clothingstore
npm install
```

### 3. Start the Server

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

> If using `npm run dev`, install nodemon first: `npm install -g nodemon`

### 4. Open in Browser

```
http://localhost:3000
```

---

## 📄 Pages

| Page | URL |
|------|-----|
| Home | `http://localhost:3000` |
| Shop | `http://localhost:3000/pages/products.html` |
| Product Detail | `http://localhost:3000/pages/product.html?id=prod-001` |
| Cart | `http://localhost:3000/pages/cart.html` |
| Checkout | `http://localhost:3000/pages/checkout.html` |
| **Admin** | `http://localhost:3000/pages/admin.html` |

---

## 🔌 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/products` | Get all products |
| `GET` | `/api/products?featured=true` | Get featured products |
| `GET` | `/api/products?category=T-Shirts` | Filter by category |
| `GET` | `/api/products/:id` | Get single product |
| `POST` | `/api/admin/products` | Add a new product (admin) |
| `DELETE` | `/api/admin/products/:id` | Delete a product (admin) |
| `GET` | `/api/cart` | Get cart contents |
| `POST` | `/api/cart` | Add item to cart |
| `PUT` | `/api/cart/:key` | Update item quantity |
| `DELETE` | `/api/cart/:key` | Remove item from cart |
| `DELETE` | `/api/cart` | Clear entire cart |
| `POST` | `/api/checkout` | Submit order |

---

## ➕ Adding Products via Admin Panel

1. Visit `http://localhost:3000/pages/admin.html`
2. Fill out the form with product details
3. Click **Add Product**

### Or via API (cURL):
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Linen Trousers",
    "price": 95,
    "category": "Trousers",
    "description": "Relaxed linen trousers for warm days.",
    "sizes": ["S", "M", "L", "XL"],
    "colors": ["Stone", "Navy"],
    "details": ["100% Linen", "Relaxed fit", "Side pockets"],
    "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
    "stock": 30,
    "featured": true
  }'
```

---

## 🗄️ Database

Products and cart data are stored in `backend/db.json`. This file is read and written directly by the server — no database setup needed.

To **reset the cart**, delete the contents of the `cart` array in `db.json`.

To **add products in bulk**, edit `db.json` directly following the existing product structure.

---

## 🎨 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML5, CSS3 (custom), Vanilla JS |
| Fonts | Cormorant Garamond + DM Sans (Google Fonts) |
| Backend | Node.js + Express |
| Database | JSON flat file |
| IDs | UUID v4 |

---

## 💡 Tips

- The cart persists on the server between page reloads (stored in db.json)
- Product images use Unsplash URLs — replace with your own hosted images in production
- To deploy: push to any Node.js host (Railway, Render, Heroku, etc.)
- For production use, add authentication to the `/api/admin/*` routes

---

Made with ♥ — STITCH 2025
