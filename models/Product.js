const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: String,
  imageUrl: String,
  shopifyId: { type: String, unique: true, sparse: true },
});

Module.exports = mongoose.model("Product", productSchema);
