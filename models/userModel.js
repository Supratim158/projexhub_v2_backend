const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName:{type: String, required: true},
    email:{type: String, required: true, unique: true},
    otp:{type: String, required: false, default:"none"},
    fcm:{type: String, required: false, default: "none"},
    password:{type:String, required: true},
    verification:{type:Boolean, default: false},
    phone:{type:String, default:"0123456789"},
    phoneVerification:{type:Boolean, default:false},
    userType:{type:String, required:true, default:"User", enum:['User','Admin']},
    profile:{type:String,default:"https://res.cloudinary.com/dwv7t8jvx/image/upload/v1771443605/profilepic_hh9twv.jpg"},
    role: { type: String, default: "Software Developer Engineer" },
    bio: { type: String, default: "I am Software Developer Engineer" },
},
{timestamps: true}
);

module.exports = mongoose.model('user', UserSchema);