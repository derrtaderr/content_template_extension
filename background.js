let selectedPost = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);
  
  if (request.action === "postSelected") {
    selectedPost = request.post;
    console.log("Stored selected post:", selectedPost);
    sendResponse({status: "Post stored successfully"});
  } else if (request.action === "getSelectedPost") {
    console.log("Returning selected post:", selectedPost);
    sendResponse({post: selectedPost});
  }
  
  return true; // Keeps the message channel open for asynchronous response
});