const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API Key is not configured' });
        }

        const systemPrompt = `You are Aria, a warm and expert AI interior design assistant for InteDesign Studio. 
Help clients with interior design questions, style suggestions, color palettes, furniture recommendations, and space planning. 
Keep responses concise, friendly, and visually descriptive. Use elegant, inspiring language that fits a luxury design studio.`;

        const interaction = await ai.interactions.create({
            model: 'gemini-3.6-flash',
            input: `${systemPrompt}\n\nClient question: ${prompt}`
        });

        res.json({ text: interaction.output_text });
    } catch (error) {
        console.error('Error generating AI response:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
