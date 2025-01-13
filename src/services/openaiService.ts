/**
 * Formats content using a GPT-based AI model.
 *
 * This function sends a request to the GPT API to process a given content 
 * string based on a specified prompt. It returns the formatted response 
 * from the AI model.
 *
 * @param content - The content string to be formatted by the AI.
 * @param prompt - The prompt to guide the AI in formatting the content.
 * @returns A promise that resolves to the formatted string response from the AI.
 * @throws Will throw an error if the GPT_API_KEY or GPT_API_MODEL environment 
 *         variables are not configured, or if the API request fails.
 */
export async function formatWithGPT(content: string, prompt: string, model?: string): Promise<string> {
    try {
        if (!process.env.GPT_API_KEY) {
            throw new Error('GPT_API_KEY not configured');
        }

        // Use provided model or fall back to env variable
        const aiModel = model || process.env.GPT_API_MODEL;
        if (!aiModel) {
            throw new Error('No AI model specified');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GPT_API_KEY}`,
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'Crypto Alert Bot'
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content }
                ],
                model: aiModel,
                max_tokens: 20000,
                temperature: 0.7,
                // "provider": {
                //     "order": [
                //         "DeepInfra",
                //     ]
                // },
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed: ${response.status} ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid API response format');
        }

        return data.choices[0].message.content
            .trim()
            .replace(/```(?:json)?/g, '')
            .replace(/\s+/g, ' ')
            .replace(/"(.*?)"/g, (match) => match.replace(/"/g, ''));
    } catch (error) {
        console.error('[OpenAI Service Error]:', error);
        // Return original content if AI processing fails
        return content;
    }
}
