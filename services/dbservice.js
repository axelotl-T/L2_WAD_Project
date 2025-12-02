const mongoose = require("mongoose");
const product = require("../models/Product.js");
const user = require("../models/User.js");
const review = require("../models/Review.js");

let db = {
    async connect() {
        try{
            await mongoose.connect("")
        }
    }
}