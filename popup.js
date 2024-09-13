document.addEventListener('DOMContentLoaded', function() {
    function getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    }

    const elements = {
        homeBtn: getElement('homeBtn'),
        settingsBtn: getElement('settingsBtn'),
        templatesBtn: getElement('templatesBtn'),
        mainView: getElement('mainView'),
        settingsView: getElement('settingsView'),
        templatesView: getElement('templatesView'),
        postContent: getElement('postContent'),
        templateOutput: getElement('templateOutput'),
        refreshBtn: getElement('refreshBtn'),
        templatizeBtn: getElement('templatizeBtn'),
        copyToClipboardBtn: getElement('copyToClipboardBtn'),
        userProfile: getElement('userProfile'),
        targetAudience: getElement('targetAudience'),
        saveSettingsBtn: getElement('saveSettingsBtn'),
        newCategory: getElement('newCategory'),
        addCategoryBtn: getElement('addCategoryBtn'),
        categoryList: getElement('categoryList'),
        generateFromTemplateBtn: getElement('generateFromTemplateBtn'),
        generatedPostSection: getElement('generatedPostSection'),
        generatedPostContent: getElement('generatedPostContent'),
        meContent: getElement('meContent'),
        personaContent: getElement('personaContent'),
        categoriesList: getElement('categoriesList'),
        templatesList: getElement('templatesList'),
        suggestedCategorySection: getElement('suggestedCategorySection'),
        suggestedCategoryElement: getElement('suggestedCategory'),
        categoryExplanationElement: getElement('categoryExplanation'),
        acceptCategoryBtn: getElement('acceptCategoryBtn'),
        rejectCategoryBtn: getElement('rejectCategoryBtn'),
        postPlatform: getElement('postPlatform'),
        categorySelect: getElement('categorySelect'),
        saveTemplateBtn: getElement('saveTemplateBtn'),
        generatedPostView: getElement('generatedPostView'),
        backToMainBtn: getElement('backToMainBtn'),
        copyGeneratedPostBtn: getElement('copyGeneratedPostBtn'),
        backToTemplatizedBtn: getElement('backToTemplatizedBtn'),
        templateSearch: getElement('templateSearch'),
        categoryFilter: getElement('categoryFilter'),
        templateDetailView: getElement('templateDetailView'),
        templateContent: getElement('templateContent'),
        editTemplateBtn: getElement('editTemplateBtn'),
        deleteTemplateBtn: getElement('deleteTemplateBtn'),
        backToListBtn: getElement('backToListBtn')
    };

    // Initialize dbFunctions
    const dbFunctions = new DatabaseFunctions();

    if (elements.generateFromTemplateBtn) {
        elements.generateFromTemplateBtn.disabled = true;
    }

    function showPage(pageId) {
        if (elements.mainView) elements.mainView.style.display = pageId === 'mainView' ? 'flex' : 'none';
        if (elements.settingsView) elements.settingsView.style.display = pageId === 'settingsView' ? 'block' : 'none';
        if (elements.templatesView) elements.templatesView.style.display = pageId === 'templatesView' ? 'block' : 'none';
        if (elements.generatedPostView) elements.generatedPostView.style.display = pageId === 'generatedPostView' ? 'block' : 'none';
        if (elements.templateDetailView) elements.templateDetailView.style.display = pageId === 'templateDetailView' ? 'block' : 'none';
    }

    if (elements.homeBtn) elements.homeBtn.addEventListener('click', () => showPage('mainView'));
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', () => showPage('settingsView'));
    if (elements.templatesBtn) elements.templatesBtn.addEventListener('click', () => {
        showPage('templatesView');
        loadSavedTemplates();
    });

    function loadCategories() {
        chrome.storage.sync.get(['categories'], function(result) {
            const categories = result.categories || [];
            if (elements.categoryList) {
                elements.categoryList.innerHTML = '';
                categories.forEach(category => {
                    const li = document.createElement('li');
                    li.textContent = category;
                    elements.categoryList.appendChild(li);
                });
            }
            updateCategoryDropdown(categories);
        });
    }

    function updateCategoryDropdown(categories) {
        const mainSelect = document.getElementById('categorySelect');
        const modalSelect = document.getElementById('saveTemplateCategorySelect');
        
        [mainSelect, modalSelect].forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Select a category</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    select.appendChild(option);
                });
            }
        });
    }

    if (elements.addCategoryBtn) {
        elements.addCategoryBtn.addEventListener('click', function() {
            const category = elements.newCategory ? elements.newCategory.value.trim() : '';
            if (category) {
                addCategory(category);
            }
        });
    }

    function addCategory(category) {
        chrome.storage.sync.get(['categories'], function(result) {
            const categories = result.categories || [];
            if (!categories.includes(category)) {
                categories.push(category);
                chrome.storage.sync.set({categories: categories}, function() {
                    if (elements.newCategory) elements.newCategory.value = '';
                    loadCategories();
                    showFeedback('Category added successfully', 'success');
                });
            } else {
                showFeedback('Category already exists', 'info');
            }
        });
    }

    function displayPost(post) {
        if (elements.postContent) {
            elements.postContent.innerHTML = post.content.replace(/\n/g, '<br>');
        }
        if (elements.postPlatform) {
            elements.postPlatform.textContent = post.platform;
        }
    }

    function loadSelectedPost() {
        chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError);
                if (elements.postContent) elements.postContent.textContent = "Error: Could not retrieve selected post.";
                showFeedback('Failed to load selected post', 'error');
            } else if (response && response.post) {
                displayPost(response.post);
                showFeedback('Post loaded successfully', 'success');
            } else {
                if (elements.postContent) elements.postContent.textContent = "No post selected. Please select a post on Twitter or LinkedIn.";
                showFeedback('No post selected', 'info');
            }
        });
    }

    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', loadSelectedPost);
    }

    if (elements.templatizeBtn) {
        elements.templatizeBtn.addEventListener('click', function() {
            showProgressBar(); // Show progress bar when templatize starts

            chrome.runtime.sendMessage({action: "getSelectedPost"}, function(response) {
                if (response && response.post) {
                    chrome.storage.sync.get(['userProfile', 'targetAudience'], function(items) {
                        showFeedback('Generating template...', 'info');
                        
                        chrome.runtime.sendMessage({
                            action: "templatize",
                            post: response.post,
                            userProfile: items.userProfile,
                            targetAudience: items.targetAudience
                        }, function(templateResponse) {
                            hideProgressBar(); // Hide progress bar when templatize finishes

                            if (templateResponse.error) {
                                if (elements.templateOutput) elements.templateOutput.value = templateResponse.error;
                                showFeedback('Error generating template', 'error');
                            } else if (templateResponse.template) {
                                if (elements.templateOutput) elements.templateOutput.value = templateResponse.template;
                                if (elements.generateFromTemplateBtn) elements.generateFromTemplateBtn.disabled = false;
                                if (elements.saveTemplateBtn) elements.saveTemplateBtn.disabled = false;
                                chrome.storage.local.set({currentTemplate: templateResponse.template});
    
                                showFeedback('Template generated successfully', 'success');
                            } else {
                                if (elements.templateOutput) elements.templateOutput.value = "Error generating template";
                                showFeedback('Error generating template', 'error');
                            }
                        });
                    });
                } else {
                    hideProgressBar(); // Hide progress bar if no post is selected
                    showFeedback('No post selected for templatization', 'error');
                }
            });
        });
    }

    if (elements.saveTemplateBtn) {
        elements.saveTemplateBtn.addEventListener('click', function() {
            const templateContent = elements.templateOutput ? elements.templateOutput.value : '';
            const postContent = elements.postContent ? elements.postContent.innerHTML : '';
            const authorName = extractAuthorName(postContent); // Ensure this function is defined

            showSaveTemplateModal(templateContent, postContent, authorName);
        });
    }

    function showSaveTemplateModal(templateContent, originalPost, authorName) {
        const modal = document.getElementById('saveTemplateModal');
        const templateNameInput = document.getElementById('templateName');
        const templateDescriptionInput = document.getElementById('templateDescription');
        const categorySelect = document.getElementById('saveTemplateCategorySelect');
        const authorNameDisplay = document.getElementById('authorNameDisplay');
        const saveModalBtn = document.getElementById('saveModalBtn');
        const closeSaveModalBtn = document.getElementById('closeSaveModalBtn');

        if (!modal) {
            console.error("Save template modal not found");
            return;
        }

        modal.style.display = 'block';

        if (authorNameDisplay) {
            authorNameDisplay.textContent = authorName || 'Unknown Author';
        }

        if (categorySelect) {
            chrome.storage.sync.get(['categories'], function(result) {
                const categories = result.categories || [];
                categorySelect.innerHTML = '<option value="">Select a category</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);
                });
            });
        }

        if (saveModalBtn) {
            saveModalBtn.onclick = function() {
                const name = templateNameInput ? templateNameInput.value.trim() : '';
                const description = templateDescriptionInput ? templateDescriptionInput.value.trim() : '';
                const category = categorySelect ? categorySelect.value : '';
                
                if (name && category) {
                    saveTemplate(templateContent, category, name, description, originalPost, authorName);
                    modal.style.display = 'none';
                } else {
                    showFeedback('Please enter a template name and select a category', 'error');
                }
            };
        }

        if (closeSaveModalBtn) {
            closeSaveModalBtn.onclick = function() {
                modal.style.display = 'none';
            };
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }

    function extractAuthorName(postContent) {
        const postElement = document.createElement('div');
        postElement.innerHTML = postContent;

        let authorName = 'Unknown Author';

        // LinkedIn author extraction
        const linkedInAuthorElement = postElement.querySelector('.update-components-actor__name');
        if (linkedInAuthorElement) {
            authorName = linkedInAuthorElement.textContent.trim();
        } else {
            // Twitter author extraction
            const twitterAuthorElement = 
                postElement.querySelector('[data-testid="User-Name"]') ||
                postElement.querySelector('.css-1rynq56.r-dnmrzs.r-1udh08x.r-3s2u2q.r-bcqeeo.r-qvutc0.r-37j5jr.r-a023e6.r-rjixqe.r-16dba41.r-18u37iz.r-1wvb978');
            if (twitterAuthorElement) {
                authorName = twitterAuthorElement.textContent.trim();
            }
        }

        return authorName;
    }

    if (elements.acceptCategoryBtn) {
        elements.acceptCategoryBtn.addEventListener('click', function() {
            const category = elements.suggestedCategoryElement ? elements.suggestedCategoryElement.textContent.trim() : '';
            addCategory(category);
            if (elements.suggestedCategorySection) elements.suggestedCategorySection.style.display = 'none';
        });
    }

    if (elements.rejectCategoryBtn) {
        elements.rejectCategoryBtn.addEventListener('click', function() {
            if (elements.suggestedCategorySection) elements.suggestedCategorySection.style.display = 'none';
        });
    }

    if (elements.copyToClipboardBtn) {
        elements.copyToClipboardBtn.addEventListener('click', function() {
            const template = elements.templateOutput ? elements.templateOutput.value : '';
            navigator.clipboard.writeText(template).then(() => {
                showFeedback('Template copied to clipboard!', 'success');
            }, () => {
                showFeedback('Failed to copy template. Please try again.', 'error');
            });
        });
    }

    if (elements.saveSettingsBtn) {
        elements.saveSettingsBtn.addEventListener('click', function() {
            chrome.storage.sync.get(['categories'], function(result) {
                const existingCategories = result.categories || [];
                chrome.storage.sync.set({
                    userProfile: elements.userProfile ? elements.userProfile.value : '',
                    targetAudience: elements.targetAudience ? elements.targetAudience.value : '',
                    meContent: elements.meContent ? elements.meContent.value : '',
                    personaContent: elements.personaContent ? elements.personaContent.value : '',
                    categories: existingCategories
                }, function() {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving settings:", chrome.runtime.lastError);
                        showFeedback('Failed to save settings. Please try again.', 'error');
                    } else {
                        console.log("Settings saved successfully");
                        showFeedback('Settings saved successfully', 'success');
                        showPage('mainView');
                    }
                });
            });
        });
    }

    function loadSettings() {
        chrome.storage.sync.get(['userProfile', 'targetAudience', 'meContent', 'personaContent', 'categories'], function(items) {
            if (elements.userProfile) elements.userProfile.value = items.userProfile || '';
            if (elements.targetAudience) elements.targetAudience.value = items.targetAudience || '';
            if (elements.meContent) elements.meContent.value = items.meContent || '';
            if (elements.personaContent) elements.personaContent.value = items.personaContent || '';
            if (items.categories) {
                updateCategoryList(items.categories);
            }
        });
    }

    function updateCategoryList(categories) {
        if (elements.categoryList) {
            elements.categoryList.innerHTML = '';
            categories.forEach(category => {
                const li = document.createElement('li');
                li.textContent = category;
                elements.categoryList.appendChild(li);
            });
        }
    }

    function displayGeneratedPost(postContent) {
        const platform = elements.postPlatform ? elements.postPlatform.textContent : '';

        if (elements.generatedPostContent) {
            if (platform === 'LinkedIn') {
                elements.generatedPostContent.innerHTML = postContent
                    .replace(/\n/g, '<br>')
                    .replace(/•/g, '&bull;');
                elements.generatedPostContent.style.whiteSpace = 'pre-wrap';
            } else if (platform === 'Twitter') {
                elements.generatedPostContent.innerHTML = postContent
                    .replace(/\n/g, '<br>')
                    .replace(/(#\w+)/g, '<span style="color: blue;">$1</span>')
                    .replace(/(@\w+)/g, '<span style="color: blue;">$1</span>');
                elements.generatedPostContent.style.whiteSpace = 'pre-wrap';
            } else {
                elements.generatedPostContent.innerHTML = postContent.replace(/\n/g, '<br>');
            }
        }

        if (elements.generatedPostView) elements.generatedPostView.style.display = 'block';
        showFeedback('Post generated successfully', 'success');
    }

    if (elements.generateFromTemplateBtn) {
        elements.generateFromTemplateBtn.addEventListener('click', function() {
            const template = elements.templateOutput ? elements.templateOutput.value : '';
            const userId = getCurrentUserId();
            const category = document.getElementById('categorySelect') ? document.getElementById('categorySelect').value : '';

            chrome.runtime.sendMessage({
                action: "generatePost",
                template: template,
                userId: userId,
                category: category,
                userSettings: {
                    platform: elements.postPlatform ? elements.postPlatform.textContent : ''
                }
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error generating post:", chrome.runtime.lastError);
                    showFeedback('Error generating post', 'error');
                } else if (response.error) {
                    console.error("Error generating post:", response.error);
                    showFeedback('Error generating post', 'error');
                } else {
                    displayGeneratedPost(response.generatedPost);
                }
            });
        });
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "postGenerated") {
            if (request.error) {
                console.error('Error generating post:', request.error);
                if (elements.generatedPostContent) elements.generatedPostContent.textContent = 'Error generating post: ' + request.error;
                showFeedback('Error generating post', 'error');
            } else {
                displayGeneratedPost(request.generatedPost);
            }
            if (elements.generatedPostView) elements.generatedPostView.style.display = 'block';
        }
    });

    function clearTemplate() {
        if (elements.templateOutput) elements.templateOutput.value = '';
        if (elements.generateFromTemplateBtn) elements.generateFromTemplateBtn.disabled = true;
        if (elements.generatedPostView) elements.generatedPostView.style.display = 'none';
        chrome.storage.local.remove('currentTemplate');
        showFeedback('Template cleared', 'info');
    }

    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', clearTemplate);
    }

    function loadSavedTemplates() {
        console.log("Loading saved templates...");
        dbFunctions.getAllTemplates(getCurrentUserId())
            .then(templates => {
                console.log("Templates loaded:", templates);
                displaySavedTemplates(templates);
                showFeedback('Templates loaded successfully', 'success');
            })
            .catch(error => {
                console.error("Error loading templates:", error);
                showFeedback('Error loading templates', 'error');
            });
    }

    function displaySavedTemplates(templates) {
        console.log("Displaying saved templates:", templates);
        if (elements.templatesList) {
            elements.templatesList.innerHTML = '';
            if (Object.keys(templates).length === 0) {
                console.log("No templates found");
                elements.templatesList.innerHTML = '<p>No saved templates found.</p>';
            } else {
                const categorizedTemplates = {};
                
                // Group templates by category
                for (let id in templates) {
                    const template = templates[id];
                    if (!categorizedTemplates[template.category]) {
                        categorizedTemplates[template.category] = [];
                    }
                    categorizedTemplates[template.category].push({id, ...template});
                }
                
                // Create category sections
                for (let category in categorizedTemplates) {
                    const categorySection = document.createElement('div');
                    categorySection.className = 'category-section';
                    
                    const categoryHeader = document.createElement('h3');
                    categoryHeader.textContent = category;
                    categorySection.appendChild(categoryHeader);
                    
                    const templateGrid = document.createElement('div');
                    templateGrid.className = 'template-grid';
                    categorizedTemplates[category].forEach(template => {
                        const templateCard = createTemplateCard(template);
                        templateGrid.appendChild(templateCard);
                    });
                    
                    categorySection.appendChild(templateGrid);
                    elements.templatesList.appendChild(categorySection);
                }
            }
            elements.templatesList.style.display = 'block';
        } else {
            console.error("templatesList element not found");
        }
    }

    function createTemplateCard(template) {
        const templateCard = document.createElement('div');
        templateCard.className = 'template-card';
        templateCard.innerHTML = `
            <h4>${template.name || 'Untitled'}</h4>
            <p class="template-description">${template.description || 'No description'}</p>
            <p class="template-preview">${template.content.substring(0, 50)}...</p>
            <div class="template-actions">
                <button class="edit-btn" data-id="${template.id}">Edit</button>
                <button class="delete-btn" data-id="${template.id}">Delete</button>
            </div>
        `;
        
        // Make the entire card clickable to generate a post
        templateCard.addEventListener('click', () => {
            selectTemplateForGeneration(template.id);
        });

        templateCard.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            editCurrentTemplate(template.id);
        });
        templateCard.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCurrentTemplate(template.id);
        });
        return templateCard;
    }

    function selectTemplateForGeneration(templateId) {
        dbFunctions.getTemplate(getCurrentUserId(), templateId)
            .then(template => {
                if (template) {
                    if (elements.templateOutput) elements.templateOutput.value = template.content;
                    if (elements.generateFromTemplateBtn) elements.generateFromTemplateBtn.disabled = false;
                    
                    // Display original post if available
                    if (elements.postContent && template.originalPost) {
                        elements.postContent.innerHTML = `
                            <h3>Original Post by ${template.authorName || 'Unknown Author'}</h3>
                            <p>${template.originalPost}</p>
                        `;
                    }
                    
                    // Update the platform if available
                    if (elements.postPlatform && template.platform) {
                        elements.postPlatform.textContent = template.platform;
                    }
                    
                    showPage('mainView');
                    showFeedback('Template loaded for generation', 'success');
                    
                    // Optionally, you can automatically trigger the generation process here
                    // generateFromTemplate(template.content);
                } else {
                    console.error("Template not found");
                    showFeedback('Template not found', 'error');
                }
            })
            .catch(error => {
                console.error("Error loading template for generation:", error);
                showFeedback('Error loading template', 'error');
            });
    }

    function generateFromTemplate(templateContent) {
        // This function should contain the logic to generate a post from the template
        // You might want to use the existing logic from the generateFromTemplateBtn click handler
        chrome.runtime.sendMessage({
            action: "generatePost",
            template: templateContent,
            userId: getCurrentUserId(),
            userSettings: {
                platform: elements.postPlatform ? elements.postPlatform.textContent : ''
            }
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error generating post:", chrome.runtime.lastError);
                showFeedback('Error generating post', 'error');
            } else if (response.error) {
                console.error("Error generating post:", response.error);
                showFeedback('Error generating post', 'error');
            } else {
                displayGeneratedPost(response.generatedPost);
            }
        });
    }

    function editCurrentTemplate(templateId) {
        dbFunctions.getTemplate(getCurrentUserId(), templateId)
            .then(template => {
                if (template) {
                    if (elements.templateOutput) elements.templateOutput.value = template.content;
                    if (elements.categorySelect) elements.categorySelect.value = template.category || '';
                    if (elements.generateFromTemplateBtn) elements.generateFromTemplateBtn.disabled = false;
                    
                    // Display original post
                    if (elements.postContent) {
                        elements.postContent.innerHTML = `
                            <h3>Original Post by ${template.authorName || 'Unknown Author'}</h3>
                            <p>${template.originalPost || 'Original post not available'}</p>
                        `;
                    }
                    
                    showPage('mainView');
                    showFeedback('Template loaded for editing', 'info');
                } else {
                    console.error("Template not found");
                    showFeedback('Template not found', 'error');
                }
            })
            .catch(error => {
                console.error("Error loading template for editing:", error);
                showFeedback('Error loading template', 'error');
            });
    }

    function deleteCurrentTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            dbFunctions.deleteTemplate(getCurrentUserId(), templateId)
                .then(() => {
                    showFeedback('Template deleted successfully', 'success');
                    loadSavedTemplates();
                })
                .catch(error => {
                    console.error("Error deleting template:", error);
                    showFeedback('Error deleting template', 'error');
                });
        }
    }

    function loadTemplateAndShowMainView(templateId) {
        dbFunctions.getTemplate(getCurrentUserId(), templateId)
            .then(template => {
                if (template) {
                    if (elements.templateOutput) elements.templateOutput.value = template.content;
                    if (elements.generateFromTemplateBtn) elements.generateFromTemplateBtn.disabled = false;
                    showPage('mainView');
                    showFeedback('Template loaded successfully', 'success');
                } else {
                    console.error("Template not found");
                    showFeedback('Template not found', 'error');
                }
            })
            .catch(error => {
                console.error("Error loading template:", error);
                showFeedback('Error loading template', 'error');
            });
    }

    function showFeedback(message, type = 'info') {
        const feedbackElement = document.getElementById('feedbackMessage');
        if (feedbackElement) {
            feedbackElement.textContent = message;
            feedbackElement.className = `feedback ${type}`;
            feedbackElement.style.display = 'block';
            setTimeout(() => {
                feedbackElement.classList.add('hide');
                setTimeout(() => {
                    feedbackElement.style.display = 'none';
                    feedbackElement.classList.remove('hide');
                }, 500);
            }, 5000);
        } else {
            console.warn("Feedback element not found");
        }
    }

    function showProgressBar() {
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        if (progressContainer && progressBar) {
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            
            // Simulate progress
            let progress = 0;
            const interval = setInterval(() => {
                if (progress >= 90) {
                    clearInterval(interval);
                } else {
                    progress += 10;
                    progressBar.style.width = `${progress}%`;
                }
            }, 300); // Update every 300ms
        }
    }

    function hideProgressBar() {
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            progressContainer.style.display = 'none';
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }
    }

    function getErrorMessage(error) {
        if (error.message.includes('network')) {
            return 'Unable to save. Please check your internet connection.';
        } else if (error.message.includes('authentication')) {
            return 'Session expired. Please log in again.';
        } else if (error.message.includes('exists')) {
            return 'Template name already exists. Please choose a different name.';
        }
        return 'Unable to save template. Please try again.';
    }

    function updateTemplateListItem(templateId, category, content, name, description) {
        const templateItem = document.querySelector(`[data-template-id="${templateId}"]`);
        if (templateItem) {
            templateItem.querySelector('h4').textContent = name || 'Untitled';
            templateItem.querySelector('.template-description').textContent = description || 'No description';
            templateItem.querySelector('.template-preview').textContent = content.substring(0, 50) + '...';
            templateItem.classList.add('highlight');
            setTimeout(() => templateItem.classList.remove('highlight'), 2000);
        }
    }

    function showUndoOption(templateId) {
        const undoElement = document.createElement('div');
        undoElement.id = 'undoSave';
        undoElement.innerHTML = `
            <span>Template saved. </span>
            <button id="undoSaveBtn">Undo</button>
        `;
        document.body.appendChild(undoElement);
        
        document.getElementById('undoSaveBtn').addEventListener('click', () => {
            dbFunctions.deleteTemplate(getCurrentUserId(), templateId)
                .then(() => {
                    showFeedback('Save undone', 'info');
                    loadSavedTemplates();
                })
                .catch(error => showFeedback('Unable to undo save', 'error'));
        });

        setTimeout(() => undoElement.remove(), 10000);
    }

    function saveTemplate(content, category, name, description, originalPost, authorName) {
        // Ensure authorName is not undefined or empty
        authorName = authorName && authorName.trim() !== '' ? authorName : 'Unknown Author';

        dbFunctions.saveTemplate(getCurrentUserId(), {
            category: category,
            content: content,
            name: name,
            description: description,
            originalPost: originalPost,
            authorName: authorName,
            platform: elements.postPlatform ? elements.postPlatform.textContent : ''
        })
        .then(templateId => {
            console.log("Template saved with ID:", templateId);
            showFeedback('Template saved successfully!', 'success'); // User feedback
            updateTemplateListItem(templateId, category, content, name, description);
            showUndoOption(templateId);
            loadSavedTemplates();
        })
        .catch(error => {
            console.error("Error saving template:", error);
            showFeedback(getErrorMessage(error), 'error'); // User feedback on error
        });
    }

    // Load initial data and set up the UI
    loadCategories();
    loadSettings();
    loadSelectedPost();
    loadSavedTemplates();
    showPage('mainView');

    chrome.storage.local.get('currentTemplate', function(result) {
        if (result.currentTemplate) {
            if (elements.templateOutput) elements.templateOutput.value = result.currentTemplate;
            if (elements.generateFromTemplateBtn) elements.generateFromTemplateBtn.disabled = false;
        }
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/background.js')
            .then(function(registration) {
                console.log('Service worker registration succeeded:', registration);
            })
            .catch(function(error) {
                console.log('Service worker registration failed:', error);
            });
    }

    function getCurrentUserId() {
        // For now, we'll return a placeholder value. In a real application, you'd get this from your authentication system.
        return "user123";
    }
}); // End of DOMContentLoaded event listener
