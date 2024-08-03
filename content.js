console.log("Content script loaded");

let selectedPost = null;

function handleMouseUp(event) {
  console.log("Mouse up detected");
  const linkedInPost = event.target.closest('.feed-shared-update-v2, .occludable-update, article');
  if (linkedInPost) {
    console.log("LinkedIn post detected");
    const postText = extractPostContent(linkedInPost);
    if (postText) {
      selectedPost = postText;
      console.log("Selected post:", selectedPost);
      chrome.storage.local.set({selectedPost: selectedPost}, function() {
        console.log('Post saved to storage');
      });
    } else {
      console.log("Could not find post text");
    }
  } else {
    console.log("No LinkedIn post detected");
  }
}

function extractPostContent(postElement) {
  const contentElement = postElement.querySelector('.feed-shared-update-v2__description, .feed-shared-text, .break-words, [data-test-id="post-view-body"]');
  if (!contentElement) return null;

  // Preserve line breaks and structure
  const paragraphs = contentElement.querySelectorAll('p, br, li');
  if (paragraphs.length > 0) {
    return Array.from(paragraphs).map(p => p.textContent.trim()).join('\n\n');
  } else {
    // If no paragraphs found, return the whole text content
    return contentElement.textContent.trim().replace(/\s+/g, ' ');
  }
}

document.addEventListener('mouseup', handleMouseUp);