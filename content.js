console.log("Content script loaded");

function extractLinkedInPost(postElement) {
  console.log("Extracting LinkedIn post");
  const contentElement = postElement.querySelector('.feed-shared-update-v2__description, .feed-shared-text, .break-words, [data-test-id="post-view-body"]');
  if (!contentElement) {
    console.log("LinkedIn content element not found");
    return null;
  }

  const content = contentElement.innerText.trim();
  const author = postElement.querySelector('.feed-shared-actor__name')?.textContent.trim() || 'Unknown';
  const engagementMetrics = {
    likes: postElement.querySelector('.social-details-social-counts__reactions-count')?.textContent.trim() || '0',
    comments: postElement.querySelector('.social-details-social-counts__comments')?.textContent.trim() || '0'
  };

  console.log("Extracted LinkedIn post:", { content, author, engagementMetrics });
  return { content, author, engagementMetrics, platform: 'LinkedIn' };
}

function extractTwitterPost(tweetElement) {
  console.log("Extracting Twitter post");
  const contentElement = tweetElement.querySelector('[data-testid="tweetText"]');
  if (!contentElement) {
    console.log("Twitter content element not found");
    return null;
  }

  const content = contentElement.innerText.trim();
  const author = tweetElement.querySelector('[data-testid="User-Name"]')?.textContent.trim() || 'Unknown';
  const engagementMetrics = {
    likes: tweetElement.querySelector('[data-testid="like"]')?.textContent.trim() || '0',
    retweets: tweetElement.querySelector('[data-testid="retweet"]')?.textContent.trim() || '0'
  };

  console.log("Extracted tweet:", { content, author, engagementMetrics });
  return { content, author, engagementMetrics, platform: 'Twitter' };
}

function handleMouseUp(event) {
  console.log("Mouse up detected");
  const linkedInPost = event.target.closest('.feed-shared-update-v2, .occludable-update, article');
  const twitterPost = event.target.closest('[data-testid="tweet"]');
  
  let postData = null;
  if (linkedInPost) {
    console.log("LinkedIn post detected");
    postData = extractLinkedInPost(linkedInPost);
  } else if (twitterPost) {
    console.log("Twitter post detected");
    postData = extractTwitterPost(twitterPost);
  } else {
    console.log("No relevant post detected");
  }

  if (postData) {
    console.log("Sending post data to background script:", postData);
    chrome.runtime.sendMessage({action: "postSelected", post: postData}, function(response) {
      console.log("Response from background script:", response);
    });
  } else {
    console.log("Failed to extract post data");
  }
}

document.addEventListener('mouseup', handleMouseUp);