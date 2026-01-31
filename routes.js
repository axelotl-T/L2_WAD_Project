const express = require("express");
const router = express.Router();
const db = require("./services/dbservice");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "secret_key_wad_project";

// Establish Database Connection
db.connect();

// ---------------------------------------------------
// MIDDLEWARE (Lab 8 Style)
// ---------------------------------------------------
function authenticationCheck(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer <token>

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }

    // Lab 8/9 Style: Store authenticated info in res.locals
    res.locals.userId = decoded.id;
    res.locals.username = decoded.username;
    next();
  });
}

// ---------------------------------------------------
// AUTHENTICATION ROUTES
// ---------------------------------------------------

// Login
router.post("/api/login", function (req, res) {
  let email = req.body.email;
  let password = req.body.password;

  db.loginUser(email, password)
    .then(function (result) {
      res.status(200).json(result);
    })
    .catch(function (err) {
      res.status(401).json({ error: err.message });
    });
});

// Register
router.post("/api/register", function (req, res) {
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;
  let postalCode = req.body.postalCode;

  db.registerUser(username, email, password, postalCode)
    .then(function (result) {
      res
        .status(201)
        .json({ message: "User registered successfully", user: result });
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Logout (Server-Side)
router.post("/api/logout", authenticationCheck, function (req, res) {
  let userId = res.locals.userId;

  db.logoutUser(userId)
    .then(function () {
      res.status(200).json({ message: "Logged out successfully" });
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Get Current User Profile
router.get("/api/user", authenticationCheck, function (req, res) {
  let userId = res.locals.userId;

  db.getUserById(userId)
    .then(function (result) {
      res.status(200).json(result);
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// ---------------------------------------------------
// PRODUCT ROUTES
// ---------------------------------------------------

//KZ: Get All Products (With Optional Category Filter)
router.get("/api/products", function (req, res) {
  let category = req.query.category;

  db.getAllProducts(category)
    .then(function (results) {
      res.status(200).json(results);
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Get Single Product by ID
router.get("/api/products/:id", function (req, res) {
  let id = req.params.id;

  db.getProductById(id)
    .then(function (result) {
      if (!result) {
        res.status(404).json({ message: "Product not found" });
      } else {
        res.status(200).json(result);
      }
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Add Product (Protected)
router.post("/api/products", authenticationCheck, function (req, res) {
  let data = req.body;

  db.addProduct(data)
    .then(function (result) {
      res.status(201).json({ message: "Product added", product: result });
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Update Product (Protected)
router.put("/api/products/:id", authenticationCheck, function (req, res) {
  let id = req.params.id;
  let data = req.body;

  db.updateProductById(id, data)
    .then(function (result) {
      res.status(200).json({ message: "Product updated", product: result });
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Delete Product (Protected)
router.delete("/api/products/:id", authenticationCheck, function (req, res) {
  let id = req.params.id;

  db.deleteProductById(id)
    .then(function () {
      res.status(200).json({ message: "Product deleted" });
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// ---------------------------------------------------
// REVIEW ROUTES (Lab 9 Logic)
// ---------------------------------------------------

// Add Review (Protected)
router.post("/api/reviews", authenticationCheck, function (req, res) {
  let userId = res.locals.userId; // Retrieved from middleware
  let rating = req.body.rating;
  let comment = req.body.comment;
  let productId = req.body.productId;

  db.addReview(rating, comment, userId, productId)
    .then(function (result) {
      res.status(201).json(result);
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Get Reviews for a Product
router.get("/api/products/:id/reviews", function (req, res) {
  let productId = req.params.id;

  db.getReviewsByProductId(productId)
    .then(function (results) {
      res.status(200).json(results);
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Update Review (Protected)
router.put("/api/reviews/:id", authenticationCheck, function (req, res) {
  let id = req.params.id;
  let comment = req.body.comment;
  let rating = req.body.rating;

  db.updateReview(id, comment, rating)
    .then(function (result) {
      res.status(200).json(result);
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// Delete Review (Protected)
router.delete("/api/reviews/:id", authenticationCheck, function (req, res) {
  let id = req.params.id;

  db.deleteReview(id)
    .then(function () {
      res.status(200).json({ message: "Review deleted" });
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// ---------------------------------------------------
// UTILITY ROUTES (Categories & Rates)
// ---------------------------------------------------

router.get("/api/categories", function (req, res) {
  db.getAllCategories()
    .then(function (results) {
      res.status(200).json(results);
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

router.get("/api/rates", function (req, res) {
  db.getExchangeRates()
    .then(function (results) {
      res.status(200).json(results);
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

// --- UPDATED CHECKOUT ROUTE ---
router.post("/api/checkout", authenticationCheck, function (req, res) {
  let cart = req.body.cart; // Expecting array of {id, name, price, qty}
  let userId = res.locals.userId; // <--- NEW: Get the User ID from the token

  if (!cart || cart.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  // Pass userId to the processCheckout function
  db.processCheckout(userId, cart)
    .then(function (result) {
      res.status(200).json(result);
    })
    .catch(function (err) {
      res.status(400).json({ error: err.message });
    });
});
// NEW: Get All Reviews (For Admin)
router.get("/api/reviews", function (req, res) {
  db.getAllReviews()
    .then(function (results) {
      res.status(200).json(results);
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;
