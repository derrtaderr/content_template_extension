console.log("ChatGPT content script loaded");

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
    const textarea = document.querySelector('textarea#prompt-textarea');
    if (textarea) {
        console.log("Found textarea:", textarea);
        
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const textBefore = textarea.value.substring(0, startPos - shortcutLength);
        const textAfter = textarea.value.substring(endPos);
        
        console.log("Before insertion - startPos:", startPos, "endPos:", endPos);
        console.log("Text before:", textBefore);
        console.log("Text after:", textAfter);
        
        textarea.value = textBefore + content + textAfter;
        textarea.selectionStart = textarea.selectionEnd = startPos - shortcutLength + content.length;
        
        console.log("After insertion - new value:", textarea.value);
        console.log("New cursor position:", textarea.selectionStart);
        
        // Dispatch input event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log("Input event dispatched");
    } else {
        console.error("Could not find textarea");
    }
}

function handleInput(e) {
    const textarea = e.target;
    const text = textarea.value;
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
    const textarea = document.querySelector('textarea#prompt-textarea');
    if (textarea) {
        textarea.addEventListener('input', handleInput);
        console.log("Event listener set up on textarea");
    } else {
        console.error("Could not find textarea to set up event listener");
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
            console.log("DOM changed, attempting to set up event listeners again");
            setupEventListeners();
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Additional debugging
setInterval(() => {
    const textarea = document.querySelector('textarea#prompt-textarea');
    if (textarea) {
        console.log("Textarea state check - value:", textarea.value);
    } else {
        console.error("Textarea not found in periodic check");
    }
}, 5000);  // Check every 5 seconds