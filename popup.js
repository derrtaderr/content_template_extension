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
  
    // Load settings when popup opens
    loadSettings();
  
    // Load the selected post when the popup opens
    chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
      if (response.post) {
        selectedPost.value = response.post;
      }
    });
  
    // Handle the templatize button click
    templatizeBtn.addEventListener('click', function() {
      console.log("Templatize button clicked");
      chrome.storage.sync.get(['industry', 'targetMarket', 'audience', 'keyProducts'], function(items) {
        const userData = {
          industry: items.industry || '',
          targetMarket: items.targetMarket || '',
          audience: items.audience || '',
          keyProducts: items.keyProducts || '',
          post: selectedPost.value
        };
  
        chrome.runtime.sendMessage({action: "templatize", data: userData}, function(response) {
          if (response.template) {
            const variableTypes = {
              'INDUSTRY': 'Industry-specific term',
              'TARGET_MARKET': 'Target market',
              'AUDIENCE': 'Audience',
              'PRODUCT': 'Product or service',
              'NUMBER': 'Numeric value',
              'DATE': 'Date',
              'NAME': 'Person\'s name',
              'COMPANY': 'Company name',
              'PRODUCT_NAME': 'Product name',
              'EVENT': 'Event name'
            };
  
            let output = response.template + '\n\nVariable Key:\n';
            Object.keys(variableTypes).forEach(type => {
              const regex = new RegExp(`{{${type}_\\d+}}`, 'g');
              const matches = response.template.match(regex);
              if (matches) {
                output += `\n${variableTypes[type]}:`;
                matches.forEach(match => {
                  output += `\n  ${match}`;
                });
              }
            });
  
            templateOutput.value = output;
          } else {
            templateOutput.value = "Error: Couldn't generate template. Please try again.";
          }
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