const express = require("express");
const router = express.Router();

const {
    getProjectSummary,
    askProjectQuestion,
    getProjectScore
} = require("../controllers/aiControllers");

// Summary
router.get("/project-summary/:id", getProjectSummary);

// 💬 Chat with project
router.post("/ask-project-question/:id", askProjectQuestion);

// ⭐ AI scoring
router.get("/project-score/:id", getProjectScore);

module.exports = router;