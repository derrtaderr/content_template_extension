console.log("Content script loaded");

function handleMouseUp(event) {
  console.log("Mouse up detected");
  const linkedInPost = event.target.closest('.feed-shared-update-v2, .occludable-update, article');
  if (linkedInPost) {
    console.log("LinkedIn post detected");
    const postText = extractPostContent(linkedInPost);
    if (postText) {
      console.log("Selected post:", postText);
      chrome.runtime.sendMessage({action: "postSelected", post: postText}, function(response) {
        console.log("Response from background script:", response);
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

  // Clone the content to avoid modifying the original
  const clonedContent = contentElement.cloneNode(true);

  // Replace <br> tags with newline characters
  clonedContent.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

  // Preserve paragraph breaks
  clonedContent.querySelectorAll('p, div').forEach(p => {
    p.insertAdjacentHTML('afterend', '\n\n');
  });

  return clonedContent.innerText.trim();
}

document.addEventListener('mouseup', handleMouseUp);