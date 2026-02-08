import { Client, Databases } from 'node-appwrite';
import { GoogleGenerativeAI } from '@google/generative-ai';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DATABASE_ID = 'clouva_db';
const COLLECTION_FILES = 'files';

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    try {
        const document = JSON.parse(req.body);
        const extractedText = document.extractedText;
        const documentId = document.$id;

        if (!extractedText) {
            return res.json({ message: 'No text to classify' });
        }

        // Ollama API Call
        const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://host.docker.internal:11434/api/generate';
        const MODEL = 'llama3'; // Or 'mistral', make configurable if needed

        const prompt = `Analyze the following text and provide:
        1. 3-5 broad categories (e.g., Finance, Health, Technology).
        2. 5-10 specific keywords or entities.
        3. A brief 1-sentence summary.
        
        Return ONLY a JSON object with keys: "categories" (array), "keywords" (array), "summary" (string).
        
        Text: ${extractedText.substring(0, 5000)}`;

        const response = await fetch(OLLAMA_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: prompt,
                stream: false,
                format: "json"
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        let result;
        try {
            result = JSON.parse(data.response);
        } catch (e) {
            // Fallback if Ollama returns raw text despite format: json
            console.log("Failed to parse JSON directly, attempting cleanup");
            const cleanJson = data.response.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanJson);
        }

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_FILES,
            documentId,
            {
                ai_categories: result.categories || [],
                ai_keywords: result.keywords || [],
                ai_summary: result.summary || "",
                classificationStatus: 'completed'
            }
        );

        return res.json({ success: true, result });

    } catch (err) {
        error(err);
        return res.json({ error: err.message }, 500);
    }
};
