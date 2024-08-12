import { analyzePostWithClaude } from './api.js';

console.log("Background script loaded");

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
        return true;  // Indicates that the response is sent asynchronously
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
        chrome.storage.sync.get(['apiKey', 'userProfile', 'targetAudience'], function(result) {
            const apiKey = result.apiKey;
            const userSettings = {
                userProfile: result.userProfile || '',
                targetAudience: result.targetAudience || ''
            };
            if (!apiKey) {
                sendResponse({error: "API key not set. Please set it in the settings."});
                return;
            }
            
            const structuredContent = preserveStructure(request.post.content);
            
            analyzePostWithClaude(structuredContent, apiKey, request.category, userSettings)
                .then(result => {
                    const [template, placeholders] = parseClaudeResult(result);
                    sendResponse({template: template, placeholders: placeholders});
                })
                .catch(error => {
                    console.error("Templatization error:", error);
                    sendResponse({error: "Failed to generate template"});
                });
        });
        return true;
    } else if (request.action === "generatePost") {
        // Use chrome.storage.sync.get in a Promise wrapper
        new Promise((resolve) => {
            chrome.storage.sync.get(['apiKey'], resolve);
        })
        .then(result => {
            const apiKey = result.apiKey;
            if (!apiKey) {
                throw new Error("API key not set. Please set it in the settings.");
            }
            return generatePostFromTemplate(request.template, request.category, request.userSettings, apiKey);
        })
        .then(generatedPost => {
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
        return true; // Keep the message channel open
    }
});

function parseClaudeResult(result) {
    const parts = result.split('2. A list of placeholders used and their descriptions');
    const template = parts[0].replace('1. A templatized version of the post, maintaining the original structure and line breaks.\n', '').trim();
    const placeholders = parts[1] ? parts[1].trim().split('\n').map(p => p.trim()) : [];
    return [template, placeholders];
}

async function generatePostFromTemplate(template, category, userSettings, apiKey) {
    console.log("Generating post from template:", template, category, userSettings);
    try {
        const generatedPost = await analyzePostWithClaude(template, apiKey, category, userSettings, true);
        
        // Post-processing for Twitter
        if (userSettings.platform === 'Twitter') {
            return removeUnderscoresFromPlaceholders(generatedPost);
        }
        
        return generatedPost;
    } catch (error) {
        console.error("Post generation error:", error);
        throw new Error("Failed to generate post");
    }
}

function removeUnderscoresFromPlaceholders(post) {
    // Remove underscores from placeholder words
    return post.replace(/_([A-Z_]+)_/g, '$1');
}

