const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Project = require("../models/projectModel");

// 🔹 Convert image → base64
const imageToBase64 = (path) => {
    try {
        const image = fs.readFileSync(path);
        return image.toString("base64");
    } catch {
        return null;
    }
};

// 🔹 Extract PDF
const extractPdfText = async (path) => {
    try {
        const buffer = fs.readFileSync(path);
        const data = await pdfParse(buffer);
        return data.text.substring(0, 3000);
    } catch {
        return "";
    }
};

// 🔹 Common Project Data Builder
const buildProjectContext = async (project) => {
    let pdfText = "";
    let imageBase64 = null;

    if (project.pdf) {
        pdfText = await extractPdfText(project.pdf);
    }

    if (project.image) {
        imageBase64 = imageToBase64(project.image);
    }

    const textContext = `
Title: ${project.title}
Tagline: ${project.tagline}
Description: ${project.description}
Tech Stack: ${project.techStack}

PDF Content:
${pdfText}
`;

    return { textContext, imageBase64 };
};

// 🔹 Gemini Call
const callGemini = async (prompt, imageBase64 = null) => {
    const body = {
    contents: [
        {
        parts: [
            { text: prompt },
            ...(imageBase64
            ? [
                {
                    inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64,
                    },
                },
                ]
            : []),
        ],
        },
    ],
    };

    const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    body,
    { headers: { "Content-Type": "application/json" } }
    );

    return response.data.candidates[0].content.parts[0].text;
};



// =======================================
// 🔥 1. SUMMARY
// =======================================

exports.getProjectSummary = async (req, res) => {
    try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });

    if (project.aiSummary) {
        return res.json({ summary: project.aiSummary });
    }

    const { textContext, imageBase64 } = await buildProjectContext(project);

    const prompt = `
Summarize this project clearly (5-6 lines):

${textContext}

Make it simple, engaging and easy to understand.
`;

    const summary = await callGemini(prompt, imageBase64);

    project.aiSummary = summary;
    await project.save();

    res.json({ summary });

    } catch (e) {
    res.status(500).json({ error: e.message });
    }
};



// =======================================
// 💬 2. CHAT WITH PROJECT
// =======================================

exports.askProjectQuestion = async (req, res) => {
    try {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ message: "Question is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });

    const { textContext, imageBase64 } = await buildProjectContext(project);

    const prompt = `
You are an AI assistant helping users understand a project.

Project Data:
${textContext}

User Question:
${question}

Answer clearly and concisely.
`;

    const answer = await callGemini(prompt, imageBase64);

    res.json({ answer });

    } catch (e) {
    res.status(500).json({ error: e.message });
    }
};



// =======================================
// ⭐ 3. PROJECT SCORING
// =======================================

exports.getProjectScore = async (req, res) => {
    try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });

    const { textContext } = await buildProjectContext(project);

    const prompt = `
Evaluate this project and give:

1. Score out of 10
2. Strengths
3. Weaknesses
4. Suggestions to improve

Project:
${textContext}

Format:
Score: X/10
Strengths:
- ...
Weaknesses:
- ...
Suggestions:
- ...
`;

    const result = await callGemini(prompt);

    res.json({ evaluation: result });

    } catch (e) {
    res.status(500).json({ error: e.message });
    }
};