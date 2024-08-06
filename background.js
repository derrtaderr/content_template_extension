import { analyzePostWithClaude } from './api.js';

console.log("Background script loaded");

let selectedPost = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received message:", request);
    if (request.action === "postSelected") {
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
        chrome.storage.sync.get(['apiKey'], function(result) {
            const apiKey = result.apiKey;
            if (!apiKey) {
                sendResponse({error: "API key not set. Please set it in the settings."});
                return;
            }
            
            analyzePostWithClaude(request.post, apiKey, request.category)
                .then(result => {
                    const template = removePlaceholders(result);
                    sendResponse({template: template});
                })
                .catch(error => {
                    console.error("Templatization error:", error);
                    sendResponse({error: "Failed to generate template"});
                });
        });
        return true;
    }
});

function removePlaceholders(template) {
    // Remove placeholder descriptions
    template = template.replace(/2\. A list of placeholders and their descriptions[\s\S]*$/, '');
    
    // Remove placeholder markup
    template = template.replace(/\{\{[^}]+\}\}/g, '');
    
    return template.trim();
}