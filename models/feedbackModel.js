const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    feedback: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("feedback", FeedbackSchema);