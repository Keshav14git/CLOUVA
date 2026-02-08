import { Client, Databases, ID } from 'node-appwrite';
import { GoogleGenerativeAI } from '@google/generative-ai';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DATABASE_ID = 'clouva_db';
const COLLECTION_FLASHCARDS = 'flashcards';

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    try {
        const { extractedText, fileId } = JSON.parse(req.body);

        if (!extractedText) {
            return res.json({ message: 'No text for flashcards' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Generate 5 Q&A flashcards based on the following text. Return a JSON array of objects with "question" and "answer" keys. Text: ${extractedText.substring(0, 5000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const flashcards = JSON.parse(cleanJson);

        for (const card of flashcards) {
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_FLASHCARDS,
                ID.unique(),
                {
                    fileId: fileId,
                    question: card.question,
                    answer: card.answer,
                    createdAt: new Date().toISOString()
                }
            );
        }

        return res.json({ success: true, count: flashcards.length });

    } catch (err) {
        error(err);
        return res.json({ error: err.message }, 500);
    }
};
