const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Project = require("../models/projectModel");

// 🔹 Convert file/URL → base64
const fileToBase64 = async (pathOrUrl) => {
    try {
        if (!pathOrUrl) return null;
        if (pathOrUrl.startsWith("http")) {
            const response = await axios.get(pathOrUrl, { responseType: "arraybuffer" });
            return Buffer.from(response.data, "binary").toString("base64");
        } else {
            const file = fs.readFileSync(pathOrUrl);
            return file.toString("base64");
        }
    } catch (err) {
        console.error("Error fetching file for base64:", err.message);
        return null;
    }
};

// 🔹 Extract PDF Text
const extractPdfText = async (pathOrUrl) => {
    try {
        if (!pathOrUrl) return "";
        let buffer;
        if (pathOrUrl.startsWith("http")) {
            const response = await axios.get(pathOrUrl, { responseType: "arraybuffer" });
            buffer = Buffer.from(response.data, "binary");
        } else {
            buffer = fs.readFileSync(pathOrUrl);
        }
        const data = await pdfParse(buffer);
        return data.text; // Return all text
    } catch (err) {
        console.error("Error parsing PDF text:", err.message);
        return "";
    }
};

// =======================================
// 🔹 BUILD PROJECT CONTEXT
// =======================================
const buildProjectContext = async (project) => {
    let pdfsBase64 = [];
    let imagesBase64 = [];
    let reportText = "";
    let pptText = "";

    // 📄 Report PDF
    if (project.projectReportPdf) {
        reportText = await extractPdfText(project.projectReportPdf);
        const pdf = await fileToBase64(project.projectReportPdf);
        if (pdf) pdfsBase64.push({ type: "report", data: pdf });
    }

    // 📊 PPT PDF
    if (project.projectPptPdf) {
        pptText = await extractPdfText(project.projectPptPdf);
        const pdf = await fileToBase64(project.projectPptPdf);
        if (pdf) pdfsBase64.push({ type: "ppt", data: pdf });
    }

    // 🖼️ Images (limit for token safety)
    if (project.images && project.images.length > 0) {
        const imagePromises = project.images.slice(0, 3).map(img => fileToBase64(img));
        const resolvedImages = await Promise.all(imagePromises);
        imagesBase64 = resolvedImages.filter(Boolean);
    }

    const textContext = `
Title: ${project.title || "N/A"}
Tagline: ${project.tagline || "N/A"}
Description: ${project.description || "N/A"}

Technologies: ${project.technologies?.join(", ") || "N/A"}
Categories: ${project.categories?.join(", ") || "N/A"}

Team Size: ${project.memberSize || "N/A"}
Member Names: ${project.memberNames?.join(", ") || "N/A"}
Duration: ${project.duration || "N/A"}

Repository Link: ${project.repoLink || "N/A"}
Demo Link: ${project.demoLink || "N/A"}
Status: ${project.status || "N/A"}
Likes: ${project.likeCount || 0}
Comments count: ${project.comments?.length || 0}
User ID: ${project.userId || "N/A"}

(Attached are the PDF files for the project report and PPT, please read them to understand the project fully, including any images inside them.)

--------------------------------

📄 Report Content (Text Extracted):
${reportText}

--------------------------------

📊 PPT Content (Text Extracted):
${pptText}
`;

    return { textContext, imagesBase64, pdfsBase64 };
};


// =======================================
// 🔹 GEMINI MULTIMODAL CALL
// =======================================
const callGemini = async (prompt, imagesBase64 = [], pdfsBase64 = []) => {
    try {
        const parts = [{ text: prompt }];

        // Attach PDFs
        pdfsBase64.forEach((pdf) => {
            parts.push({
                inlineData: {
                    mimeType: "application/pdf",
                    data: pdf.data,
                },
            });
        });

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
                maxBodyLength: Infinity,
                maxContentLength: Infinity
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

        const { textContext, imagesBase64, pdfsBase64 } = await buildProjectContext(project);

        const prompt = `
Summarize this project in 5-6 lines.

Make it:
- Simple
- Engaging
- Easy to understand

Project:
${textContext}
`;

        const summary = await callGemini(prompt, imagesBase64, pdfsBase64);

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

        const { textContext, imagesBase64, pdfsBase64 } = await buildProjectContext(project);

        const prompt = `
You are an AI assistant helping users understand a student project.

Answer clearly and concisely.

Project Details:
${textContext}

User Question:
${question}
`;

        const answer = await callGemini(prompt, imagesBase64, pdfsBase64);

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
Evaluate this project technically but ensure the final score is greater than 6 out of 10. The score must be 6, 7, 8, 9, or 10.

Give:
1. Score out of 10 (MUST BE ABOVE 6)
2. Strengths
3. Weaknesses
4. Suggestions to improve

Be honest but keep the rating positive as instructed.

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