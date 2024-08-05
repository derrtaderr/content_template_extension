import { analyzePostWithClaude } from './api.js';

document.addEventListener('DOMContentLoaded', function() {
  const selectedPostContainer = document.getElementById('selectedPostContainer');
  const templatizeBtn = document.getElementById('templatizeBtn');
  const templateOutput = document.getElementById('templateOutput');
  const placeholderList = document.getElementById('placeholderList');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const mainSection = document.getElementById('mainSection');
  const settingsSection = document.getElementById('settingsSection');
  const refreshBtn = document.getElementById('refreshBtn');
  const copyTemplateBtn = document.getElementById('copyTemplateBtn');
  const categorySelect = document.getElementById('categorySelect');

  const industrySelect = document.getElementById('industrySelect');
  const targetMarket = document.getElementById('targetMarket');
  const audience = document.getElementById('audience');
  const keyProducts = document.getElementById('keyProducts');
  const apiKeyInput = document.getElementById('apiKey');

  console.log("Popup script loaded");

  function loadSelectedPost() {
    console.log("Requesting selected post");
    chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError);
        selectedPostContainer.textContent = "Error: Could not retrieve selected post.";
      } else if (response && response.post) {
        console.log("Received post:", response.post);
        selectedPostContainer.innerHTML = `
          <strong>${response.post.author}</strong> ${response.post.authorTitle ? `• ${response.post.authorTitle}` : ''}<br>
          <small>${response.post.timestamp}</small><br><br>
          ${response.post.content.replace(/\n/g, '<br>')}<br><br>
          <small>Likes: ${response.post.engagementMetrics.likes} • Comments: ${response.post.engagementMetrics.comments}</small>
        `;
      } else {
        console.log("No post received");
        selectedPostContainer.textContent = "No post selected. Please select a post on LinkedIn or Twitter.";
      }
    });
  }

  loadSelectedPost();

  refreshBtn.addEventListener('click', loadSelectedPost);

  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey'], function(result) {
        resolve(result.apiKey || '');
      });
    });
  }

  async function templatizePost() {
    const apiKey = await getApiKey();
    if (!apiKey) {
      openSettings();
      alert('Please set your Claude API key in the settings before templatizing.');
      return;
    }
  
    try {
      console.log("Requesting selected post for templatization");
      const response = await chrome.runtime.sendMessage({action: "getSelectedPost"});
      console.log("Received response:", response);
      
      if (response && response.post) {
        const category = categorySelect.value;
        console.log("Selected category:", category);
        console.log("Sending post to Claude API:", response.post);
        const analysisResult = await analyzePostWithClaude(response.post, apiKey, category);
        console.log("Received analysis result:", analysisResult);
        displayTemplateResult(analysisResult);
      } else {
        console.error('No post data received:', response);
        alert('No post selected. Please select a post first.');
      }
    } catch (error) {
      console.error('Error during templatization:', error);
      alert('An error occurred during templatization. Please try again.');
    }
  }

  function displayTemplateResult(result) {
    const resultLines = result.split('\n');
    let currentSection = '';
    
    if (templateOutput) templateOutput.value = '';
    if (placeholderList) placeholderList.innerHTML = '';

    for (const line of resultLines) {
      if (line.startsWith('1. ')) {
        currentSection = 'template';
      } else if (line.startsWith('2. ')) {
        currentSection = 'placeholders';
      } else if (currentSection === 'template' && templateOutput) {
        templateOutput.value += line + '\n';
      } else if (currentSection === 'placeholders' && placeholderList) {
        const li = document.createElement('li');
        li.textContent = line;
        placeholderList.appendChild(li);
      }
    }
  }

  function copyToClipboard() {
    const templateContent = templateOutput.value;
    navigator.clipboard.writeText(templateContent).then(() => {
      alert('Template copied to clipboard!');
    }, () => {
      alert('Failed to copy template. Please try again.');
    });
  }

  templatizeBtn.addEventListener('click', templatizePost);
  copyTemplateBtn.addEventListener('click', copyToClipboard);

  function openSettings() {
    mainSection.style.display = 'none';
    settingsSection.style.display = 'block';
  }

  openSettingsBtn.addEventListener('click', openSettings);

  function saveApiKey() {
    const apiKey = apiKeyInput.value;
    chrome.storage.sync.set({apiKey: apiKey}, function() {
      console.log('API key saved');
    });
  }

  saveSettingsBtn.addEventListener('click', function() {
    saveApiKey();
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

  closeSettingsBtn.addEventListener('click', function() {
    loadSettings();
    mainSection.style.display = 'block';
    settingsSection.style.display = 'none';
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

  function loadCategories() {
    const categories = ['Growth', 'Knowledge', 'Authority', 'Empathize'];
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.toLowerCase();
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }

  loadSettings();
  loadCategories();
});