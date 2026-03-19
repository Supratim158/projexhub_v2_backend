const User = require('../models/userModel');
const CryptoJs = require('crypto-js');
const jwt = require('jsonwebtoken');
const generateOtp = require('../utils/otpGenerator');
const sendEmail = require('../utils/smtp_function');

module.exports = {

    createUser : async(req, res) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

        if(!emailRegex.test(req.body.email)){
            return res.status(400).json({status: false, message:"Invalid Email"});
        }

        const minPasswordLength = 6;

        if(req.body.password < minPasswordLength){
            return res.status(400).json({status: false, message:"Password should be atleast "+minPasswordLength+"  characters"});
        }

        try {
            const emailExists = await User.findOne({email: req.body.email});

            if(emailExists){
                return res.status(400).json({status: false, message:"Email already exists"});
            }

            //generate Otp
            const otp = generateOtp();

            const newUser = new User({
                userName: req.body.userName,
                userType: "User",
                email: req.body.email,
                password: CryptoJs.AES.encrypt(req.body.password, process.env.SECRET).toString(),
                otp: otp,

            });

            //Save user
            await newUser.save();

            //Send Otp to email

            sendEmail(newUser.email, otp);

            return res.status(201).json({status: true, message:"User Created Succesfully"});
        } catch (error) {
            return res.status(500).json({status: false, message:error.message});
        }
    },


    loginUser : async(req, res) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

        if(!emailRegex.test(req.body.email)){
            return res.status(400).json({status: false, message:"Invalid Email"});
        }

        const minPasswordLength = 6;

        if(req.body.password < minPasswordLength){
            return res.status(400).json({status: false, message:"Password should be atleast "+minPasswordLength+"  characters"});
        }

        try {
            const user = await User.findOne({email: req.body.email});

            if(!user){
                return res.status(400).json({status: false, message:"User not found"});
            }

            const decryptedPassword = CryptoJs.AES.decrypt(user.password, process.env.SECRET);
            const depassword = decryptedPassword.toString(CryptoJs.enc.Utf8);

            if(depassword !==req.body.password){
                return res.status(400).json({status: false, message:"Wrong Password"});
            }

            const userToken = jwt.sign({
                id: user._id,
                userType: user.userType,
                email: user.email,
            },
            process.env.JWT_SECRET, {expiresIn: "21d"}
        );

        const {password, createdAt, updatedAt, __v, otp, ...others} = user._doc;

        res.status(200).json({...others, userToken});
        
        } catch (error) {
            return res.status(500).json({status: false, message:error.message});
        }
    },
}