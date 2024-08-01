// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const industrySelect = document.getElementById('industrySelect');
    const targetMarket = document.getElementById('targetMarket');
    const audience = document.getElementById('audience');
    const keyProducts = document.getElementById('keyProducts');
    const selectedPost = document.getElementById('selectedPost');
    const templatizeBtn = document.getElementById('templatizeBtn');
    const templateOutput = document.getElementById('templateOutput');
  
    // Load the selected post when the popup opens
    chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
      if (response.post) {
        selectedPost.value = response.post;
      }
    });
  
    // Handle the templatize button click
    templatizeBtn.addEventListener('click', function() {
      const userData = {
        industry: industrySelect.value,
        targetMarket: targetMarket.value,
        audience: audience.value,
        keyProducts: keyProducts.value,
        post: selectedPost.value
      };
  
      chrome.runtime.sendMessage({action: "templatize", data: userData}, function(response) {
        if (response.template) {
          templateOutput.value = response.template;
        } else {
          templateOutput.value = "Error: Couldn't generate template. Please try again.";
        }
      });
    });
  });