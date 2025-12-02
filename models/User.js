const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  address: {
    postalCode: String,
    streetName: String,
    building: String,
  },
});

Module.exports = mongoose.model("user", userSchema);
