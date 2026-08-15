const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

const ai = new GoogleGenAI({});

// Simple keyword extractor fallback (no AI needed)
function extractKeywords(prompt) {
    const stopWords = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','my','your','our','their','i','me','we','this','that','it']);
    return prompt
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 5)
        .join(', ');
}

// POST /api/pinterest/search
router.post('/search', async (req, res) => {
    try {
        const { prompt, page = 1, contextPrompt, limit = 20 } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let keywordsRaw = req.body.keywords;
        let aiData = req.body.aiData;

        // Only call Gemini if this is the first page (no cached keywords)
        if (!keywordsRaw) {
            try {
                const interaction = await ai.interactions.create({
                    model: 'gemini-3.6-flash',
                    input: `You are an expert interior design and architectural AI. 
                    
                    USER PROMPT: "${prompt}"
                    ${contextPrompt ? `PREVIOUS CONTEXT: "${contextPrompt}"` : ""}

                    TASK:
                    1. Analyze the intent. If it's a follow-up (e.g., "add plants"), merge it with the context.
                    2. Extract 3-5 precise search keywords for interior design/architecture images. 
                    3. ALWAYS prioritize terms like "interior", "architecture", "home design", "decor".
                    4. If the prompt is NOT about design/buildings (e.g., "make a cat"), try to interpret it as a design style (e.g., "cat-themed room decor") or return generic luxury interior keywords.

                    Return EXACTLY valid JSON:
                    {
                      "keywords": "concise keywords separated by commas", 
                      "reply": "A brief natural reply (max 20 words) confirming the specific design vibe.", 
                      "suggestions": ["2-3 related search queries"]
                    }`
                });

                try {
                    aiData = JSON.parse(interaction.output_text);
                    keywordsRaw = aiData.keywords;
                } catch (parseErr) {
                    console.error('Gemini JSON Parse Error:', parseErr);
                    keywordsRaw = extractKeywords(prompt);
                    aiData = { keywords: keywordsRaw, reply: 'Here is your design inspiration.', suggestions: [] };
                }
            } catch (geminiErr) {
                // Gemini quota / rate-limit — fall back gracefully
                const status = geminiErr?.status || geminiErr?.response?.status;
                console.error('Gemini API Error (using fallback):', status, geminiErr?.message?.slice(0, 120));
                keywordsRaw = extractKeywords(prompt);
                aiData = {
                    keywords: keywordsRaw,
                    reply: 'Curated inspiration based on your description.',
                    suggestions: []
                };
            }
        }

        const keywords = keywordsRaw.replace(/\.$/, '');
        const searchQuery = `interior design ${keywords}`;

        if (!process.env.UNSPLASH_ACCESS_KEY) {
            return res.status(500).json({ error: 'Unsplash API key not configured' });
        }

        let unsplashRes;
        try {
            unsplashRes = await axios.get('https://api.unsplash.com/search/photos', {
                params: {
                    query: searchQuery,
                    per_page: limit,
                    page: page,
                    orientation: 'landscape',
                },
                headers: {
                    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                },
            });
        } catch (unsplashErr) {
            console.error('Unsplash API Error:', unsplashErr?.response?.status, unsplashErr?.message?.slice(0, 120));
            return res.status(502).json({ error: 'Could not reach Unsplash. Please try again in a moment.' });
        }

        const images = unsplashRes.data.results.map((photo) => ({
            id: photo.id,
            url: photo.urls.regular,
            thumb: photo.urls.small,
            description: photo.alt_description || photo.description || 'Interior design inspiration',
            photographer: photo.user.name,
            color: photo.color,
        }));

        res.json({ images, keywords: keywordsRaw, aiData });

    } catch (error) {
        console.error('Pinterest/Unsplash search error:', error.message);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

module.exports = router;
