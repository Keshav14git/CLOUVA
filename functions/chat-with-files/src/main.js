import { Client, Databases, Query } from 'node-appwrite';
import { GoogleGenerativeAI } from '@google/generative-ai';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
// Fallback API Key to ensure functionality even if env var is missing
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA_isweOdFTzICt_olbeJM6YaJQ2L9MCnE';

const DATABASE_ID = 'clouva_db';
const COLLECTION_FILES = 'files';

export default async ({ req, res, log, error }) => {
    try {
        log("Function started.");

        // Initialize Appwrite
        const client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID)
            .setKey(APPWRITE_API_KEY);

        const databases = new Databases(client);

        // Retrieve Message
        let payload;
        try {
            payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (parseErr) {
            return res.json({ error: "Invalid JSON body" }, 400);
        }

        const { message } = payload;
        if (!message) {
            return res.json({ error: "Message is required" }, 400);
        }

        log(`Processing message: ${message}`);

        // Search for Files
        let context = "";
        const sources = [];

        try {
            const files = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_FILES,
                [
                    Query.equal('status', 'processed'),
                    Query.orderDesc('$createdAt'),
                    Query.limit(5)
                ]
            );

            files.documents.forEach(file => {
                if (file.extractedText) {
                    const snippet = file.extractedText.substring(0, 8000); // Reasonable limit
                    context += `\n--- File: ${file.name} ---\n${snippet}\n`;
                    sources.push({ name: file.name, id: file.$id, page: 1 });
                }
            });
        } catch (dbError) {
            log(`Database warning: ${dbError.message}`);
            // Continue with empty context if DB fails (soft fail)
        }

        if (!context) {
            context = "No files found or processed yet.";
        }

        // Initialize Gemini
        if (!GEMINI_API_KEY) {
            throw new Error("Gemini API Key is missing");
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are CLOUVA, an intelligent assistant.
        User Question: "${message}"
        
        Context from files:
        ${context}
        
        Answer based ONLY on the context if possible. Be concise.`;

        log("Generating content with Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        log("Success.");

        return res.json({
            response: text,
            sources: sources
        });

    } catch (err) {
        error(`Function Error: ${err.message}`);
        // Return JSON error so frontend sees it (instead of crashing)
        return res.json({
            error: `Internal Server Error: ${err.message}`
        }, 500);
    }
};
