console.log("Content script loaded");

function getCurrentPlatform() {
    if (window.location.hostname.includes('linkedin.com')) {
        return 'LinkedIn';
    }
    return 'Unknown';
}

function extractLinkedInPost(postElement) {
    console.log("Extracting LinkedIn post");
    const contentElement = postElement.querySelector('.feed-shared-update-v2__description, .feed-shared-text, .break-words');
    if (!contentElement) {
        console.log("LinkedIn content element not found");
        return null;
    }

    const author = postElement.querySelector('.feed-shared-actor__name')?.textContent.trim() || 'Unknown';
    const content = contentElement.innerHTML;

    console.log("Extracted LinkedIn post:", { author, content });
    return { author, content, platform: 'LinkedIn' };
}

function handleMouseUp(event) {
    console.log("Mouse up detected");
    const currentPlatform = getCurrentPlatform();
    console.log("Current platform:", currentPlatform);

    let postData = null;

    if (currentPlatform === 'LinkedIn') {
        const linkedInPost = event.target.closest('.feed-shared-update-v2, .occludable-update, article');
        if (linkedInPost) {
            console.log("LinkedIn post detected");
            postData = extractLinkedInPost(linkedInPost);
        }
    }

    if (postData) {
        console.log("Sending post data to background script:", postData);
        chrome.runtime.sendMessage({action: "postSelected", post: postData}, function(response) {
            console.log("Response from background script:", response);
        });
    } else {
        console.log("No relevant post detected or failed to extract post data");
    }
}

document.addEventListener('mouseup', handleMouseUp);