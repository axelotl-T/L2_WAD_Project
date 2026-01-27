const express = require("express");
const router = express.Router();
const db = require("./services/dbservice.js");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "secret_key_wad_project";

db.connect();

function authenticationCheck(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    res.locals.userId = decoded.id;
    res.locals.username = decoded.username;
    next();
  });
}

// <--- NEW: Get Categories Route --->
router.get("/api/categories", function (req, res) {
  db.getAllCategories()
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(500).json({ error: error.message }));
});

// <--- UPDATED: Pass 'req.query.category' to db function --->
router.get("/api/products", function (req, res) {
  let category = req.query.category;
  db.getAllProducts(category)
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(500).json({ error: error.message }));
});

// ... (Keep the rest of your routes exactly as they were) ...
router.post("/api/products", authenticationCheck, function (req, res) {
  db.addProduct(req.body)
    .then((response) =>
      res.status(201).json({ message: "Product added", product: response }),
    )
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.put("/api/products/:id", authenticationCheck, function (req, res) {
  db.updateProductById(req.params.id, req.body)
    .then((response) =>
      res.status(200).json({ message: "Product updated", product: response }),
    )
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.delete("/api/products/:id", authenticationCheck, function (req, res) {
  db.deleteProductById(req.params.id)
    .then(() => res.status(200).json({ message: "Product deleted" }))
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.get("/api/products/:id", function (req, res) {
  db.getProductById(req.params.id)
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.post("/api/register", (req, res) => {
  db.registerUser(
    req.body.username,
    req.body.email,
    req.body.password,
    req.body.postalCode,
  )
    .then((response) =>
      res.status(201).json({ message: "User registered", user: response }),
    )
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.post("/api/login", (req, res) => {
  db.loginUser(req.body.email, req.body.password)
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(401).json({ error: error.message }));
});

router.post("/api/reviews", authenticationCheck, function (req, res) {
  db.addReview(
    req.body.rating,
    req.body.comment,
    res.locals.userId,
    req.body.productId,
  )
    .then((response) => res.status(201).json(response))
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.get("/api/products/:id/reviews", function (req, res) {
  db.getReviewsByProductId(req.params.id)
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.put("/api/reviews/:id", authenticationCheck, function (req, res) {
  db.updateReview(req.params.id, req.body.comment, req.body.rating)
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.delete("/api/reviews/:id", authenticationCheck, function (req, res) {
  db.deleteReview(req.params.id)
    .then(() => res.status(200).json({ message: "Review deleted" }))
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.get("/api/rates", function (req, res) {
  db.getExchangeRates()
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(500).json({ error: error.message }));
});

router.get("/api/categories", function (req, res) {
  db.getAllCategories()
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(500).json({ error: error.message }));
});

module.exports = router;
