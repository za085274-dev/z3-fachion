const express = require("express");
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dibfumcwx',
  api_key: '937116717249724',
  api_secret: 'trc-RTeHn0JK1K88a8CHllvLbWY'
});
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "backend", "db.json");
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, "frontend")));

// ── DB helpers ──────────────────────────────────────────────────────────────
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return { products: [], cart: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Products ────────────────────────────────────────────────────────────────
app.get("/api/products", (req, res) => {
  try {
    const { category, featured } = req.query;
    let { products } = readDB();
    if (category) products = products.filter((p) => p.category === category);
    if (featured === "true") products = products.filter((p) => p.featured);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", (req, res) => {
  try {
    const { products } = readDB();
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
});

// ── Admin: Add product ───────────────────────────────────────────────────────
app.post("/api/admin/products", (req, res) => {
  try {
    const { name, price, category, description, details, sizes, colors, image, images, stock, featured } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "name, price, and category are required" });
    }
    const db = readDB();
    const newProduct = {
      id: "prod-" + uuidv4().slice(0, 8),
      name,
      price: parseFloat(price),
      category,
      description: description || "",
      details: details || [],
      sizes: sizes || ["S", "M", "L", "XL"],
      colors: colors || [],
      image: image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80",
      images: images || [],
      stock: parseInt(stock) || 10,
      featured: featured || false,
      createdAt: new Date().toISOString(),
    };
    db.products.push(newProduct);
    writeDB(db);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add product" });
  }
});

app.delete("/api/admin/products/:id", (req, res) => {
  try {
    const db = readDB();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: "Product not found" });
    db.products.splice(idx, 1);
    writeDB(db);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

// ── Cart ────────────────────────────────────────────────────────────────────
app.get("/api/cart", (req, res) => {
  try {
    const { cart } = readDB();
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ success: true, data: { items: cart, total: parseFloat(total.toFixed(2)), count: cart.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
});

app.post("/api/cart", (req, res) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;
    if (!productId || !size) {
      return res.status(400).json({ success: false, message: "productId and size are required" });
    }
    const db = readDB();
    const product = db.products.find((p) => p.id === productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const key = `${productId}-${size}-${color || "default"}`;
    const existingIdx = db.cart.findIndex((i) => i.key === key);

    if (existingIdx > -1) {
      db.cart[existingIdx].quantity += parseInt(quantity);
    } else {
      db.cart.push({
        key,
        productId,
        name: product.name,
        price: product.price,
        image: product.image,
        size,
        color: color || null,
        quantity: parseInt(quantity),
      });
    }
    writeDB(db);
    const total = db.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.status(201).json({
      success: true,
      data: { items: db.cart, total: parseFloat(total.toFixed(2)), count: db.cart.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
});

app.put("/api/cart/:key", (req, res) => {
  try {
    const db = readDB();
    const { quantity } = req.body;
    const decodedKey = decodeURIComponent(req.params.key);
    const idx = db.cart.findIndex((i) => i.key === decodedKey);
    if (idx === -1) return res.status(404).json({ success: false, message: "Cart item not found" });
    if (parseInt(quantity) <= 0) {
      db.cart.splice(idx, 1);
    } else {
      db.cart[idx].quantity = parseInt(quantity);
    }
    writeDB(db);
    const total = db.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ success: true, data: { items: db.cart, total: parseFloat(total.toFixed(2)), count: db.cart.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
});

app.delete("/api/cart/:key", (req, res) => {
  try {
    const db = readDB();
    const decodedKey = decodeURIComponent(req.params.key);
    db.cart = db.cart.filter((i) => i.key !== decodedKey);
    writeDB(db);
    const total = db.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ success: true, data: { items: db.cart, total: parseFloat(total.toFixed(2)), count: db.cart.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
});

app.delete("/api/cart", (req, res) => {
  try {
    const db = readDB();
    db.cart = [];
    writeDB(db);
    res.json({ success: true, data: { items: [], total: 0, count: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
});

// ── Checkout ─────────────────────────────────────────────────────────────────
// ── Checkout ─────────────────────────────────────────────────────────────────
app.post("/api/checkout", async (req, res) => {
  try {
    let receiptUrl = null;

    // 1. رفع الصورة لـ Cloudinary لو موجودة
    if (req.body.receipt) {
      try {
        const uploaded = await cloudinary.uploader.upload(req.body.receipt, {
          folder: 'z3-fachion/receipts'
        });
        receiptUrl = uploaded.secure_url;
      } catch(e) {
        console.error('Cloudinary upload failed:', e);
      }
    }

    const { name, email, address } = req.body;
    if (!name || !email || !address) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const db = readDB();
    if (!db.cart || db.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // 2. إنشاء الطلب (مرة واحدة بس بـ ID واحد)
    const orderId = "ORD-" + uuidv4().slice(0, 8).toUpperCase();
    const newOrder = {
      orderId,
      name,
      email,
      address,
      items: [...db.cart],
      total: db.cart.reduce((s, i) => s + i.price * i.quantity, 0),
      date: new Date().toISOString(),
      status: "pending",
      receipt: receiptUrl
    };

    if (!db.orders) db.orders = [];
    db.orders.unshift(newOrder);
    
    // 3. مسح السلة وحفظ البيانات
    db.cart = [];
    writeDB(db);

    res.json({ success: true, data: { orderId, message: "Order placed successfully!" } });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ success: false, message: "Checkout failed" });
  }
});

// ── SPA fallback ─────────────────────────────────────────────────────────────
  app.get("/api/admin/orders", (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.orders || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});    
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🛍  STITCH store running at http://localhost:${PORT}\n`);
});
