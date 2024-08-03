console.log("Content script loaded");

function extractLinkedInPost(postElement) {
  const contentElement = postElement.querySelector('.feed-shared-update-v2__description, .feed-shared-text, .break-words, [data-test-id="post-view-body"]');
  if (!contentElement) return null;

  const content = contentElement.textContent.trim();
  const author = postElement.querySelector('.feed-shared-actor__name')?.textContent.trim() || 'Unknown';
  const engagementMetrics = {
    likes: postElement.querySelector('.social-details-social-counts__reactions-count')?.textContent.trim() || '0',
    comments: postElement.querySelector('.social-details-social-counts__comments')?.textContent.trim() || '0'
  };

  return { content, author, engagementMetrics, platform: 'LinkedIn' };
}

function extractTwitterPost(postElement) {
  const content = postElement.querySelector('[data-testid="tweetText"]')?.textContent.trim();
  if (!content) return null;

  const author = postElement.querySelector('[data-testid="User-Name"]')?.textContent.trim() || 'Unknown';
  const engagementMetrics = {
    likes: postElement.querySelector('[data-testid="like"]')?.textContent.trim() || '0',
    retweets: postElement.querySelector('[data-testid="retweet"]')?.textContent.trim() || '0'
  };

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
  }

  if (postData) {
    console.log("Selected post:", postData);
    chrome.runtime.sendMessage({action: "postSelected", post: postData}, function(response) {
      console.log("Response from background script:", response);
    });
  } else {
    console.log("No valid post detected");
  }
}

document.addEventListener('mouseup', handleMouseUp);