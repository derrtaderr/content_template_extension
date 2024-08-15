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
    const suggestedCategorySection = document.getElementById('suggestedCategorySection');
    const suggestedCategoryElement = document.getElementById('suggestedCategory');
    const categoryExplanationElement = document.getElementById('categoryExplanation');
    const acceptCategoryBtn = document.getElementById('acceptCategoryBtn');
    const rejectCategoryBtn = document.getElementById('rejectCategoryBtn');

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
        if (select) {
            select.innerHTML = '';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        } else {
            console.error("Category select element not found");
        }
    }

    addCategoryBtn.addEventListener('click', function() {
        const category = newCategory.value.trim();
        if (category) {
            addCategory(category);
        }
    });

    function addCategory(category) {
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

                            // Display suggested category
                            if (templateResponse.suggestedCategory) {
                                const [category, explanation] = templateResponse.suggestedCategory.split('\n');
                                suggestedCategoryElement.textContent = category;
                                categoryExplanationElement.textContent = explanation;
                                suggestedCategorySection.style.display = 'block';
                            }
                        } else {
                            templateOutput.value = "Error generating template";
                        }
                    });
                });
            }
        });
    });

    acceptCategoryBtn.addEventListener('click', function() {
        const category = suggestedCategoryElement.textContent.trim();
        addCategory(category);
        suggestedCategorySection.style.display = 'none';
    });

    rejectCategoryBtn.addEventListener('click', function() {
        suggestedCategorySection.style.display = 'none';
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

    function displayGeneratedPost(postContent) {
        const platform = document.getElementById('postPlatform').textContent;

        if (platform === 'LinkedIn') {
            // For LinkedIn, preserve line breaks and add some basic styling
            generatedPostContent.innerHTML = postContent
                .replace(/\n/g, '<br>')
                .replace(/•/g, '&bull;');  // Preserve bullet points
            generatedPostContent.style.whiteSpace = 'pre-wrap';
        } else if (platform === 'Twitter') {
            // For Twitter, preserve line breaks and add some Twitter-specific styling
            generatedPostContent.innerHTML = postContent
                .replace(/\n/g, '<br>')
                .replace(/(#\w+)/g, '<span style="color: blue;">$1</span>')  // Highlight hashtags
                .replace(/(@\w+)/g, '<span style="color: blue;">$1</span>'); // Highlight mentions
            generatedPostContent.style.whiteSpace = 'pre-wrap';
        } else {
            // For any other platform, just preserve line breaks
            generatedPostContent.innerHTML = postContent.replace(/\n/g, '<br>');
        }

        generatedPostSection.style.display = 'block';
    }

    generateFromTemplateBtn.addEventListener('click', function() {
        const template = templateOutput.value;
        const category = document.getElementById('categorySelect').value;
        chrome.storage.sync.get(['userProfile', 'targetAudience'], function(items) {
            const userSettings = {
                userProfile: items.userProfile,
                targetAudience: items.targetAudience,
                platform: document.getElementById('postPlatform').textContent
            };
            console.log("Sending generate post request:", {
                template: template,
                category: category,
                userSettings: userSettings
            });
            chrome.runtime.sendMessage({
                action: "generatePost",
                template: template,
                category: category,
                userSettings: userSettings
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error generating post:", chrome.runtime.lastError);
                    displayGeneratedPost("Error generating post: " + chrome.runtime.lastError.message);
                } else if (response.error) {
                    console.error("Error generating post:", response.error);
                    displayGeneratedPost("Error generating post: " + response.error);
                } else {
                    displayGeneratedPost(response.generatedPost);
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
                displayGeneratedPost(request.generatedPost);
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