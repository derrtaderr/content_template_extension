// background.js
let selectedPost = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === "postSelected") {
    selectedPost = request.post;
  } else if (request.action === "getSelectedPost") {
    sendResponse({post: selectedPost});
  } else if (request.action === "templatize") {
    const template = enhancedTemplatize(request.data.post, request.data);
    sendResponse({template: template});
  }
  return true;  // Indicates we will send a response asynchronously
});

function enhancedTemplatize(post, userData) {
  const { industry, targetMarket, audience, keyProducts } = userData;
  
  // Define patterns to recognize and replace
  const patterns = [
    { type: 'INDUSTRY', words: industry.split(',').map(w => w.trim()) },
    { type: 'TARGET_MARKET', words: targetMarket.split(',').map(w => w.trim()) },
    { type: 'AUDIENCE', words: audience.split(',').map(w => w.trim()) },
    { type: 'PRODUCT', words: keyProducts.split(',').map(w => w.trim()) },
    { type: 'NUMBER', regex: /\b\d+(\.\d+)?%?\b/g },
    { type: 'DATE', regex: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{2,4})\b/gi },
    { type: 'NAME', regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g }
  ];

  let template = post;
  let variableCount = 1;

  patterns.forEach(pattern => {
    if (pattern.words) {
      pattern.words.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        template = template.replace(regex, `{{${pattern.type}_${variableCount++}}}`);
      });
    } else if (pattern.regex) {
      template = template.replace(pattern.regex, match => `{{${pattern.type}_${variableCount++}}}`);
    }
  });

  return template;
}