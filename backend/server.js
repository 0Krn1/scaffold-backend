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
            return res.status(500).json({ error: "API key missing" });
        }
const safetySettings = [
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" }
];

    const systemPrompt = `
Return ONLY a JSON array of 3 objects.
Each object MUST have:
- title (string)
- focusArea (string)
- materials (array of strings)
- steps (array of strings)
- whyItWorks (string)
`;

        const userQuery = `Generate three creative activities for a child:
        Age: ${age}
        Location: ${location}
        Preferences: ${preferences}
        Return ONLY JSON array.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                    safetySettings,
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