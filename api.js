const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

async function analyzePostWithClaude(postData, apiKey) {
  const prompt = `Analyze the following social media post and identify its content framework (e.g., Problem-Agitate-Solution, Before-After-Bridge). Then, generate a customizable template based on this post, replacing specific details with placeholders.

Post content: ${postData.content}
Author: ${postData.author}
Platform: ${postData.platform}
Engagement: ${JSON.stringify(postData.engagementMetrics)}

Please provide:
1. The identified content framework
2. A templatized version of the post
3. A list of placeholders and their descriptions`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
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