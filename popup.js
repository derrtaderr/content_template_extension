// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const industrySelect = document.getElementById('industrySelect');
    const targetMarket = document.getElementById('targetMarket');
    const audience = document.getElementById('audience');
    const keyProducts = document.getElementById('keyProducts');
    const selectedPost = document.getElementById('selectedPost');
    const templatizeBtn = document.getElementById('templatizeBtn');
    const templateOutput = document.getElementById('templateOutput');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const mainSection = document.getElementById('mainSection');
    const settingsSection = document.getElementById('settingsSection');
  
    console.log("Popup script loaded");
  
    // Load settings when popup opens
    loadSettings();
  
    // Request the latest selected post when the popup opens
    function getSelectedPost() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "getSelectedPost"}, function(response) {
            if (chrome.runtime.lastError) {
              console.log("Error sending message:", chrome.runtime.lastError.message);
              selectedPost.value = "Please refresh the LinkedIn page and try again.";
            } else if (response && response.post) {
              selectedPost.value = response.post;
              console.log("Received selected post in popup:", response.post);
            } else {
              selectedPost.value = "Please select a post on LinkedIn and try again.";
            }
          });
        } else {
          console.log("No active tab found");
          selectedPost.value = "Please open LinkedIn and select a post.";
        }
      });
    }
  
    getSelectedPost();
  
    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "postSelected") {
        selectedPost.value = request.post;
        console.log("Received selected post:", request.post);
        sendResponse({received: true});
      }
    });
  
    // Handle the templatize button click
    templatizeBtn.addEventListener('click', function() {
      console.log("Templatize button clicked");
      chrome.storage.sync.get(['industry', 'targetMarket', 'audience', 'keyProducts'], function(items) {
        const userSettings = {
          industry: items.industry || '',
          targetMarket: items.targetMarket || '',
          audience: items.audience || '',
          keyProducts: items.keyProducts || ''
        };
  
        fetch('http://localhost:3000/templatize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post: selectedPost.value,
            userSettings: userSettings
          })
        })
        .then(response => response.json())
        .then(data => {
          templateOutput.value = data.result;
        })
        .catch(error => {
          console.error('Error:', error);
          templateOutput.value = "Error: Couldn't generate template. Please try again.";
        });
      });
    });
  
    // Open settings
    openSettingsBtn.addEventListener('click', function() {
      mainSection.style.display = 'none';
      settingsSection.style.display = 'block';
    });
  
    // Save settings
    saveSettingsBtn.addEventListener('click', function() {
      chrome.storage.sync.set({
        industry: industrySelect.value,
        targetMarket: targetMarket.value,
        audience: audience.value,
        keyProducts: keyProducts.value
      }, function() {
        console.log('Settings saved');
        mainSection.style.display = 'block';
        settingsSection.style.display = 'none';
      });
    });
  
    // Close settings without saving
    closeSettingsBtn.addEventListener('click', function() {
      loadSettings();
      mainSection.style.display = 'block';
      settingsSection.style.display = 'none';
    });
  
    function loadSettings() {
      chrome.storage.sync.get(['industry', 'targetMarket', 'audience', 'keyProducts'], function(items) {
        industrySelect.value = items.industry || '';
        targetMarket.value = items.targetMarket || '';
        audience.value = items.audience || '';
        keyProducts.value = items.keyProducts || '';
      });
    }
  });