const express = require("express");
const app = express();
const PORT = 3000;
//Environment variables
require("dotenv").config();

//session requirements
const session = require("express-session");
//middleware for login
const { isLoggedIn } = require("./middleware.js");
//authentication requirements
const passport = require("passport");
const LocalStrategy = require("passport-local");
//model requirements
const User = require("./models/user.js");
const Community = require("./models/community.js");
const AlertBox = require("./models/alertbox.js");
const Review = require("./models/review.js");
const path = require("path");
const methodOverride = require("method-override");
//flash for messages
const flash = require("connect-flash");
app.use(flash());
//sessions
//session
const sessionOptions = {
  secret: "supersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.use(session(sessionOptions));
//all the requirements for ejs
const ejsMate = require("ejs-mate");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
//for user autentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//for mongodb
const mongoose = require("mongoose");
const MONGO_URL = process.env.MONGO_URL;
main()
  .then(() => {
    console.log("DB is runing");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}
//for local variables
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

//for port of the express
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
app.get("/", (req, res) => {
  req.flash("success", "Welcome to CM");
  res.render("./home.ejs");
});
app.get("/login", (req, res) => {
  res.render("./login.ejs");
});
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Sucessfully loggedin");
    res.redirect("/home");
  }
);
app.get("/signup", (req, res) => {
  res.render("./signup.ejs");
});
app.post("/signup", async (req, res) => {
  let { username, email, password, phno, flatno } = req.body;
  const newUser = new User({ email, username, phno, flatno });
  try {
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        req.flash("error", "Invalid details");
      }
      req.flash("success", "Sign up Successfull");

      res.redirect("/login");
    });
  } catch (err) {
    req.flash("error", "User already exists");
    res.render("./signup.ejs");
  }
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are looged out!");

    res.redirect("/login");
  });
});
// app.get("/login/fail", (req, res) => {
//   req.flash("error", "Invalid username or password");
//   res.redirect("/login");
// });
// to get about section

app.get("/home", (req, res) => {
  res.render("./home.ejs");
});
//Add community
app.get("/addCommunity", isLoggedIn, (req, res) => {
  res.render("./addCommunity.ejs");
});
app.post("/community", async (req, res) => {
  console.log(req.body);
  const newCommunity = new Community(req.body);
  newCommunity.owner = req.user;
  newCommunity.resident.push(req.user);
  console.log(newCommunity);
  await newCommunity.save();
  req.flash("success", "New Community created!");
  const newAlertBox = new AlertBox();
  newAlertBox.community = newCommunity;
  await newAlertBox.save();

  res.redirect("/home");
});
//showing all the communities
app.get("/community", async (req, res) => {
  const allCommunity = await Community.find({});
  res.render("index.ejs", { allCommunity });
});
//show route
app.get("/community/:id", isLoggedIn, async (req, res) => {
  let { id } = req.params;
  const community = await Community.findById(id)
    .populate("resident")
    .populate("owner");
  if (!req.user) {
    res.redirect("/login");
  }

  if (!community) {
    req.flash("error", "NO such community exits");
  }
  if (!req.user) {
    res.render("/login.ejs");
  }
  const user = req.user;
  if (!user || !user.username) {
    req.flash("success", "Please login");
    res.render("/login.ejs");
  }

  const flag = community.resident.some(
    (resi) => resi.username === user.username
  );

  const alertbox = await AlertBox.find({ community }).populate("messages.user");
  const residents = community.resident;
  const myalertbox = alertbox[0];

  const messagesAndUsers = myalertbox.messages.map((message) => ({
    message: message.msg,
    user: message.user,
  }));
  const newCommunity = await community.populate("reviews");

  const reviews = newCommunity.reviews;

  res.render("./community/show.ejs", {
    community,
    flag,
    residents,
    myalertbox,
    messagesAndUsers,
    user,
    reviews,
  });
});
//join the community
app.post("/add/:id", async (req, res) => {
  let { id } = req.params;

  const community = await Community.findById(id).populate("resident");

  community.resident.push(req.user);
  const code = req.body.code;
  if (code == community.code) {
    await community.save();
    req.flash("success", "Joined community successfully");
    res.redirect(`/community/${id}`);
  } else {
    req.flash("error", "Invalid code");
    res.redirect(`/community/${id}`);
  }
});
//my community
app.use("/mycommunity", isLoggedIn, async (req, res) => {
  const allCommunity = await Community.find({})
    .populate("resident")
    .populate("owner");
  const user = req.user;
  const joinedCommunities = [];
  for (const community of allCommunity) {
    const flag = community.resident.some(
      (resi) => resi.username === user.username
    );
    if (flag) {
      joinedCommunities.push(community);
    }
  }

  res.render("./myCommunity.ejs", { joinedCommunities });
});
//edit route for community
app.get("/community/:id/edit", async (req, res) => {
  let { id } = req.params;

  const community = await Community.findById(id);
  console.log(community);

  res.render("./community/edit.ejs", { community });
});
//update route for community
app.put("/community/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const community = await Community.findByIdAndUpdate(id, {
    ...req.body.community,
  });
  await community.save();
  req.flash("success", "Community updated successfully");
  res.redirect(`/community/${community.id}`);
});

//to added a message to the alert box
app.post("/:communityId/alertbox", async (req, res) => {
  const { communityId } = req.params;
  const { id, msg } = req.body;
  const userId = req.user._id;
  const alertbox = await AlertBox.findById(id);
  alertbox.messages.push({ user: userId, msg: msg });
  console.log(alertbox);
  await alertbox.save();
  req.flash("success", "Message sent");
  res.redirect(`/community/${communityId}`);
});
//delete resident route
app.delete("/community/:communityId/reviews/:residentId", async (req, res) => {
  const { communityId, residentId } = req.params;
  //   console.log(communityId);

  console.log("hi");
  const community = await Community.findById(communityId).populate("resident");

  if (!community) {
    return res.status(404).send({ error: "Community not found" });
  }
  let newresident = community.resident;

  newresident = newresident.filter((resi) => resi._id != residentId);
  console.log(
    await Community.findByIdAndUpdate(communityId, { resident: newresident })
  );
  req.flash("success", "Resident deleted successfully");

  res.redirect(`/community/${communityId}`);
});
//To view the user profile
app.get("/user", async (req, res) => {
  const user = req.user;
  res.render("./user/user.ejs", { user });
});

//edit route
app.get("/user/:id/edit", async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    req.redirect("/");
  }
  res.render("./user/edit.ejs", { user });
});

//update route
app.put("/user/:id", async (req, res) => {
  console.log(req.body);
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { ...req.body.user });
  await user.save();
  req.flash("success", "User updated successfully");
  res.redirect("/user");
});
//adding annoucement route
app.post("/announcement/:id/add", async (req, res) => {
  const { id } = req.params;
  const community = await Community.findById(id);
  community.announcement = req.body.announcement;
  await community.save();
  req.flash("success", "Announcement added successfully");
  res.redirect(`/community/${id}`);
});
//Pay rent route
app.post("/pay/:communityId/:residentId", async (req, res) => {
  const { communityId, residentId } = req.params;
  const resident = await User.findById(residentId);
  resident.isPaid = true;
  await resident.save();
  req.flash("success", "Rent paid");
  res.redirect(`/community/${communityId}`);
});
//To reset all the rents of the community page
app.put("/community/:id/reset", async (req, res) => {
  const { id } = req.params;
  const community = await Community.findById(id);
  community.resident.forEach(async (resi) => {
    let user = await User.findById(resi._id);
    user.isPaid = false;
    await user.save();
  });

  // Save the new community
  await community.save();

  res.redirect(`/community/${id}`);
});
//to save the review of the user
app.post("/community/:id/reviews", async (req, res) => {
  let community = await Community.findById(req.params.id);
  let newReview = new Review(req.body.review);
  newReview.username = req.user.username;
  community.reviews.push(newReview);
  await newReview.save();
  await community.save();
  req.flash("success", "New review created!");
  res.redirect(`/community/${community._id}`);
});
//leave the community
app.use("/community/:communityId/remove/:userId", async (req, res) => {
  const communityId = req.params.communityId;
  const memberIdToRemove = req.body.userId; // Assuming you send memberId in the request body

  try {
    // Find the community by ID
    const community = await Community.findById(communityId);

    // Check if the member exists in the resident array
    const index = community.resident.indexOf(memberIdToRemove);

    // Remove the member from the resident array
    community.resident.splice(index, 1);

    // Save the updated community
    await community.save();
    req.flash("success", "Left the community successfully!");

    res.redirect(`/community/${community._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
//to delete comment
// app.delete("/community/:communityId/reviews/:reviewId", async (req, res) => {
//   let { id, reviewid } = req.params;
//   await Community.findByIdAndUpdate(id, { $pull: { reviews: reviewid } });
//   await Review.findByIdAndDelete(reviewid);
//   req.flash("success", "review deleted successfully");
//   res.redirect(`/community/${id}`);
// });
app.use((err, req, res, next) => {
  let { status, message } = err;
  res.status(status).render("./error.ejs", { message });
  next();
  // res.status(status).send(message);
});
