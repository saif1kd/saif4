const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "*", // يمكن تغييره لدومين محدد
}));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Token storage (مشترك بالكامل)
let tokens = [];

// إزالة التوكينات القديمة (اختياري، هنا لو حبيت TTL)
const removeExpiredTokens = () => {
  const now = Date.now();
  const expirationTime = 10 * 60 * 1000; // 10 دقائق كمثال
  tokens = tokens.filter(t => now - t.timestamp < expirationTime);
};

// Routes

// إضافة توكين جديد (مشترك)
app.post("/add-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });

  if (!tokens.find(t => t.token === token)) {
    tokens.push({ token, timestamp: Date.now() });
    console.log("Token added:", token);
  }

  res.json({ message: "Token added successfully", token });
});

// الحصول على جميع التوكينات
app.get("/get-tokens", (req, res) => {
  removeExpiredTokens();
  res.json({
    tokens: tokens.map(t => t.token),
    count: tokens.length,
  });
});

// إحصائيات
app.get("/stats", (req, res) => {
  removeExpiredTokens();
  res.json({
    totalTokens: tokens.length,
  });
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
});

// تنظيف كل دقيقة
setInterval(removeExpiredTokens, 60 * 1000);
