
export async function formatWithGPT(content: string, prompt: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.GPT_API_KEY,
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content }
            ],
            model: process.env.GPT_API_MODEL,
        })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim().replace('```json', '').replaceAll('```', '').replaceAll('\n', '').replaceAll('\\', '');
}
