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
               .replace(/<\/div>\s*<div>/gi, '\n')  // For Twitter's div-based structure
               .replace(/<[^>]*>/g, '');
}

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
    }
});

function parseClaudeResult(result) {
    const parts = result.split('2. A list of placeholders used and their descriptions');
    const template = parts[0].replace('1. A templatized version of the post, maintaining the original structure and line breaks.\n', '').trim();
    const placeholders = parts[1] ? parts[1].trim().split('\n').map(p => p.trim()) : [];
    return [template, placeholders];
}
