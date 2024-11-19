
export async function formatWithGPT(content: string, prompt: string): Promise<string> {
    try {
        if (!process.env.GPT_API_KEY) {
            throw new Error('GPT_API_KEY not configured');
        }

        if (!process.env.GPT_API_MODEL) {
            throw new Error('GPT_API_MODEL not configured');
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
                model: process.env.GPT_API_MODEL,
                max_tokens: 1000,
                temperature: 0.7
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
            .replace(/```(?:json)?/g, '')  // Remove code blocks more robustly
            .replace(/\n/g, ' ')           // Replace newlines with spaces
            .replace(/\\/g, '')            // Remove backslashes
            .replace(/\s+/g, ' ');         // Normalize whitespace
    } catch (error) {
        console.error('[OpenAI Service Error]:', error);
        // Return original content if AI processing fails
        return content;
    }
}
