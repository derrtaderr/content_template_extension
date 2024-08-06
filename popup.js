document.addEventListener('DOMContentLoaded', function() {
    const selectedPostContainer = document.getElementById('selectedPostContainer');
    const templatizeBtn = document.getElementById('templatizeBtn');
    const templateOutput = document.getElementById('templateOutput');
    const refreshBtn = document.getElementById('refreshBtn');
    const categorySelect = document.getElementById('categorySelect');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const mainSection = document.getElementById('mainSection');
    const settingsSection = document.getElementById('settingsSection');
    const industrySelect = document.getElementById('industrySelect');
    const targetMarket = document.getElementById('targetMarket');
    const audience = document.getElementById('audience');
    const keyProducts = document.getElementById('keyProducts');
    const apiKeyInput = document.getElementById('apiKey');
    const copyTemplateBtn = document.getElementById('copyToClipboardBtn');
  
    console.log("Popup script loaded");
  
    function loadSelectedPost() {
        console.log("Requesting selected post");
        chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError);
                selectedPostContainer.textContent = "Error: Could not retrieve selected post.";
            } else if (response && response.post) {
                console.log("Received post:", response.post);
                selectedPostContainer.textContent = response.post.content;
            } else {
                console.log("No post received");
                selectedPostContainer.textContent = "No post selected. Please select a post on LinkedIn or Twitter.";
            }
        });
    }
  
    refreshBtn.addEventListener('click', loadSelectedPost);
  
    templatizeBtn.addEventListener('click', function() {
        console.log("Templatize button clicked");
        chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
            if (response && response.post) {
                const category = categorySelect.value;
                chrome.runtime.sendMessage({
                    action: "templatize",
                    post: response.post,
                    category: category
                }, function(templateResponse) {
                    if (templateResponse.error) {
                        templateOutput.value = templateResponse.error;
                    } else if (templateResponse.template) {
                        templateOutput.value = templateResponse.template;
                    } else {
                        templateOutput.value = "Error generating template";
                    }
                });
            }
        });
    });
  
    copyTemplateBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(templateOutput.value).then(() => {
            alert('Template copied to clipboard!');
        }, () => {
            alert('Failed to copy template. Please try again.');
        });
    });
  
    function openSettings() {
        mainSection.style.display = 'none';
        settingsSection.style.display = 'block';
    }
  
    function closeSettings() {
        mainSection.style.display = 'block';
        settingsSection.style.display = 'none';
    }
  
    openSettingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
  
    saveSettingsBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value;
        chrome.storage.sync.set({
            apiKey: apiKey,
            industry: industrySelect.value,
            targetMarket: targetMarket.value,
            audience: audience.value,
            keyProducts: keyProducts.value
        }, function() {
            console.log('Settings saved');
            closeSettings();
        });
    });
  
    function loadSettings() {
        chrome.storage.sync.get(['industry', 'targetMarket', 'audience', 'keyProducts', 'apiKey'], function(items) {
            industrySelect.value = items.industry || '';
            targetMarket.value = items.targetMarket || '';
            audience.value = items.audience || '';
            keyProducts.value = items.keyProducts || '';
            apiKeyInput.value = items.apiKey || '';
        });
    }
  
    loadSettings();
    loadSelectedPost();
});