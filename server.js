const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: 'dibfumcwx',
  api_key: '937116717249724',
  api_secret: process.env.CLOUDINARY_SECRET || 'YOUR_SECRET_HERE'
});

mongoose.connect(process.env.MONGO_URL);

const OrderSchema = new mongoose.Schema({
  orderId: String,
  name: String,
  email: String,
  address: String,
  items: Array,
  total: Number,
  receipt: String,
  status: { type: String, default: 'pending' },
  date: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  category: String,
  description: String,
  details: Array,
  sizes: Array,
  colors: Array,
  image: String,
  images: Array,
  stock: Number,
  featured: Boolean,
  createdAt: Date
});

const Order = mongoose.model('Order', OrderSchema);
const Product = mongoose.model('Product', ProductSchema);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, "frontend")));

// ── Products ──────────────────────────────────────────────────────────────
app.get("/api/products", async (req, res) => {
  try {
    let query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.featured === 'true') query.featured = true;
    const products = await Product.find(query);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
});

app.post("/api/admin/products", async (req, res) => {
  try {
    const { name, price, category, description, details, sizes, colors, image, images, stock, featured } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "name, price, and category are required" });
    }
    const newProduct = new Product({
      id: "prod-" + uuidv4().slice(0, 8),
      name, price: parseFloat(price), category,
      description: description || "",
      details: details || [],
      sizes: sizes || ["S", "M", "L", "XL"],
      colors: colors || [],
      image: image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80",
      images: images || [],
      stock: parseInt(stock) || 10,
      featured: featured || false,
      createdAt: new Date()
    });
    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add product" });
  }
});

app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    await Product.deleteOne({ id: req.params.id });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

// ── Cart (in memory) ──────────────────────────────────────────────────────
let cart = [];

app.get("/api/cart", (req, res) => {
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ success: true, data: { items: cart, total: parseFloat(total.toFixed(2)), count: cart.length } });
});

app.post("/api/cart", async (req, res) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;
    if (!productId || !size) return res.status(400).json({ success: false, message: "productId and size are required" });
    const product = await Product.findOne({ id: productId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const key = `${productId}-${size}-${color || "default"}`;
    const existingIdx = cart.findIndex(i => i.key === key);
    if (existingIdx > -1) {
      cart[existingIdx].quantity += parseInt(quantity);
    } else {
      cart.push({ key, productId, name: product.name, price: product.price, image: product.image, size, color: color || null, quantity: parseInt(quantity) });
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.status(201).json({ success: true, data: { items: cart, total: parseFloat(total.toFixed(2)), count: cart.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
});

app.put("/api/cart/:key", (req, res) => {
  const decodedKey = decodeURIComponent(req.params.key);
  const idx = cart.findIndex(i => i.key === decodedKey);
  if (idx === -1) return res.status(404).json({ success: false, message: "Cart item not found" });
  if (parseInt(req.body.quantity) <= 0) {
    cart.splice(idx, 1);
  } else {
    cart[idx].quantity = parseInt(req.body.quantity);
  }
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ success: true, data: { items: cart, total: parseFloat(total.toFixed(2)), count: cart.length } });
});

app.delete("/api/cart/:key", (req, res) => {
  const decodedKey = decodeURIComponent(req.params.key);
  cart = cart.filter(i => i.key !== decodedKey);
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ success: true, data: { items: cart, total: parseFloat(total.toFixed(2)), count: cart.length } });
});

app.delete("/api/cart", (req, res) => {
  cart = [];
  res.json({ success: true, data: { items: [], total: 0, count: 0 } });
});

// ── Checkout ──────────────────────────────────────────────────────────────
app.post("/api/checkout", async (req, res) => {
  try {
    let receiptUrl = null;
    if (req.body.receipt) {
      try {
        const uploaded = await cloudinary.uploader.upload(req.body.receipt, { folder: 'z3-fachion/receipts' });
        receiptUrl = uploaded.secure_url;
      } catch(e) { console.error('Cloudinary upload failed:', e); }
    }
    const { name, email, address } = req.body;
    if (!name || !address) return res.status(400).json({ success: false, message: "Missing required fields" });
    if (cart.length === 0) return res.status(400).json({ success: false, message: "Cart is empty" });
    const orderId = "ORD-" + uuidv4().slice(0, 8).toUpperCase();
    const order = new Order({
      orderId, name, email, address,
      items: cart,
      total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
      receipt: receiptUrl,
      status: 'pending'
    });
    await order.save();
    cart = [];
    res.json({ success: true, data: { orderId, message: "Order placed successfully!" } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Checkout failed" });
  }
});

// ── Admin Orders ──────────────────────────────────────────────────────────
app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

app.put("/api/admin/orders/:orderId/ship", async (req, res) => {
  try {
    await Order.updateOne({ orderId: req.params.orderId }, { status: 'shipped' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🛍  Z3 Fachion store running at http://localhost:${PORT}\n`);
});