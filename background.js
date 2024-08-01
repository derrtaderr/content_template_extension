// background.js
let selectedPost = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "postSelected") {
    selectedPost = request.post;
  } else if (request.action === "getSelectedPost") {
    sendResponse({post: selectedPost});
  } else if (request.action === "templatize") {
    const template = templatize(request.data.post, request.data);
    sendResponse({template: template});
  }
  return true;  // Indicates we will send a response asynchronously
});

function templatize(post, userData) {
  const { industry, targetMarket, audience, keyProducts } = userData;
  
  // Create a list of words to replace with variables
  const wordsToReplace = [
    ...industry.split(','),
    ...targetMarket.split(','),
    ...audience.split(','),
    ...keyProducts.split(',')
  ].map(word => word.trim().toLowerCase());

  // Replace matching words with variables
  let template = post;
  wordsToReplace.forEach((word, index) => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    template = template.replace(regex, `{{VARIABLE_${index + 1}}}`);
  });

  return template;
}