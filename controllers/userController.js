const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

module.exports = {
    getUser: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);

            const { password, __v, createdAt, ...userData} = user._doc;

            res.status(200).json(userData);
        } catch (error) {
            res.status(500).json({status: false, message: error.message});
        }
    },

    verifyAccount: async (req, res) => {
        const userOtp = req.params.otp;

        try {
            const user = await User.findById(req.user.id);

            if(!user){
                return res.status(400).json({status: false, message: "User not found !!"});
            }

            if(userOtp === user.otp){
                user.verification = true;
                user.otp = "none";

                await user.save();

                const userToken = jwt.sign({
                                id: user._id,
                                userType: user.userType,
                                email: user.email,
                            },
                            process.env.JWT_SECRET, {expiresIn: "21d"});

                const {password,  __v, otp, createdAt, ...others} = user._doc;

                res.status(200).json({...others, userToken});
            }
            else{
                res.status(400).json({status: false, message: "Otp verification failed"});
            }
        } catch (error) {
            return res.status(500).json({status: false, message: error.message});
        }
    },

    verifyPhone: async (req, res) => {
        const phone = req.params.phone;

        try {
            const user = User.findById(req.user.id);

            if(!user){
                res.status(400).json({status: false, message: "User not found !!"});
            }

            user.phoneVerification = true;
            user.phone = phone;

            const {password,  __v, otp, createdAt, ...others} = user._doc;

            return res.status(200).json(...others);
            
            
        } catch (error) {
            res.status(500).json({status: false, message: error.message});
        }
    },

    deleteUser: async (req, res) => {
        try {
            await User.findByIdAndDelete(req.user.id);

            res.status(200).json({status: true, message: "User successfully deleted"});
        } catch (error) {
            res.status(500).json({status: false, message: error.message});
        }
    },

    getAllUsers: async (req, res) => {
    try {
        // 🔐 Admin check
        if (req.user.userType !== 'Admin') {
            return res.status(403).json({
                status: false,
                message: "Access denied. Admin only."
            });
        }

        const { userType, verification } = req.query;

        let query = {};

        if (userType) query.userType = userType;
        if (verification) query.verification = verification;

        const users = await User.find(query).select('-password -__v');

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
    },

    updateProfile: async (req, res) => {
    try {
        const { userName, email, profile } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // ✅ Username update
        if (userName) {
            user.userName = userName.trim();
        }

        // ✅ Email validation + duplicate check
        if (email) {
            const emailTrimmed = email.trim().toLowerCase();

            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

            if (!emailRegex.test(emailTrimmed)) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid Email"
                });
            }

            const existingUser = await User.findOne({ email: emailTrimmed });

            if (
                existingUser &&
                existingUser._id.toString() !== req.user.id
            ) {
                return res.status(400).json({
                    status: false,
                    message: "Email already in use"
                });
            }

            user.email = emailTrimmed;
        }

        // ✅ Profile image update
        if (profile) {
            user.profile = profile;
        }

        const updatedUser = await user.save();

        const { password, __v, otp, createdAt, ...userData } =
            updatedUser._doc;

        res.status(200).json({
            status: true,
            message: "Profile updated successfully",
            user: userData
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
},
}