const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const User=require('./user.js');

const communitySchema=new Schema({
    name:{
        type:String,
        requires:true,
    },
    description:String,
    image:{
        type:String,
        default:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        set:(v)=>v===""?"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D":v,
    },
    
    location:String,
    country:String,
    resident:[
        {
            type:Schema.Types.ObjectId,
            ref:"User",
        }
    ],
    
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

});

const Community=mongoose.model("Community",communitySchema);
module.exports=Community;
