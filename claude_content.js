console.log("Claude content script loaded");

let meContent = '';
let personaContent = '';
let contentLoaded = false;
let lastInput = '';

function loadShortcutContent() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({action: "getShortcutContent"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error loading shortcut content:", chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log("Received shortcut content:", JSON.stringify(response));
                meContent = response.meContent || '';
                personaContent = response.personaContent || '';
                console.log("meContent:", meContent);
                console.log("personaContent:", personaContent);
                contentLoaded = true;
                resolve();
            }
        });
    });
}

function insertContent(content, shortcutLength) {
    console.log("Attempting to insert content:", content);
    const textarea = document.querySelector('div[contenteditable="true"][class*="ProseMirror"]');
    if (textarea) {
        console.log("Found contenteditable div:", textarea);
        
        // Create a new text node with the content
        const textNode = document.createTextNode(content);
        
        // Get the current selection
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Delete the shortcut text
        const startOffset = Math.max(0, range.startOffset - shortcutLength);
        range.setStart(range.startContainer, startOffset);
        range.deleteContents();
        
        // Insert the new content
        range.insertNode(textNode);
        
        // Move the cursor to the end of the inserted content
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Dispatch input and change events
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log("Content inserted, new textarea content:", textarea.textContent);
    } else {
        console.log("Could not find contenteditable div");
    }
}

function handleInput(e) {
    const textarea = e.target;
    const text = textarea.textContent;
    console.log("Input event, current text:", text);
    
    if (text.endsWith('/me') || (lastInput === '/me' && text.endsWith('/me '))) {
        console.log("'/me' shortcut detected");
        insertContent(meContent, 3);
    } else if (text.endsWith('/persona') || (lastInput === '/persona' && text.endsWith('/persona '))) {
        console.log("'/persona' shortcut detected");
        insertContent(personaContent, 8);
    }
    
    lastInput = text;
}

function setupEventListeners() {
    const textarea = document.querySelector('div[contenteditable="true"][class*="ProseMirror"]');
    if (textarea) {
        textarea.addEventListener('input', handleInput);
        console.log("Event listener set up on textarea");
    } else {
        console.log("Could not find textarea to set up event listener");
    }
}

loadShortcutContent()
    .then(() => {
        setupEventListeners();
    })
    .catch(error => {
        console.error("Initial content load failed:", error);
    });

// Set up a mutation observer to watch for changes in the DOM
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList') {
            setupEventListeners();
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });