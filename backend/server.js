import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
    origin: 'https://scaffold-8d6a2.web.app' // Replace with your actual Firebase URL
}));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
    try {
        const { age, location, preferences } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API key missing on Render" });
        }

        const systemPrompt = "Return ONLY a JSON array of 3 objects. No introductory text. Fields: title, focusArea, materials (array), steps (array), whyItWorks.";

        const userQuery = `Generate 3 creative activities for a child. Age: ${age}. Location: ${location}. Interests: ${preferences}.`;

        // FIXED URL: Using 1.5-flash (Stable)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                // FIX 2: Stop the safety filter from blocking "child" content
                safetySettings: [
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();

        // LOGGING: This will show up in your Render "Logs" tab so you can see the REAL error
        console.log("Gemini Raw Response:", JSON.stringify(data));

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            // Check if it was blocked by safety
            const reason = data?.candidates?.[0]?.finishReason || "UNKNOWN_ERROR";
            return res.status(500).json({ error: `Gemini blocked request. Reason: ${reason}` });
        }

        res.json({ result: text });

    } catch (error) {
        console.error("Backend Crash:", error);
        res.status(500).json({ error: "Server crashed while talking to Gemini" });
    }
});
// FIXED PORT FOR RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});