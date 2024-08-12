document.addEventListener('DOMContentLoaded', function() {
    const homeBtn = document.getElementById('homeBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const mainView = document.getElementById('mainView');
    const settingsView = document.getElementById('settingsView');
    const postContent = document.getElementById('postContent');
    const templateOutput = document.getElementById('templateOutput');
    const refreshBtn = document.getElementById('refreshBtn');
    const templatizeBtn = document.getElementById('templatizeBtn');
    const copyToClipboardBtn = document.getElementById('copyToClipboardBtn');
    const userProfile = document.getElementById('userProfile');
    const targetAudience = document.getElementById('targetAudience');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const newCategory = document.getElementById('newCategory');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryList = document.getElementById('categoryList');
    const generateFromTemplateBtn = document.getElementById('generateFromTemplateBtn');
    const generatedPostSection = document.getElementById('generatedPostSection');
    const generatedPostContent = document.getElementById('generatedPostContent');
    const meContent = document.getElementById('meContent');
    const personaContent = document.getElementById('personaContent');

    generateFromTemplateBtn.disabled = true;

    function showMainView() {
        mainView.style.display = 'flex';
        settingsView.style.display = 'none';
    }

    function showSettingsView() {
        mainView.style.display = 'none';
        settingsView.style.display = 'block';
    }

    homeBtn.addEventListener('click', showMainView);
    settingsBtn.addEventListener('click', showSettingsView);

    function loadCategories() {
        chrome.storage.sync.get(['categories'], function(result) {
            const categories = result.categories || [];
            categoryList.innerHTML = '';
            categories.forEach(category => {
                const li = document.createElement('li');
                li.textContent = category;
                categoryList.appendChild(li);
            });
            updateCategoryDropdown(categories);
        });
    }

    function updateCategoryDropdown(categories) {
        const select = document.getElementById('categorySelect');
        select.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    addCategoryBtn.addEventListener('click', function() {
        const category = newCategory.value.trim();
        if (category) {
            chrome.storage.sync.get(['categories'], function(result) {
                const categories = result.categories || [];
                if (!categories.includes(category)) {
                    categories.push(category);
                    chrome.storage.sync.set({categories: categories}, function() {
                        newCategory.value = '';
                        loadCategories();
                    });
                }
            });
        }
    });

    function displayPost(post) {
        postContent.innerHTML = post.content.replace(/\n/g, '<br>');
        document.getElementById('postPlatform').textContent = post.platform;
    }

    function loadSelectedPost() {
        chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError);
                postContent.textContent = "Error: Could not retrieve selected post.";
            } else if (response && response.post) {
                displayPost(response.post);
            } else {
                postContent.textContent = "No post selected. Please select a post on Twitter or LinkedIn.";
            }
        });
    }

    refreshBtn.addEventListener('click', loadSelectedPost);

    templatizeBtn.addEventListener('click', function() {
        chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
            if (response && response.post) {
                chrome.storage.sync.get(['userProfile', 'targetAudience'], function(items) {
                    chrome.runtime.sendMessage({
                        action: "templatize",
                        post: response.post,
                        userProfile: items.userProfile,
                        targetAudience: items.targetAudience
                    }, function(templateResponse) {
                        if (templateResponse.error) {
                            templateOutput.value = templateResponse.error;
                        } else if (templateResponse.template) {
                            templateOutput.value = templateResponse.template;
                            generateFromTemplateBtn.disabled = false;
                            chrome.storage.local.set({currentTemplate: templateResponse.template});
                        } else {
                            templateOutput.value = "Error generating template";
                        }
                    });
                });
            }
        });
    });

    copyToClipboardBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(templateOutput.value).then(() => {
            alert('Template copied to clipboard!');
        }, () => {
            alert('Failed to copy template. Please try again.');
        });
    });

    saveSettingsBtn.addEventListener('click', function() {
        chrome.storage.sync.set({
            userProfile: userProfile.value,
            targetAudience: targetAudience.value,
            meContent: meContent.value,
            personaContent: personaContent.value
        }, function() {
            if (chrome.runtime.lastError) {
                console.error("Error saving settings:", chrome.runtime.lastError);
                alert('Failed to save settings. Please try again.');
            } else {
                console.log("Settings saved successfully");
                alert('Settings saved');
                showMainView();
            }
        });
    });

    function loadSettings() {
        chrome.storage.sync.get(['userProfile', 'targetAudience', 'meContent', 'personaContent'], function(items) {
            userProfile.value = items.userProfile || '';
            targetAudience.value = items.targetAudience || '';
            meContent.value = items.meContent || '';
            personaContent.value = items.personaContent || '';
        });
    }

    generateFromTemplateBtn.addEventListener('click', function() {
        const template = templateOutput.value;
        const category = document.getElementById('categorySelect').value;
        chrome.storage.sync.get(['userProfile', 'targetAudience'], function(items) {
            chrome.runtime.sendMessage({
                action: "generatePost",
                template: template,
                category: category,
                userSettings: {
                    userProfile: items.userProfile,
                    targetAudience: items.targetAudience,
                    platform: document.getElementById('postPlatform').textContent
                }
            });
        });
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "postGenerated") {
            if (request.error) {
                console.error('Error generating post:', request.error);
                generatedPostContent.textContent = 'Error generating post: ' + request.error;
            } else {
                generatedPostContent.innerHTML = request.generatedPost.replace(/\n/g, '<br>');
            }
            generatedPostSection.style.display = 'block';
        }
    });

    function clearTemplate() {
        templateOutput.value = '';
        generateFromTemplateBtn.disabled = true;
        generatedPostSection.style.display = 'none';
        chrome.storage.local.remove('currentTemplate');
    }

    refreshBtn.addEventListener('click', clearTemplate);

    loadCategories();
    loadSettings();
    loadSelectedPost();
    showMainView();

    chrome.storage.local.get('currentTemplate', function(result) {
        if (result.currentTemplate) {
            templateOutput.value = result.currentTemplate;
            generateFromTemplateBtn.disabled = false;
        }
    });
});