import { pipeline, env } from '@xenova/transformers';

// Configuration to force remote loading
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false; // CRITICAL: Disable cache to fix 'Unexpected token <' error from cached 404s

// Force WASM to load from CDN to avoid local file 404s (Vite issue)
// Using a generic version path or the specific one if known
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';

console.log('[Semantic Search] Transformers Env Configured:', {
    allowLocal: env.allowLocalModels,
    wasmPaths: env.backends.onnx.wasm.wasmPaths
});

class SemanticSearch {
    static instance = null;

    static async getInstance() {
        if (!this.instance) {
            // Load the model. 'feature-extraction' task for embeddings.
            // 'Xenova/all-MiniLM-L6-v2' is small, fast, and good for semantic search.
            this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true, // Default
            });
        }
        return this.instance;
    }
}

export const generateEmbedding = async (text) => {
    try {
        const extractor = await SemanticSearch.getInstance();

        // Output is a Tensor. We need to extract the data.
        // pooling='mean' performs mean pooling (averaging token embeddings)
        // normalize=true ensures distinct vectors for cosine similarity
        const output = await extractor(text, { pooling: 'mean', normalize: true });

        // Convert to standard array
        return Array.from(output.data);
    } catch (error) {
        console.error("Embedding generation failed:", error);
        return null;
    }
};

export const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
};
