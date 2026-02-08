import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-2.0-flash-exp"
];

async function test() {
    let output = "Testing models:\n";
    console.log("Testing models...");

    for (const modelName of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            const msg = `✅ ${modelName}: SUCCESS`;
            console.log(msg);
            output += msg + "\n";
        } catch (error) {
            let msg = "";
            if (error.message.includes('429')) {
                msg = `⚠️ ${modelName}: 429 Quota Exceeded`;
            } else if (error.message.includes('404')) {
                msg = `❌ ${modelName}: 404 Not Found`;
            } else {
                msg = `❌ ${modelName}: Error - ${error.message.split('\n')[0]}`;
            }
            console.log(msg);
            output += msg + "\n";
        }
    }

    fs.writeFileSync('test_results.txt', output);
}

test();
