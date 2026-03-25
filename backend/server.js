import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is running ");
});

app.post("/generate", async (req, res) => {
    try {
        const { age, location, preferences } = req.body;

        const systemPrompt = `Act as a world-class early childhood education expert and creative curriculum designer. Generate three distinct, detailed, age-appropriate activities in JSON array format.`;

        const userQuery = `Generate three creative activities for a child:
        Age: ${age}
        Location: ${location}
        Preferences: ${preferences}`;

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

        res.json(data);

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
