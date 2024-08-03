document.addEventListener('DOMContentLoaded', function() {
    const selectedPost = document.getElementById('selectedPost');
    const templatizeBtn = document.getElementById('templatizeBtn');
    const templateOutput = document.getElementById('templateOutput');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const mainSection = document.getElementById('mainSection');
    const settingsSection = document.getElementById('settingsSection');
  
    const industrySelect = document.getElementById('industrySelect');
    const targetMarket = document.getElementById('targetMarket');
    const audience = document.getElementById('audience');
    const keyProducts = document.getElementById('keyProducts');
  
    console.log("Popup script loaded");
  
    function loadSelectedPost() {
      console.log("Requesting selected post");
      chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError);
          selectedPost.value = "Error: Could not retrieve selected post.";
        } else if (response && response.post) {
          console.log("Received post:", response.post);
          selectedPost.value = response.post;
          selectedPost.style.whiteSpace = 'pre-wrap';  // Preserve formatting
        } else {
          console.log("No post received");
          selectedPost.value = "No post selected. Please select a post on LinkedIn.";
        }
      });
    }
  
    loadSelectedPost();
  
    // Refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh Post';
    refreshBtn.addEventListener('click', loadSelectedPost);
    // Insert the refresh button before the templatize button in the main section
    mainSection.insertBefore(refreshBtn, templatizeBtn);
  
    // Templatize button
    templatizeBtn.addEventListener('click', function() {
      console.log("Templatize button clicked");
      chrome.storage.sync.get(['industry', 'targetMarket', 'audience', 'keyProducts'], function(items) {
        const userSettings = {
          industry: items.industry || '',
          targetMarket: items.targetMarket || '',
          audience: items.audience || '',
          keyProducts: items.keyProducts || ''
        };
  
        let templatedPost = selectedPost.value;
        templatedPost = templatedPost.replace(/industry/gi, `{{INDUSTRY}}`);
        templatedPost = templatedPost.replace(/market/gi, `{{TARGET_MARKET}}`);
        templatedPost = templatedPost.replace(/audience/gi, `{{AUDIENCE}}`);
        templatedPost = templatedPost.replace(/product/gi, `{{PRODUCT}}`);
  
        templateOutput.value = templatedPost;
        console.log("Templatized post:", templatedPost);
      });
    });
  
    // Open settings
    openSettingsBtn.addEventListener('click', function() {
      console.log("Open settings clicked");
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
  
    loadSettings();
  });