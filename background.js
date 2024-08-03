console.log("Background script loaded");

let selectedPost = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);
  if (request.action === "postSelected") {
    selectedPost = request.post;
    console.log("Background script stored post:", selectedPost);
    sendResponse({status: "Post received by background script"});
    return true;
  } else if (request.action === "getSelectedPost") {
    console.log("Background script sending post:", selectedPost);
    sendResponse({post: selectedPost});
    return true;
  }
});