const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const generateFlashcardsAI = async (text, existingQuestions = []) => {
    if (!text) return [];

    // Truncate text to avoid context limits (approx 15k chars for safety, Llama3 has 8k context but good to be safe)
    const safeText = text.slice(0, 15000);

    const existingContext = existingQuestions.length > 0
        ? `\n\nIMPORTANT: Do NOT generate questions similar to these existing ones:\n${JSON.stringify(existingQuestions)}`
        : "";

    const prompt = `
    You are a helpful study assistant. 
    Create 5 study flashcards based on the text below.
    Return ONLY a valid JSON array of objects. 
    Each object must have exactly two keys: "question" and "answer".
    Keep questions concise and answers informative but brief.
    Do not include any markdown formatting like \`\`\`json or \`\`\`. Just the raw JSON array.
    ${existingContext}

    Text:
    ${safeText}
  `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Groq API Request failed');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '[]';

        // Robust JSON extraction: Find the first '[' and the last ']'
        const jsonMatch = content.match(/\[[\s\S]*\]/);

        if (!jsonMatch) {
            throw new Error("No JSON array found in response");
        }

        const cleanJson = jsonMatch[0];
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Groq AI Error:", error);
        throw error;
    }
};

export const chatWithGroq = async (systemPrompt, userMessage) => {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: `${systemPrompt}\n\n${userMessage}`
                    }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.1,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Chat Request failed');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "I couldn't generate a response.";

    } catch (error) {
        console.error("Groq Chat Error:", error);
        throw error;
    }
};
