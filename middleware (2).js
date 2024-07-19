const Listing=require("./models/user");
const Review=require("./models/community");
module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        //redirect url
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","you must be logged in to create listing!");
        return res.redirect("/login");
    }
    next();
}