const express = require("express");
const router = express.Router();
const db = require("./services/dbservice.js");
const axios = require("axios");

db.connect()
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error.message);
  });

router.use(
  express.urlencoded({
    extended: true,
  })
);

//Feature 2: Product Management
//1. Get All Products
router.get("/api/products", function (req, res) {
  db.getAllProducts()
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

//2. Get Single Product By Id
router.get("/api/products", function (req, res) {
  let id = req.params.id;
  db.getProductById(id)
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

//3. Create Product
router.post("/api/products", function (req, res) {
  let data = req.body;
  db.addProduct(
    data.name,
    data.price,
    data.stock,
    data.category,
    data.imageUrl,
    data.shopifyId
  )
    .then(function (response) {
      res.status(200).json({ message: response });
    })
    .catch(function (error) {
      res.status(500).json({ messgae: error.message });
    });
});

//4. Update Product
router.put("/api/products/:id", function (req, res) {
  let id = req.params.id;
  let data = req.body;
  db.updateProductById(id, { name: data.name })
    .then(function (response) {
      res.status(200).json({ message: response });
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

//5. Delete Product
router.delete("/api/product/:id", function (req, res) {
  let value = req.params.value;
  db.deleteProduct({ name: value })
    .then(function (response) {
      res.status(200).json({ message: response });
    })
    .catch(function (error) {
      res.status(500).json({ messgae: error.message });
    });
});

module.exports = router;
