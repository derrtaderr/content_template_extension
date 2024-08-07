const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

async function analyzePostWithClaude(postData, apiKey, category, userSettings) {
  console.log("Analyzing post with Claude:", postData, category, userSettings);

  const prompt = `As an AI specialized in content templatization, your task is to create a template based on the given social media post. Consider the user's profile and target audience to guide your templatization process, making it more relevant and effective for their specific needs.

User Profile: ${userSettings.userProfile}
Target Audience: ${userSettings.targetAudience}
Content Category: ${category}

Original Post:
${postData}

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

export { analyzePostWithClaude };