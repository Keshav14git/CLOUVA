import { pipeline, env } from '@xenova/transformers';

// Configuration to force remote loading and resolve 'Unexpected token <' errors
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false; // CRITICAL: Disable cache to fix 'Unexpected token <' error from cached 404s

// Force WASM to load from CDN to avoid local file 404s (Vite issue)
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';

let embedder = null;

const getEmbedder = async () => {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true
        });
    }
    return embedder;
};

// Pre-warm the model immediately
getEmbedder().catch(err => console.error('Preprocessing Error:', err));

const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

self.onmessage = async (event) => {
    const { action, data } = event.data;

    if (action === 'process') {
        try {
            const embed = await getEmbedder();
            const files = data;
            const embeddings = [];

            // 1. Generate Embeddings for all files
            for (const file of files) {
                // Combine name and content/summary for richer context
                const textToEmbed = `${file.name} ${file.ai_summary || ''}`.substring(0, 1000);
                const output = await embed(textToEmbed, { pooling: 'mean', normalize: true });
                embeddings.push({
                    id: file.$id,
                    name: file.name,
                    category: file.category,
                    ai_categories: file.ai_categories || [],
                    vector: Array.from(output.data)
                });
            }

            // 2. Compute Semantic Links
            const semanticLinks = [];
            for (let i = 0; i < embeddings.length; i++) {
                for (let j = i + 1; j < embeddings.length; j++) {
                    const fileA = embeddings[i];
                    const fileB = embeddings[j];

                    const similarity = cosineSimilarity(fileA.vector, fileB.vector);

                    // Threshold for a "Semantic Connection"
                    if (similarity > 0.8) {
                        // Find common categories for "Connection Reason"
                        const commonCats = fileA.ai_categories.filter(c => fileB.ai_categories.includes(c));

                        semanticLinks.push({
                            source: fileA.id,
                            target: fileB.id,
                            similarity,
                            type: 'semantic',
                            reason: commonCats.length > 0
                                ? `Shared Topics: ${commonCats.slice(0, 2).join(', ')}`
                                : 'Conceptual Similarity'
                        });
                    }
                }
            }

            self.postMessage({ action: 'result', data: semanticLinks });
        } catch (error) {
            console.error('AI Worker Error:', error);
            self.postMessage({ action: 'error', message: error.message });
        }
    }
};
