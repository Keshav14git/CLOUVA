import { Client, Databases, Storage, ID } from 'node-appwrite';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variables
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA_isweOdFTzICt_olbeJM6YaJQ2L9MCnE';
const DATABASE_ID = 'clouva_db';
const COLLECTION_FILES = 'files';
const BUCKET_FILES = 'files_bucket';

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);
    const storage = new Storage(client);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    try {
        const document = JSON.parse(req.body);
        const fileId = document.fileId;
        const documentId = document.$id;
        const fileType = document.type || 'application/pdf'; // Default or from DB

        if (!fileId) {
            return res.json({ error: 'No fileId found' }, 400);
        }

        log(`Processing file: ${fileId} (${fileType})`);

        const fileBuffer = await storage.getFileDownload(BUCKET_FILES, fileId);
        let extractedText = "";

        // Use createRequire for CJS modules in ESM environment
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);

        if (fileType.includes('pdf')) {
            const pdf = require('pdf-parse');
            const data = await pdf(fileBuffer);
            extractedText = data.text;
        } else if (fileType.includes('word') || fileType.includes('document')) { // docx
            const mammoth = await import('mammoth'); // mammoth usually supports ESM or default export
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
        } else if (fileType.includes('text') || fileType.includes('json') || fileType.includes('javascript')) {
            extractedText = fileBuffer.toString('utf-8');
        } else {
            // Fallback or skip for images if no OCR
            extractedText = "Preview not available for this file type.";
            log(`Skipping extraction for type: ${fileType}`);
        }

        log(`Extracted text length: ${extractedText.length}`);

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_FILES,
            documentId,
            {
                extractedText: extractedText,
                status: 'processed',
                processedAt: new Date().toISOString(),
            }
        );

        // Trigger classification (optional, or let it be triggered by update)
        // For now, we assume a separate trigger or we can call the classify function here if we want to chain them.
        // But the architecture seems to be event-driven.

        return res.json({ success: true, message: 'Text extracted and saved' });

    } catch (err) {
        error(err);
        return res.json({ error: err.message }, 500);
    }
};
