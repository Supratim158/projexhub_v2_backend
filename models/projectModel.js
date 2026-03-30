const mongoose = require('mongoose');

// 🔥 Reply Schema
const replySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// 🔥 Comment Schema
const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    text: { type: String, required: true },
    replies: [replySchema],
    createdAt: { type: Date, default: Date.now },
});

// 🚀 Main Project Schema
const ProjectSchema = new mongoose.Schema(
    {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },

    title: { type: String, required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },

    images: { type: [String], required: true },
    video: { type: String, required: false },
    projectReportPdf: { type: String, required: false },
    projectPptPdf: { type: String, required: false },

    technologies: { type: [String], required: true },

    categories: {
        type: [String],
        required: true,
        enum: ["AI", "ML", "IoT", "App", "Web", "Blockchain", "Others"],
    },

    repoLink: { type: String, required: true },
    demoLink: { type: String, required: false },

    memberSize: { type: Number, required: true },
    duration: { type: String, required: true },
    memberNames: { type: [String], required: true },

    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },

    // ❤️ Likes System
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    likeCount: { type: Number, default: 0 },

    // 💬 Comments + Replies
    comments: [commentSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('project', ProjectSchema);