const axios = require("axios");
const pdfParse = require("pdf-parse");
const Project = require("../models/projectModel");


// =======================================
// 🔹 PDF TEXT EXTRACTOR (CLOUDINARY URL)
// =======================================
const extractPdfText = async (url) => {
    try {
        if (!url) return "";

        const response = await axios.get(url, {
            responseType: "arraybuffer",
        });

        const buffer = Buffer.from(response.data);
        const data = await pdfParse(buffer);

        return data.text.substring(0, 1500); // limit tokens
    } catch (err) {
        console.log("PDF error:", err.message);
        return "";
    }
};


// =======================================
// 🔹 IMAGE → BASE64 (CLOUDINARY URL)
// =======================================
const imagesToBase64 = async (urls = []) => {
    try {
        const results = await Promise.all(
            urls.map(async (url) => {
                try {
                    const response = await axios.get(url, {
                        responseType: "arraybuffer",
                    });

                    return Buffer.from(response.data).toString("base64");
                } catch (err) {
                    console.log("Image error:", err.message);
                    return null;
                }
            })
        );

        return results.filter(Boolean); // remove nulls
    } catch (err) {
        console.log("Image batch error:", err.message);
        return [];
    }
};


// =======================================
// 🔹 BUILD PROJECT CONTEXT
// =======================================
const buildProjectContext = async (project) => {
    let reportText = "";
    let pptText = "";
    let imagesBase64 = [];

    // 📄 Report PDF
    if (project.projectReportPdf) {
        reportText = await extractPdfText(project.projectReportPdf);
    }

    // 📊 PPT PDF
    if (project.projectPptPdf) {
        pptText = await extractPdfText(project.projectPptPdf);
    }

    // 🖼️ Images (limit for token safety)
    if (project.images && project.images.length > 0) {
        imagesBase64 = await imagesToBase64(project.images);
        imagesBase64 = imagesBase64.slice(0, 3);
    }

    const textContext = `
Title: ${project.title}
Tagline: ${project.tagline}
Description: ${project.description}

Technologies: ${project.technologies?.join(", ")}
Categories: ${project.categories?.join(", ")}

Team Size: ${project.memberSize}
Duration: ${project.duration}

--------------------------------

📄 Report Content:
${reportText}

--------------------------------

📊 PPT Content:
${pptText}
`;

    return { textContext, imagesBase64 };
};


// =======================================
// 🔹 GEMINI MULTIMODAL CALL
// =======================================
const callGemini = async (prompt, imagesBase64 = []) => {
    try {
        const parts = [{ text: prompt }];

        // Attach images
        imagesBase64.forEach((img) => {
            parts.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: img,
                },
            });
        });

        const body = {
            contents: [{ parts }],
        };

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            body,
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";

    } catch (err) {
        console.log("Gemini error:", err.response?.data || err.message);
        throw new Error("AI request failed");
    }
};


// =======================================
// 🔥 1. PROJECT SUMMARY
// =======================================
exports.getProjectSummary = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Cache
        if (project.aiSummary) {
            return res.json({ summary: project.aiSummary });
        }

        const { textContext, imagesBase64 } = await buildProjectContext(project);

        const prompt = `
Summarize this project in 5-6 lines.

Make it:
- Simple
- Engaging
- Easy to understand

Project:
${textContext}
`;

        const summary = await callGemini(prompt, imagesBase64);

        project.aiSummary = summary;
        await project.save();

        res.json({ summary });

    } catch (err) {
        res.status(500).json({ error: err.message });
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
        if (!project) return res.status(404).json({ message: "Project not found" });

        const { textContext, imagesBase64 } = await buildProjectContext(project);

        const prompt = `
You are an AI assistant helping users understand a student project.

Answer clearly and concisely.

Project Details:
${textContext}

User Question:
${question}
`;

        const answer = await callGemini(prompt, imagesBase64);

        res.json({ answer });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// =======================================
// ⭐ 3. PROJECT EVALUATION
// =======================================
exports.getProjectScore = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const { textContext, imagesBase64 } = await buildProjectContext(project);

        const prompt = `
Evaluate this project strictly.

Give:
1. Score out of 10
2. Strengths
3. Weaknesses
4. Suggestions to improve

Be honest and technical.

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

        const result = await callGemini(prompt, imagesBase64);

        res.json({ evaluation: result });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};