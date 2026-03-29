import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors({
    origin: 'https://scaffold-8d6a2.web.app' 
}));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.post("/generate", async (req, res) => {
    try {
        const { age, location, preferences } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API key missing on Render" });
        }

        // 1. Initialize the model using the SDK
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.8 
            }
        });

        const systemPrompt = "Act as an early childhood expert. Return ONLY a JSON array of 3 objects. Fields: title, focusArea, materials (array), steps (array), whyItWorks.";
        const userQuery = `Generate 3 creative activities for a child. Age: ${age}. Location: ${location}. Interests/Available Materials: ${preferences}.`;

        // 2. Generate content using the SDK
        const result = await model.generateContent(`${systemPrompt}\n\n${userQuery}`);
        const response = await result.response;
        const text = response.text();

        // 3. Log for debugging in Render Logs
        console.log("Gemini Generated Content:", text);

        // 4. Send the result back to your app.js
        res.json({ result: text });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ 
            error: "The AI ladder broke!", 
            details: error.message 
        });
    }
});

// FIXED PORT FOR RENDER
const PORT = process.env.PORT || 10000; // Render prefers 10000 or uses process.env.PORT automatically

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Helpful check to see if the API key is loaded (don't log the key itself!)
    if (process.env.GEMINI_API_KEY) {
        console.log(" Gemini API Key detected.");
    } else {
        console.log(" ERROR: Gemini API Key is missing.");
    }
});