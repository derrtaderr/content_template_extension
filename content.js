console.log("Content script loaded");

function extractLinkedInPost(postElement) {
  console.log("Extracting LinkedIn post");
  const contentElement = postElement.querySelector('.feed-shared-update-v2__description, .feed-shared-text, .break-words, [data-test-id="post-view-body"]');
  if (!contentElement) {
    console.log("Content element not found");
    return null;
  }

  const content = contentElement.innerHTML; // Use innerHTML to preserve formatting
  const author = postElement.querySelector('.feed-shared-actor__name')?.textContent.trim() || 'Unknown';
  const engagementMetrics = {
    likes: postElement.querySelector('.social-details-social-counts__reactions-count')?.textContent.trim() || '0',
    comments: postElement.querySelector('.social-details-social-counts__comments')?.textContent.trim() || '0'
  };

  console.log("Extracted post:", { content, author, engagementMetrics });
  return { content, author, engagementMetrics, platform: 'LinkedIn' };
}

function handleMouseUp(event) {
  console.log("Mouse up detected");
  const linkedInPost = event.target.closest('.feed-shared-update-v2, .occludable-update, article');
  
  if (linkedInPost) {
    console.log("LinkedIn post detected");
    const postData = extractLinkedInPost(linkedInPost);
    if (postData) {
      console.log("Sending post data to background script:", postData);
      chrome.runtime.sendMessage({action: "postSelected", post: postData}, function(response) {
        console.log("Response from background script:", response);
      });
    } else {
      console.log("Failed to extract post data");
    }
  } else {
    console.log("No LinkedIn post detected");
  }
}

document.addEventListener('mouseup', handleMouseUp);