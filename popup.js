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

    function loadSelectedPost() {
        chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError);
                postContent.textContent = "Error: Could not retrieve selected post.";
            } else if (response && response.post) {
                postContent.innerHTML = response.post.content;
                document.getElementById('postPlatform').textContent = response.post.platform;
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
            targetAudience: targetAudience.value
        }, function() {
            alert('Settings saved');
            showMainView();
        });
    });

    function loadSettings() {
        chrome.storage.sync.get(['userProfile', 'targetAudience'], function(items) {
            userProfile.value = items.userProfile || '';
            targetAudience.value = items.targetAudience || '';
        });
    }

    loadCategories();
    loadSettings();
    loadSelectedPost();
    showMainView();
});