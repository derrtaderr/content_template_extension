// popup.js

import { analyzePostWithClaude } from './api.js';

// ... existing code ...

async function templatizePost() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    alert('Please set your Claude API key in the settings.');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({action: "getSelectedPost"});
    if (response && response.post) {
      const analysisResult = await analyzePostWithClaude(response.post, apiKey);
      displayTemplateResult(analysisResult);
    } else {
      alert('No post selected. Please select a post first.');
    }
  } catch (error) {
    console.error('Error during templatization:', error);
    alert('An error occurred during templatization. Please try again.');
  }
}

function displayTemplateResult(result) {
  // Parse and display the result in the popup
  // You'll need to create appropriate HTML elements to show the framework, template, and placeholders
}

// Add event listener for templatize button
document.getElementById('templatizeBtn').addEventListener('click', templatizePost);

// ... rest of the existing code ...