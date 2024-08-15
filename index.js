require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

app.post('/templatize', async (req, res) => {
  const { post, userSettings } = req.body;

  const prompt = `You are an AI assistant specializing in personalized content templatization and framework analysis. Your task is to analyze a popular social media post, identify if it follows a known content framework, and transform it into a reusable template tailored to the user's industry, target audience, and persona. Follow these steps:

1. Analyze the given post, noting its structure, tone, and key elements.
2. Identify if the post follows a known content framework, such as:
   - Promise, Proof, Path (Alex Hormozi)
   - Problem, Agitate, Solution (PAS)
   - Attention, Interest, Desire, Action (AIDA)
   - Before, After, Bridge (BAB)
   - Feature, Advantage, Benefit (FAB)
3. If a framework is identified, explicitly mention it and break down how the post utilizes it.
4. Consider the user's industry, target market, target audience, and key products/services.
5. Create personalized variables that are directly relevant to the user's context and align with the identified framework (if applicable). Use the format {{VARIABLE_NAME}} for variables.
6. Replace specific elements in the post with these personalized variables, ensuring that the replacements make sense for the user's industry and audience.
7. Maintain the overall structure, persuasive elements, and framework (if identified) of the original post.
8. Provide a list of all variables used, along with descriptions that explain how they relate to the user's specific context and the content framework.

Original Post:
${post}

User Settings:
Industry: ${userSettings.industry}
Target Market: ${userSettings.targetMarket}
Target Audience: ${userSettings.audience}
Key Products/Services: ${userSettings.keyProducts}

Please provide:
1. The identified content framework (if any), with an explanation of how the post utilizes it.
2. The templatized version of the post, tailored to the user's context and preserving the original framework.
3. A list of all personalized variables used, with descriptions explaining their relevance to the user's industry, audience, and the content framework.
4. A brief guide on how to effectively use this template, considering the framework and the user's specific audience and industry.`;

  try {
    const response = await axios.post(CLAUDE_API_URL, {
      model: "claude-3-sonnet-20240229",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: prompt
      }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY
      }
    });

    res.json({ result: response.data.content[0].text });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ error: 'Failed to templatize post' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));