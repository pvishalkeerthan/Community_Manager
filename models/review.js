const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./user.js");
const reviewSchema = new Schema({
  comment: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  username: {
    type: String,
  },
});
module.exports = mongoose.model("Review", reviewSchema);
