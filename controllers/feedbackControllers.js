const Feedback = require('../models/feedbackModel');
const User = require('../models/userModel');

module.exports = {

    // 👉 SEND FEEDBACK
    createFeedback: async (req, res) => {
        try {
            const { title, feedback } = req.body;

            if (!title || !feedback) {
                return res.status(400).json({
                    status: false,
                    message: "Title and feedback are required"
                });
            }

            const newFeedback = new Feedback({
                user: req.user.id, // from token middleware
                title,
                feedback
            });

            await newFeedback.save();

            return res.status(201).json({
                status: true,
                message: "Feedback submitted successfully"
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    // 👉 GET ALL FEEDBACKS (WITH USER DATA)
    getAllFeedbacks: async (req, res) => {
        try {
            const feedbacks = await Feedback.find()
                .populate("user", "userName email profile");

            return res.status(200).json({
                status: true,
                data: feedbacks
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                message: error.message
            });
        }
    }
};