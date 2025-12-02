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
};

module.exports = db;
