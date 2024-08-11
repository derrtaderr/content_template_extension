const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

async function analyzePostWithClaude(postData, apiKey, category, userSettings, isGeneratingPost = false) {
    console.log("Analyzing post with Claude:", postData, category, userSettings, isGeneratingPost);

    const prompt = isGeneratingPost
        ? `Generate a new post based on this template, maintaining its exact structure, formatting, and style:

Template:
${postData}

User Profile: ${userSettings.userProfile}
Target Audience: ${userSettings.targetAudience}
Content Category: ${category}
Platform: ${userSettings.platform}

Instructions:
1. Strictly adhere to the template's structure, including line breaks, bullet points, and any special formatting.
2. Replace placeholders with relevant content that aligns with the user's profile and target audience.
3. Maintain the tone and style of the original template.
4. Ensure the generated post is tailored to the user's specific context and the given category.
5. Remove any underscores from placeholder words (e.g., _BUSINESS_GOAL_ should become BUSINESS GOAL).

Please provide only the generated post, exactly following the template's structure and formatting.`
        : `Create a template based on the given social media post:

Original Post:
${postData}

User Profile: ${userSettings.userProfile}
Target Audience: ${userSettings.targetAudience}
Content Category: ${category}

Instructions:
1. Analyze the post structure, tone, and key elements.
2. Create a template by replacing specific details with placeholders in ALL_CAPS_WITH_UNDERSCORES format.
3. Ensure the template aligns with the user's profile and resonates with their target audience.
4. Maintain the original post's structure, formatting, and line breaks.
5. The template should be adaptable for creating similar content in the future.

Please provide:
1. A templatized version of the post, maintaining the original structure and line breaks.
2. A list of placeholders used and their descriptions, explaining how they relate to the user's profile or target audience.`;

    try {
        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1000,
                messages: [{role: "user", content: prompt}]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Claude API response:", data);
        return data.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API:', error);
        throw error;
    }
}

// This function is not being used currently, but kept for potential future use
async function generatePostWithClaude(prompt, apiKey, category, userSettings) {
    const apiPrompt = `Generate a social media post based on the following:
    Prompt: ${prompt}
    Category: ${category}
    User Profile: ${userSettings.userProfile}
    Target Audience: ${userSettings.targetAudience}

    Instructions:
    1. Create an engaging post suitable for the specified social media platform.
    2. Ensure the content aligns with the user's profile and resonates with their target audience.
    3. Incorporate elements typical of the chosen category.
    4. Keep the post within platform-specific character limits.

    Please provide only the generated post.`;

    try {
        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1000,
                messages: [{role: "user", content: apiPrompt}]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Claude API response for post generation:", data);
        return data.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API for post generation:', error);
        throw error;
    }
}

export { analyzePostWithClaude, generatePostWithClaude };