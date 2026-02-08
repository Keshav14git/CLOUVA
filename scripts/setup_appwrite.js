import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';

const PROJECT_ID = process.env.PROJECT_ID || '6931c2ab002be1b72bb5';
const API_KEY = process.env.API_KEY || process.argv[2];
const ENDPOINT = process.env.ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';

if (!PROJECT_ID || !API_KEY) {
    console.error('Error: PROJECT_ID and API_KEY environment variables are required.');
    console.log('Usage: PROJECT_ID=your_project_id API_KEY=your_api_key node scripts/setup_appwrite.js');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = 'clouva_db';
const COLLECTION_ID = 'files';
const BUCKET_ID = 'files_bucket';

async function setup() {
    console.log('🚀 Starting Appwrite Setup...');

    // 1. Setup Database
    try {
        await databases.get(DB_ID);
        console.log(`✅ Database '${DB_ID}' already exists.`);
    } catch (error) {
        if (error.code === 404) {
            console.log(`Creating database '${DB_ID}'...`);
            await databases.create(DB_ID, 'Clouva Database');
            console.log(`✅ Database '${DB_ID}' created.`);
        } else {
            console.error('Error checking database:', error);
            return;
        }
    }

    // 2. Setup Collection
    try {
        await databases.getCollection(DB_ID, COLLECTION_ID);
        console.log(`✅ Collection '${COLLECTION_ID}' already exists.`);
    } catch (error) {
        if (error.code === 404) {
            console.log(`Creating collection '${COLLECTION_ID}'...`);
            await databases.createCollection(DB_ID, COLLECTION_ID, 'Files', [
                Permission.read(Role.any()),
                Permission.write(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]);
            console.log(`✅ Collection '${COLLECTION_ID}' created.`);

            // Create Attributes
            console.log('Creating attributes...');
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'name', 255, true);
            await databases.createIntegerAttribute(DB_ID, COLLECTION_ID, 'size', true);
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'type', 100, true);
            await databases.createUrlAttribute(DB_ID, COLLECTION_ID, 'url', true);
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'bucketId', 255, true);
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'fileId', 255, true);
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'extractedText', 10000000, false); // 10MB limit for text
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'summary', 5000, false);
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'tags', 255, false, undefined, true); // Array
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'status', 50, false, 'uploaded');

            console.log('✅ Attributes created. Note: Indexes are not created by this script.');
        } else {
            console.error('Error checking collection:', error);
            return;
        }
    }

    // 2.5 Setup Flashcards Collection
    const COLLECTION_FLASHCARDS = 'flashcards';
    try {
        await databases.getCollection(DB_ID, COLLECTION_FLASHCARDS);
        console.log(`✅ Collection '${COLLECTION_FLASHCARDS}' already exists.`);
    } catch (error) {
        if (error.code === 404) {
            console.log(`Creating collection '${COLLECTION_FLASHCARDS}'...`);
            await databases.createCollection(DB_ID, COLLECTION_FLASHCARDS, 'Flashcards', [
                Permission.read(Role.any()),
                Permission.write(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]);
            console.log(`✅ Collection '${COLLECTION_FLASHCARDS}' created.`);

            // Create Attributes
            console.log('Creating flashcard attributes...');
            await databases.createStringAttribute(DB_ID, COLLECTION_FLASHCARDS, 'fileId', 255, true);
            await databases.createStringAttribute(DB_ID, COLLECTION_FLASHCARDS, 'question', 1000, true);
            await databases.createStringAttribute(DB_ID, COLLECTION_FLASHCARDS, 'answer', 1000, true);

            console.log('✅ Flashcard attributes created.');
        } else {
            console.error('Error checking flashcards collection:', error);
            // Don't return, continue to bucket
        }
    }

    // 3. Setup Storage Bucket
    try {
        await storage.getBucket(BUCKET_ID);
        console.log(`✅ Bucket '${BUCKET_ID}' already exists.`);
    } catch (error) {
        if (error.code === 404) {
            console.log(`Creating bucket '${BUCKET_ID}'...`);
            await storage.createBucket(BUCKET_ID, 'Files Bucket', [
                Permission.read(Role.any()),
                Permission.write(Role.users()),
                Permission.delete(Role.users()),
            ], false, true, undefined, ['pdf', 'docx', 'txt', 'md']);
            console.log(`✅ Bucket '${BUCKET_ID}' created.`);
        } else {
            console.error('Error checking bucket:', error);
            return;
        }
    }

    console.log('🎉 Appwrite Setup Complete!');
}

setup();
