document.addEventListener('DOMContentLoaded', function() {
    const selectedPostContainer = document.getElementById('selectedPostContainer');
    const templatizeBtn = document.getElementById('templatizeBtn');
    const templateOutput = document.getElementById('templateOutput');
    const placeholderList = document.getElementById('placeholderList');
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
          if (Array.isArray(response.post)) {
            displayThread(response.post);
          } else {
            displaySinglePost(response.post);
          }
        } else {
          console.log("No post received");
          selectedPostContainer.textContent = "No post selected. Please select a post on LinkedIn or Twitter.";
        }
      });
    }
  
    function displaySinglePost(post) {
      selectedPostContainer.innerHTML = `
        <div class="post">
          <p class="post-author">${post.author}</p>
          <div class="post-content">${post.content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    }
  
    function displayThread(thread) {
      selectedPostContainer.innerHTML = '';
      thread.forEach((tweet, index) => {
        const tweetElement = document.createElement('div');
        tweetElement.className = 'tweet';
        tweetElement.innerHTML = `
          <p class="tweet-author">${tweet.author} <span class="tweet-position">${tweet.tweetNumber || `(${index + 1}/${thread.length})`}</span></p>
          <div class="tweet-content">${tweet.content.replace(/\n/g, '<br>')}</div>
        `;
        selectedPostContainer.appendChild(tweetElement);
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
              placeholderList.innerHTML = "";
            } else if (templateResponse.template) {
              templateOutput.value = templateResponse.template;
              placeholderList.innerHTML = templateResponse.placeholders.map(p => `<li>${p}</li>`).join('');
            } else {
              templateOutput.value = "Error generating template";
              placeholderList.innerHTML = "";
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