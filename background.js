importScripts('lib/firebase-app.js');
importScripts('lib/firebase-database.js');
importScripts('firebaseConfig.js');
importScripts('database.js');
importScripts('api.js');

console.log("Service Worker Loaded");

let selectedPost = null;

function stripHtmlTags(html) {
    return html.replace(/<[^>]*>/g, '');
}

function preserveStructure(html) {
    return html.replace(/<br\s*\/?>/gi, '\n')
               .replace(/<\/p>\s*<p>/gi, '\n\n')
               .replace(/<li>/gi, '\n• ')
               .replace(/<\/div>\s*<div>/gi, '\n')
               .replace(/<[^>]*>/g, '');
}

self.addEventListener('activate', event => {
  console.log('Service worker activated');
});

self.addEventListener('fetch', event => {
  // This empty fetch listener is needed to make the service worker controllerchange event fire
  // when the service worker is updated.
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received message:", request);
    if (request.action === "getShortcutContent") {
        chrome.storage.sync.get(['meContent', 'personaContent'], function(items) {
            console.log("Fetched shortcut content:", items);
            sendResponse({
                meContent: items.meContent || '',
                personaContent: items.personaContent || ''
            });
        });
        return true;
    } else if (request.action === "postSelected") {
        selectedPost = request.post;
        console.log("Background script stored post:", selectedPost);
        sendResponse({status: "Post received by background script"});
        return true;
    } else if (request.action === "getSelectedPost") {
        console.log("Background script sending post:", selectedPost);
        sendResponse({post: selectedPost});
        return true;
    } else if (request.action === "clearPost") {
        selectedPost = null;
        console.log("Background script cleared post");
        sendResponse({status: "Post cleared"});
        return true;
    } else if (request.action === "templatize") {
        chrome.storage.sync.get(['apiKey', 'userProfile', 'targetAudience', 'categories'], function(result) {
            const apiKey = result.apiKey;
            const userSettings = {
                userProfile: result.userProfile || '',
                targetAudience: result.targetAudience || ''
            };
            const userCategories = result.categories || [];
            if (!apiKey) {
                sendResponse({error: "API key not set. Please set it in the settings."});
                return;
            }
            
            const structuredContent = preserveStructure(request.post.content);
            
            analyzePostWithClaude(structuredContent, apiKey, request.category, userSettings, userCategories)
                .then(result => {
                    const [template, placeholders] = parseClaudeResult(result.template);
                    sendResponse({
                        template: template, 
                        placeholders: placeholders,
                        suggestedCategory: result.suggestedCategory
                    });
                })
                .catch(error => {
                    console.error("Templatization error:", error);
                    sendResponse({error: "Failed to generate template"});
                });
        });
        return true;
    } else if (request.action === "generatePost") {
        console.log("Received generate post request in background:", request);
        chrome.storage.sync.get(['apiKey', 'userProfile', 'targetAudience'], function(result) {
            const apiKey = result.apiKey;
            if (!apiKey) {
                sendResponse({error: "API key not set. Please set it in the settings."});
                return;
            }
            const userSettings = {
                userProfile: result.userProfile || request.userSettings.userProfile || '',
                targetAudience: result.targetAudience || request.userSettings.targetAudience || '',
                platform: request.userSettings.platform || ''
            };
            console.log("User settings in background:", userSettings);
            generatePostFromTemplate(request.template, request.category, userSettings, apiKey)
                .then(generatedPost => {
                    console.log("Generated post:", generatedPost);
                    chrome.runtime.sendMessage({
                        action: "postGenerated",
                        generatedPost: generatedPost
                    });
                })
                .catch(error => {
                    console.error("Error generating post:", error);
                    chrome.runtime.sendMessage({
                        action: "postGenerated",
                        error: error.message
                    });
                });
        });
        return true;
    } else if (request.action === "saveTemplate") {
        self.dbFunctions.saveTemplate(request.userId, request.templateData)
            .then(templateId => sendResponse({success: true, templateId}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    } else if (request.action === "getTemplate") {
        self.dbFunctions.getTemplate(request.userId, request.templateId)
            .then(template => sendResponse({success: true, template}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    } else if (request.action === "updateTemplate") {
        self.dbFunctions.updateTemplate(request.userId, request.templateId, request.templateData)
            .then(() => sendResponse({success: true}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    } else if (request.action === "deleteTemplate") {
        self.dbFunctions.deleteTemplate(request.userId, request.templateId)
            .then(() => sendResponse({success: true}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    } else if (request.action === "getAllTemplates") {
        self.dbFunctions.getAllTemplates(request.userId)
            .then(templates => sendResponse({success: true, templates}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    }
});

function parseClaudeResult(result) {
    const generatedPost = result.trim();
    return [generatedPost, []];
}

async function generatePostFromTemplate(template, category, userSettings, apiKey) {
    console.log("Generating post from template:", { template, category, userSettings });

    try {
        const generatedPost = await analyzePostWithClaude(template, apiKey, category, userSettings, [], true);
        console.log("Generated post:", generatedPost);
        return generatedPost.trim();
    } catch (error) {
        console.error("Post generation error:", error);
        throw new Error(`Failed to generate post: ${error.message}`);
    }
}

function removeUnderscoresFromPlaceholders(post) {
    return post.replace(/_([A-Z_]+)_/g, '$1');
}