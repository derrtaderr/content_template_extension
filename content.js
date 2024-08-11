console.log("Content script loaded");

function getCurrentPlatform() {
    if (window.location.hostname.includes('linkedin.com')) {
        return 'LinkedIn';
    } else if (window.location.hostname.includes('twitter.com')) {
        return 'Twitter';
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
    
    // Clone the content to avoid modifying the original DOM
    const contentClone = contentElement.cloneNode(true);
    
    // Remove the "see more" button
    const seeMoreButton = contentClone.querySelector('.feed-shared-inline-show-more-text__see-more-less-toggle');
    if (seeMoreButton) {
        seeMoreButton.remove();
    }

    // Remove any collapsed content containers
    const collapsedContent = contentClone.querySelector('.feed-shared-inline-show-more-text__container');
    if (collapsedContent) {
        collapsedContent.remove();
    }

    const content = contentClone.innerHTML;

    console.log("Extracted LinkedIn post:", { author, content });
    return { author, content, platform: 'LinkedIn' };
}

function extractTwitterPost(tweetElement) {
    console.log("Extracting Twitter post");
    const contentElement = tweetElement.querySelector('[data-testid="tweetText"]');
    if (!contentElement) {
        console.log("Twitter content element not found");
        return null;
    }

    // Clone the content to avoid modifying the original DOM
    const contentClone = contentElement.cloneNode(true);

    // Preserve line breaks and structure
    const formattedContent = Array.from(contentClone.childNodes)
        .map(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            } else if (node.tagName === 'BR') {
                return '\n';
            } else if (node.tagName === 'SPAN' && node.classList.contains('css-901oao')) {
                // This might be a line break in the original tweet
                return '\n' + node.textContent;
            } else {
                return node.textContent;
            }
        })
        .join('')
        .trim();

    const author = tweetElement.querySelector('[data-testid="User-Name"]')?.textContent.trim() || 'Unknown';
    const engagementMetrics = {
        likes: tweetElement.querySelector('[data-testid="like"]')?.textContent.trim() || '0',
        retweets: tweetElement.querySelector('[data-testid="retweet"]')?.textContent.trim() || '0'
    };
    
    console.log("Extracted tweet:", { formattedContent, author, engagementMetrics });
    return { content: formattedContent, author, engagementMetrics, platform: 'Twitter' };
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
    } else if (currentPlatform === 'Twitter') {
        const twitterPost = event.target.closest('[data-testid="tweet"]');
        if (twitterPost) {
            console.log("Twitter post detected");
            postData = extractTwitterPost(twitterPost);
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