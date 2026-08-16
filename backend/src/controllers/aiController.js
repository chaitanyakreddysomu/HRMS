const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173", // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "ICS HRMS", // Optional. Shows in rankings on openrouter.ai.
    }
});

const generateLeave = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "Reason is required" });
        }

        const prompt = `
        Based on the user's input: "${reason}", generate a professional and formal leave application description suitable for a formal request.
        
        Also, try to extract the start date and end date from the text.
        - If a single date is mentioned (e.g., "on 1st Jan"), set both startDate and endDate to that date.
        - If a range is mentioned (e.g., "from 1st to 3rd"), set start and end accordingly.
        - If "tomorrow" or "today" is used, calculate the date based on the current date: ${new Date().toISOString()}.
        - Use YYYY-MM-DD format for dates.
        - If no date is found, set them to null.

        Output ONLY a valid JSON object with the following structure:
        {
            "reason": "The generated formal reason...",
            "startDate": "YYYY-MM-DD" or null,
            "endDate": "YYYY-MM-DD" or null
        }
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful HR assistant. You output only valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        const data = JSON.parse(content);

        res.status(200).json(data);
    } catch (error) {
        console.error("Error generating leave content:", error);
        res.status(500).json({
            message: "Failed to generate content",
            error: error.message
        });
    }
};

const generateComplaint = async (req, res) => {
    try {
        const { complaint } = req.body;

        if (!complaint) {
            return res.status(400).json({ message: "Complaint text is required" });
        }

        const prompt = `
        Based on the user's input: "${complaint}", generate a professional, clear, and formal complaint description.
        
        Also, generate a concise subject line for the complaint.

        Output ONLY a valid JSON object with the following structure:
        {
            "subject": "A concise and professional subject line",
            "description": "The elaborate professional complaint description..."
        }
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful HR assistant. You output only valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        const data = JSON.parse(content);

        res.status(200).json(data);
    } catch (error) {
        console.error("Error generating complaint content:", error);
        res.status(500).json({
            message: "Failed to generate content",
            error: error.message
        });
    }
};

module.exports = {
    generateLeave,
    generateComplaint
};
