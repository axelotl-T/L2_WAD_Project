const mongoose = require("mongoose");
const product = require("../models/Product.js");
const user = require("../models/User.js");
const review = require("../models/Review.js");
const category = require("../models/Category.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// --- NEW: SendGrid Import ---
const sgMail = require("@sendgrid/mail");
// TODO: Replace this string with your actual API Key from SendGrid
sgMail.setApiKey(
  "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",
);

const JWT_SECRET = "secret_key_wad_project";

let db = {
  async connect() {
    try {
      await mongoose.connect("mongodb://localhost:27017/ShopSwift");
      console.log("✅ Database Connected Successfully");
      await this.seedCategories();
    } catch (e) {
      console.log("❌ Database Connect Error:", e.message);
    }
  },

  async seedCategories() {
    try {
      const count = await category.countDocuments();
      if (count === 0) {
        await category.insertMany([
          { name: "Food" },
          { name: "Devices" },
          { name: "Clothes" },
        ]);
      }
    } catch (e) {
      console.log(e.message);
    }
  },

  async getAllCategories() {
    return await category.find();
  },

  // --- USER ---
  async registerUser(username, email, password, postalCode) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let address = { postalCode, streetName: "", building: "" };
    try {
      const res = await axios.get(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode}&returnGeom=N&getAddrDetails=Y`,
      );
      if (res.data.results && res.data.results.length > 0) {
        address.streetName = res.data.results[0].ROAD_NAME;
        address.building = res.data.results[0].BUILDING;
      }
    } catch (e) {}
    return await user.create({
      username,
      email,
      password: hashedPassword,
      address,
    });
  },

  async loginUser(email, password) {
    const foundUser = await user.findOne({ email });
    if (!foundUser) throw new Error("User not found");

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) throw new Error("Invalid credentials");

    // Generate Token
    const token = jwt.sign(
      { id: foundUser._id, username: foundUser.username },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    foundUser.token = token;
    await foundUser.save();

    return { token, user: foundUser };
  },

  async logoutUser(id) {
    return await user.findByIdAndUpdate(id, { token: null });
  },

  async checkUserToken(id, token) {
    const u = await user.findById(id);
    return u && u.token === token;
  },

  async getUserById(id) {
    return await user.findById(id).select("-password");
  },

  // --- PRODUCTS ---
  async getAllProducts(categoryFilter) {
    let query = {};
    if (categoryFilter && categoryFilter !== "All")
      query.category = categoryFilter;
    return await product.find(query);
  },
  async addProduct(data) {
    data.price = parseFloat(data.price);
    data.stock = parseInt(data.stock);
    return await product.create(data);
  },
  async updateProductById(id, updates) {
    return await product.findByIdAndUpdate(id, updates, { new: true });
  },
  async deleteProductById(id) {
    return await product.findByIdAndDelete(id);
  },
  async getProductById(id) {
    return await product.findById(id);
  },

  // --- REVIEWS ---
  async addReview(rating, comment, userId, productId) {
    return await review.create({
      rating,
      comment,
      user: userId,
      product: productId,
    });
  },
  async getReviewsByProductId(productId) {
    return await review
      .find({ product: productId })
      .populate("user", "username");
  },
  async updateReview(id, comment, rating) {
    return await review.findByIdAndUpdate(
      id,
      { comment, rating },
      { new: true },
    );
  },
  async deleteReview(id) {
    return await review.findByIdAndDelete(id);
  },

  // --- RATES ---
  async getExchangeRates() {
    try {
      const response = await axios.get("https://open.er-api.com/v6/latest/SGD");
      return response.data.rates;
    } catch (e) {
      return { SGD: 1, USD: 0.74 };
    }
  },

  // --- CHECKOUT LOGIC WITH EMAIL ---
  async processCheckout(userId, cartItems) {
    // Step 1: Check if ALL items have enough stock first
    let totalCost = 0;

    for (let item of cartItems) {
      let productDoc = await product.findById(item.id);
      if (!productDoc) {
        throw new Error(`Product '${item.name}' no longer exists.`);
      }
      if (productDoc.stock < item.qty) {
        throw new Error(
          `Insufficient stock for '${item.name}'. Available: ${productDoc.stock}`,
        );
      }
      totalCost += productDoc.price * item.qty;
    }

    // Step 2: If all good, deduct stock
    for (let item of cartItems) {
      let productDoc = await product.findById(item.id);
      productDoc.stock -= item.qty;
      await productDoc.save();
    }

    // Step 3: Fetch User to get Email
    const currentUser = await user.findById(userId);

    if (currentUser) {
      // Step 4: Construct Email
      const emailContent = `
            <h1>Order Confirmed!</h1>
            <p>Hi ${currentUser.username},</p>
            <p>Thank you for shopping with SwiftShop. Here is your order summary:</p>
            <ul>
                ${cartItems.map((item) => `<li>${item.name} x ${item.qty} - $${item.price}</li>`).join("")}
            </ul>
            <h3>Total Paid: SGD ${totalCost.toFixed(2)}</h3>
            <p>We will ship your items to:</p>
            <p>${currentUser.address.streetName}, ${currentUser.address.building}, ${currentUser.address.postalCode}</p>
        `;

      const msg = {
        to: currentUser.email, // User's email from DB
        from: "axeltan16@gmail.com", // REPLACE WITH YOUR VERIFIED SENDER EMAIL
        subject: "SwiftShop Order Confirmation",
        html: emailContent,
      };

      try {
        await sgMail.send(msg);
        console.log("Email sent to " + currentUser.email);
      } catch (error) {
        console.error("SendGrid Error:", error);
        // We do NOT throw error here, because checkout was successful
      }
    }

    return { message: "Checkout successful, stock updated & email sent." };
  },
};

module.exports = db;
