// content.js
(function() {
    let selectedPost = null;
  
    function addSelectionListeners() {
      document.addEventListener('mouseup', handleMouseUp);
    }
  
    function handleMouseUp(event) {
      const twitterPost = event.target.closest('[data-testid="tweet"]');
      const linkedInPost = event.target.closest('.feed-shared-update-v2');
  
      if (twitterPost) {
        selectedPost = extractTwitterPost(twitterPost);
      } else if (linkedInPost) {
        selectedPost = extractLinkedInPost(linkedInPost);
      }
  
      if (selectedPost) {
        chrome.runtime.sendMessage({action: "postSelected", post: selectedPost});
      }
    }
  
    function extractTwitterPost(element) {
      const tweetText = element.querySelector('[data-testid="tweetText"]');
      return tweetText ? tweetText.innerText : null;
    }
  
    function extractLinkedInPost(element) {
      const postText = element.querySelector('.feed-shared-update-v2__description');
      return postText ? postText.innerText : null;
    }
  
    addSelectionListeners();
  })();