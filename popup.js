import { analyzePostWithClaude } from './api.js';
import { templateManager } from './templateManager.js';

document.addEventListener('DOMContentLoaded', function() {
  const selectedPostContainer = document.getElementById('selectedPostContainer');
  const templatizeBtn = document.getElementById('templatizeBtn');
  const templateOutput = document.getElementById('templateOutput');
  const frameworkOutput = document.getElementById('frameworkOutput');
  const placeholderList = document.getElementById('placeholderList');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const mainSection = document.getElementById('mainSection');
  const settingsSection = document.getElementById('settingsSection');
  const refreshBtn = document.getElementById('refreshBtn');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const displayTemplatesBtn = document.getElementById('displayTemplatesBtn');
  const templateList = document.getElementById('templateList');

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
          <strong>Author:</strong> ${response.post.author}<br>
          <strong>Engagement:</strong> ${JSON.stringify(response.post.engagementMetrics)}<br><br>
          ${response.post.content}
        `;
      } else {
        console.log("No post received");
        selectedPostContainer.textContent = "No post selected. Please select a post on LinkedIn.";
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
    const resultLines = result.split('\n');
    let currentSection = '';
    frameworkOutput.textContent = '';
    templateOutput.innerHTML = '';
    placeholderList.innerHTML = '';

    for (const line of resultLines) {
      if (line.startsWith('1. ')) {
        currentSection = 'framework';
      } else if (line.startsWith('2. ')) {
        currentSection = 'template';
      } else if (line.startsWith('3. ')) {
        currentSection = 'placeholders';
      } else if (currentSection === 'framework') {
        frameworkOutput.textContent += line + '\n';
      } else if (currentSection === 'template') {
        templateOutput.innerHTML += line + '<br>';
      } else if (currentSection === 'placeholders') {
        const li = document.createElement('li');
        li.textContent = line;
        placeholderList.appendChild(li);
      }
    }
  }

  templatizeBtn.addEventListener('click', templatizePost);

  async function saveTemplate() {
    const templateContent = templateOutput.innerHTML;
    const framework = frameworkOutput.textContent;
    await templateManager.saveTemplate({content: templateContent, framework: framework});
    alert('Template saved successfully!');
  }

  async function displaySavedTemplates() {
    const templates = await templateManager.loadTemplates();
    templateList.innerHTML = '';
    templates.forEach(template => {
      const li = document.createElement('li');
      li.textContent = `${template.framework}: ${template.content.substring(0, 50)}...`;
      templateList.appendChild(li);
    });
  }

  saveTemplateBtn.addEventListener('click', saveTemplate);
  displayTemplatesBtn.addEventListener('click', displaySavedTemplates);

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

  loadSettings();
});