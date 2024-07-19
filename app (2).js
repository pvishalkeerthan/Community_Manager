const express=require('express');
const app=express();
const PORT=8080;
//session requirements
const session=require('express-session');
//middleware for login
const {isLoggedIn}=require("./middleware.js");
//authentication requirements
const passport=require('passport');
const LocalStrategy=require('passport-local');
//model requirements
const User=require("./models/user.js");
const Community=require("./models/community.js");
const AlertBox=require('./models/alertbox.js');
const path=require('path');
const methodOverride=require('method-override');
//flash for messages
const flash=require('connect-flash');
app.use(flash());
//sessions
//session
const sessionOptions={
    secret:'supersecretcode',
    resave:false,
    saveUninitialized :true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }

}
app.use(session(sessionOptions));
//all the requirements for ejs
const ejsMate=require('ejs-mate');
app.set('view engine','ejs');
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")))
//for user autentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//for mongodb
const mongoose = require('mongoose');
const MONGO_URL="mongodb+srv://yadlamaniymn2005:ymn336699@cluster0.ituafhp.mongodb.net/CM";
main().then(()=>{
    console.log("DB is runing");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);

}
//for local variables
app.use((req,res,next)=>{
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    res.locals.currUser=req.user;
    next();
});

//for port of the express
app.listen(PORT,()=>{
    console.log(`listening on ${PORT}`);
})
app.get("/",(req,res)=>{
    res.render("./home.ejs");
})
app.get("/login",(req,res)=>{
    res.render("./login.ejs");
})
app.post("/login",passport.authenticate('local',{failureRedirect:'/login', 
failureFlash: true}),(req,res)=>{
   
    
    
    res.redirect("/home");
})
app.get('/signup',(req,res)=>{
    res.render("./signup.ejs");
})
app.post('/signup',async(req,res)=>{
    
        let {username,email,password,phno}=req.body;
    const newUser=new User({email,username,phno});
   const registeredUser=await  User.register(newUser,password);
   console.log(registeredUser);
   req.login(registeredUser,(err)=>{
    if(err){
        req.flash('error',"Invalid details");
    }
     
   res.redirect("/login");
   });
  
    
    
   
});

app.get('/logout',(req,res)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are looged out!");
        
        res.redirect("/login");
        
    })
})
// app.get('/login-fail',(req,res)=>{
//     req.flash('error',"Invalid username or password");
//     res.render("./login-fail.ejs");
// })
//to get about section

app.get("/home",(req,res)=>{
    res.render("./home.ejs");
})
//Add community
app.get('/addCommunity',(req,res)=>{
    res.render("./addCommunity.ejs");
})
app.post('/community',async(req,res)=>{
    console.log(req.body);
    const newCommunity=new Community(req.body);
    newCommunity.owner=req.user._id;
    newCommunity.resident.push(req.user);
    console.log(newCommunity);
    await newCommunity.save();
    req.flash("success","New Community created!");
    const newAlertBox=new AlertBox();
    newAlertBox.community=newCommunity;
    await newAlertBox.save();

    res.redirect("/home");
});
//showing all the communities
app.get('/community',async (req,res)=>{
    const allCommunity= await Community.find({});
    res.render("index.ejs",{allCommunity});
})
//show route
app.get('/community/:id',async(req,res)=>{
    let {id}=req.params;
    const community=await Community.findById(id).populate('resident').populate("owner");
    if(!req.user){
        res.redirect('/login');
    }
    
    if(!community){
        req.flash("error","NO such community exits");
    }
    if(!req.user){
        res.render("/login.ejs");
        
    }
    const user=req.user;
    const flag=  community.resident.some(resi => resi.username === user.username);
    console.log(flag);

    const alertbox=await AlertBox.find({community}).populate('messages.user');;
    const residents=community.resident;
    const myalertbox=alertbox[0];
    console.log(myalertbox);
    
   
    const messagesAndUsers = myalertbox.messages.map(message => ({
        message: message.msg,
        user: message.user
    }));
   console.log(messagesAndUsers);
   
    res.render("./show.ejs",{community,flag,residents,myalertbox,messagesAndUsers});
})
//join the community
app.post("/add/:id",async(req,res)=>{
   
    let {id}=req.params;
    
    const community=await Community.findById(id).populate('resident');
    
    community.resident.push(req.user);
    await community.save();
   
    res.redirect(`/community/${id}`);
    
})
//my community
app.use("/mycommunity",isLoggedIn,async (req,res)=>{
    const allCommunity= await Community.find({}).populate('resident').populate("owner");
    const user=req.user;
    const joinedCommunities = [];
    for (const community of allCommunity) {
        
        const flag=  community.resident.some(resi => resi.username === user.username);
        if(flag){
            joinedCommunities.push(community);
            
        }
        
    }
   
    
    res.render("./myCommunity.ejs",{joinedCommunities});
})
//to added a message to the alert box
app.post("/alertbox",async(req,res)=>{
    const {id,msg}=req.body;
    const userId=req.user._id;
    const alertbox=await AlertBox.findById(id);
    alertbox.messages.push({user:userId,msg:msg});
    console.log(alertbox);
    await alertbox.save();
  
    
    res.redirect('/mycommunity');
 })
 
app.use((err,req,res,next)=>{
    let {status,message}=err;
    res.status(status).render("./erros.ejs",{message});
    next();
    // res.status(status).send(message);
})

