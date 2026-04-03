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

        if(req.body.password.length < minPasswordLength){
            return res.status(400).json({status: false, message:"Password should be atleast "+minPasswordLength+"  characters"});
        }

        try {
            const emailExists = await User.findOne({email: req.body.email});

            if(emailExists){
                return res.status(400).json({status: false, message:"Email already exists"});
            }

            //generate Otp
            console.log("Step 1: API hit");

const otp = generateOtp();
console.log("Step 2: OTP generated:", otp);

const newUser = new User({
    userName: req.body.userName,
    userType: "User",
    email: req.body.email,
    password: CryptoJs.AES.encrypt(req.body.password, process.env.SECRET).toString(),
    otp: otp,
});

await newUser.save();
console.log("Step 3: User saved");

console.log("Step 4: Calling sendEmail...");
await sendEmail(newUser.email, otp);
console.log("Step 5: Email function executed");

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

        if(req.body.password.length < minPasswordLength){
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

        const {password, __v, otp, ...others} = user._doc;

        res.status(200).json({...others, userToken});
        
        } catch (error) {
            return res.status(500).json({status: false, message:error.message});
        }
    },

    changePassword: async (req, res) => {
    try {
        const userId = req.user.id; // from JWT middleware
        const { currentPassword, newPassword } = req.body;

        // 🔹 Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                status: false,
                message: "New password must be at least 6 characters"
            });
        }

        // 🔹 Find user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // 🔹 Decrypt old password
        const decryptedPassword = CryptoJs.AES.decrypt(
            user.password,
            process.env.SECRET
        );

        const oldPassword = decryptedPassword.toString(CryptoJs.enc.Utf8);

        // 🔹 Compare passwords
        if (oldPassword !== currentPassword) {
            return res.status(400).json({
                status: false,
                message: "Current password is incorrect"
            });
        }

        // 🔹 Encrypt new password
        const encryptedNewPassword = CryptoJs.AES.encrypt(
            newPassword,
            process.env.SECRET
        ).toString();

        // 🔹 Update password
        user.password = encryptedNewPassword;
        await user.save();

        return res.status(200).json({
            status: true,
            message: "Password updated successfully"
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
}
}