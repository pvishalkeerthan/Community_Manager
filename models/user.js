const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  phno: {
    type: String,
    required: true,
  },
  flatno: {
    type: String,
    required: true,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);
module.exports = User;
