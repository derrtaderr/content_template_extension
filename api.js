const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

async function callClaudeAPI(endpoint, apiKey, body, retries = 0) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            if (response.status === 529 && retries < MAX_RETRIES) {
                const backoff = INITIAL_BACKOFF * Math.pow(2, retries);
                console.log(`Retrying in ${backoff}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return callClaudeAPI(endpoint, apiKey, body, retries + 1);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error calling Claude API:', error);
        throw error;
    }
}

async function suggestCategoryWithClaude(postContent, apiKey, userSettings, userCategories = []) {
    console.log("Suggesting category with Claude:", postContent, userSettings, userCategories);

    const categoriesString = Array.isArray(userCategories) && userCategories.length > 0 
        ? userCategories.join(', ')
        : 'No categories available';

    const prompt = `Analyze the following social media post and suggest the most appropriate category for it from the given list of categories. Consider the user's profile and target audience when making your suggestion.

Post Content:
${postContent}

User Profile: ${userSettings.userProfile}
Target Audience: ${userSettings.targetAudience}
Available Categories: ${categoriesString}

Please provide:
1. The most appropriate category name from the given list
2. A brief explanation for why this category is appropriate (1-2 sentences)`;

    try {
        const data = await callClaudeAPI(CLAUDE_API_URL, apiKey, {
            model: "claude-3-sonnet-20240229",
            max_tokens: 150,
            messages: [{role: "user", content: prompt}]
        });

        console.log("Claude API response for category suggestion:", data);
        return data.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API for category suggestion:', error);
        return null;
    }
}

async function analyzePostWithClaude(postData, apiKey, category, userSettings, userCategories, isGeneratingPost = false) {
    console.log("Analyzing post with Claude:", { postData, category, userSettings, userCategories, isGeneratingPost });

    if (!apiKey) {
        throw new Error("API key is missing");
    }

    if (!userSettings || typeof userSettings !== 'object') {
        throw new Error("Invalid user settings");
    }

    const { userProfile, targetAudience, platform } = userSettings;

    if (!userProfile || !targetAudience) {
        throw new Error("Missing required user settings");
    }

    const prompt = isGeneratingPost
        ? `Generate a new post based on this template, maintaining its exact structure, formatting, and style:

Template:
${postData}

User Profile: ${userProfile}
Target Audience: ${targetAudience}
Content Category: ${category}
Platform: ${platform || 'Not provided'}

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

User Profile: ${userProfile}
Target Audience: ${targetAudience}
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
        const data = await callClaudeAPI(CLAUDE_API_URL, apiKey, {
            model: "claude-3-sonnet-20240229",
            max_tokens: 1000,
            messages: [{role: "user", content: prompt}]
        });

        console.log("Claude API response:", data);

        if (!data.content || !data.content[0] || !data.content[0].text) {
            throw new Error("Unexpected API response format");
        }

        if (!isGeneratingPost) {
            const suggestedCategory = await suggestCategoryWithClaude(postData, apiKey, userSettings, userCategories);
            return { template: data.content[0].text, suggestedCategory };
        }

        return data.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API:', error);
        if (!isGeneratingPost) {
            return { template: null, suggestedCategory: null };
        }
        throw error; // Re-throw the error for post generation to be handled by the caller
    }
}

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
        const data = await callClaudeAPI(CLAUDE_API_URL, apiKey, {
            model: "claude-3-sonnet-20240229",
            max_tokens: 1000,
            messages: [{role: "user", content: apiPrompt}]
        });

        console.log("Claude API response for post generation:", data);
        return data.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API for post generation:', error);
        throw error;
    }
}

export { analyzePostWithClaude, generatePostWithClaude, suggestCategoryWithClaude };