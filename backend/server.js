const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

app.post("/generate", async (req, res) => {
    try {
        const { age, location, preferences } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API key missing" });
        }

const systemPrompt = `
You are an expert in early childhood education.

STRICT RULES:
- Return ONLY valid JSON
- No explanation, no text outside JSON
- Format must be an array of 3 objects

Each object must have:
- title
- description
- materials
- steps (array)
`;

        const userQuery = `Generate three creative activities for a child:
        Age: ${age}
        Location: ${location}
        Preferences: ${preferences}
        Return ONLY JSON array.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            }
        );

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
        // Send only useful content to frontend
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

       if (!text) {
    console.error("FULL RESPONSE:", data);
    return res.status(500).json({ error: "AI returned empty response" });
}

        res.json({ result: text });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// FIXED PORT FOR RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});