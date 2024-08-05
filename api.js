const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

async function analyzePostWithClaude(postData, apiKey, category) {
  const prompt = `Analyze the following social media post and create a template based on Justin Welsh's ${category} category. Replace specific details with placeholders in ALL_CAPS_WITH_UNDERSCORES. Maintain the original structure, formatting, and line breaks. Do not include any HTML tags or markdown formatting in the output.

Post content:
${postData.content}

Author: ${postData.author}
Platform: ${postData.platform}
Engagement: ${JSON.stringify(postData.engagementMetrics)}

Please provide:
1. A templatized version of the post, maintaining the original structure and line breaks
2. A list of placeholders and their descriptions`;

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
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

export { analyzePostWithClaude };