const Listing = require("./models/user");
const Review = require("./models/community");
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    //redirect url
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "Login to Use the Feature");
    return res.redirect("/login");
  }
  next();
};
