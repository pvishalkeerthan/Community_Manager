const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const User=require('./user.js');
const Community=require('./community.js');

const alertboxSchema=new Schema({
    community:{
        type:Schema.Types.ObjectId,
        ref:"Community"
    },

    messages:[
        {
            user: {
                type:Schema.Types.ObjectId, 
                ref: 'User'
              },
              msg:{
                type:String,
                required:true
            }
        }
    ],
    
   
});

const AlertBox=mongoose.model("AlertBox",alertboxSchema);
module.exports=AlertBox;
