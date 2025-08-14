const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve all static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Serve the index.html for the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Token storage
let tokens = [];
let usedTokens = [];

// Remove expired tokens (older than 5 minutes)
const removeExpiredTokens = () => {
  const now = Date.now();
  const expirationTime = 5 * 60 * 1000;

  const expiredTokens = tokens.filter(t => now - t.timestamp >= expirationTime);
  tokens = tokens.filter(t => now - t.timestamp < expirationTime);

  expiredTokens.forEach(token => {
    const index = usedTokens.indexOf(token.token);
    if (index !== -1) usedTokens.splice(index, 1);
  });

  console.log(`Removed ${expiredTokens.length} expired tokens. Active tokens: ${tokens.length}`);
};

// Routes

// Add a new token
app.post("/add-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });

  if (tokens.find(t => t.token === token)) {
    return res.json({ message: "Token already exists", token });
  }

  tokens.push({ token, timestamp: Date.now() });
  console.log("Token received:", token);
  res.json({ message: "Token added successfully", token });
});

// Get all active tokens
app.get("/get-tokens", (req, res) => {
  removeExpiredTokens();
  res.json({
    tokens: tokens.map(t => t.token),
    count: tokens.length,
    used: usedTokens.length
  });
});

// Assign a token
app.get("/assign-token", (req, res) => {
  removeExpiredTokens();

  const availableTokens = tokens.filter(t => !usedTokens.includes(t.token));
  if (availableTokens.length > 0) {
    const selected = availableTokens[Math.floor(Math.random() * availableTokens.length)].token;
    usedTokens.push(selected);
    console.log(`Token assigned: ${selected}`);
    res.json({ token: selected });
  } else {
    res.json({ error: "No available tokens" });
  }
});

// Release a token
app.post("/release-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });

  const index = usedTokens.indexOf(token);
  if (index !== -1) {
    usedTokens.splice(index, 1);
    console.log(`Token released: ${token}`);
    return res.json({ message: "Token released successfully" });
  }

  res.status(404).json({ error: "Token not found in used list" });
});

// Token stats
app.get("/stats", (req, res) => {
  removeExpiredTokens();
  res.json({
    totalTokens: tokens.length,
    usedTokens: usedTokens.length,
    availableTokens: tokens.length - usedTokens.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
});

// Cleanup every minute
setInterval(removeExpiredTokens, 60 * 1000);
