console.log("Content script loaded");

let selectedPost = null;
let isConnectionValid = true;

function handleMouseUp(event) {
  if (!isConnectionValid) {
    console.log("Connection invalid, attempting to reconnect...");
    reconnectToExtension();
    return;
  }

  console.log("Mouse up detected");
  const linkedInPost = event.target.closest('.feed-shared-update-v2, .occludable-update, article');
  if (linkedInPost) {
    console.log("LinkedIn post detected");
    const postText = extractPostContent(linkedInPost);
    if (postText) {
      selectedPost = postText;
      console.log("Selected post:", selectedPost);
      sendMessageToExtension({action: "postSelected", post: selectedPost});
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

function sendMessageToExtension(message) {
  try {
    chrome.runtime.sendMessage(message, function(response) {
      if (chrome.runtime.lastError) {
        console.log("Error sending message:", chrome.runtime.lastError.message);
        isConnectionValid = false;
      } else {
        console.log("Message sent, response:", response);
      }
    });
  } catch (error) {
    console.log("Error sending message:", error);
    isConnectionValid = false;
  }
}

function reconnectToExtension() {
  try {
    chrome.runtime.connect();
    isConnectionValid = true;
    console.log("Reconnected to extension");
  } catch (error) {
    console.log("Failed to reconnect:", error);
    isConnectionValid = false;
  }
}

document.addEventListener('mouseup', handleMouseUp);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedPost") {
    sendResponse({post: selectedPost});
  }
});

// Attempt to reconnect when the script loads
reconnectToExtension();