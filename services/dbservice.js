const mongoose = require("mongoose");
const product = require("../models/Product.js");
const user = require("../models/User.js");
const review = require("../models/Review.js");

let db = {
  async connect() {
    try {
      await mongoose.connect("mongodb://localhost:27017/ShopSwift");
      return "Connect to Mongo DB";
    } catch (e) {
      console.log(e.message);
      throw new Error("Error connecting to Mongo DB");
    }
  },
  async getAllProducts() {
    try {
      let results = await product.find();
      return results;
    } catch (e) {
      console.log(e.message);
      throw new Error("Error retrieving products.");
    }
  },
  async getProductById(id) {
    try {
      let results = await product.findById(id);
      return results;
    } catch (e) {
      console.log(e.message);
      throw new Error("Error retrieving product.");
    }
  },
  async addProduct(name, description, price, stock, category) {
    try {
      await product.create({
        name: name,
        description: description,
        price: price,
        stock: stock,
        category: category,
        // imageUrl: imageUrl,
      });
    } catch (e) {
      console.log(e.message);
      throw new Error(`Product name: ${name} was not added.`);
    }
  },
  async updateProductById(id, updates) {
    try {
      let result = await product.findByIdAndUpdate(id, updates);
      if (!result) return "Unable to find record to update.";
      else return "Record is updated!";
    } catch (e) {
      console.log(e.message);
      throw new Error("Error updating event");
    }
  },
  async deleteProductById(id) {
    try {
      let result = await product.findByIdAndDelete(id);
      if (!result) return "Unable to find a record to delete.";
      else return "Record is deleted!";
    } catch (e) {
      console.log(e.message);
      throw new Error("Error deleting event");
    }
  },
  async searchProducts(name) {
    try {
      let result = await product.find({
        name: new RegExp(name, "i"),
      });
      return result;
    } catch (e) {
      console.log(e.message);
      throw new Error(`Unable to retrieve records for ${name}`);
    }
  },
  // async addReview(reviewData) {
  //   const newReview = new review(reviewData);

  //   const savedReview = await newReview.save();
  //   return savedReview;
  // },

  // async getReviewsByProductId(productId) {
  //   const reviews = await Review.find({ product: productId }).populate(
  //     "user",
  //     "username"
  //   );
  //   return reviews;
  // },
};

module.exports = db;
