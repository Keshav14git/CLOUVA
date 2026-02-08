import { Client, Account, Databases, Storage, Functions } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

client.ping().then(() => {
    console.log('Appwrite is connected! 🟢');
}, (error) => {
    console.error('Appwrite connection failed 🔴', error);
});

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export const DATABASE_ID = 'clouva_db';
export const COLLECTION_FILES = 'files';
export const BUCKET_FILES = 'files_bucket';
export const COLLECTION_FLASHCARDS = 'flashcards';
