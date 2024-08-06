console.log("Content script loaded");

let lastDetectedPlatform = null;

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
  const contentElement = postElement.querySelector('.feed-shared-update-v2__description, .feed-shared-text, .break-words, [data-testid="post-view-body"]');
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
  const contentElement = tweetElement.querySelector('div[data-testid="tweetText"]');
  if (!contentElement) {
    console.log("Twitter content element not found");
    return null;
  }

  const contentClone = contentElement.cloneNode(true);
  contentClone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  contentClone.querySelectorAll('div').forEach(div => div.insertAdjacentHTML('afterend', '\n\n'));
  
  const content = contentClone.innerText.trim();
  const authorElement = tweetElement.querySelector('div[data-testid="User-Name"]');
  const author = authorElement ? authorElement.textContent.trim() : 'Unknown';
  
  const tweetNumberElement = tweetElement.querySelector('span[data-testid="tweetText"] > span');
  const tweetNumber = tweetNumberElement ? tweetNumberElement.textContent.trim().split('/')[0] : '';

  const engagementMetrics = {
    likes: tweetElement.querySelector('div[data-testid="like"] span')?.textContent.trim() || '0',
    retweets: tweetElement.querySelector('div[data-testid="retweet"] span')?.textContent.trim() || '0'
  };

  return {
    content,
    author,
    tweetNumber,
    engagementMetrics,
    platform: 'Twitter'
  };
}

function extractTwitterThread(initialTweet) {
  console.log("Extracting Twitter thread");
  let threadTweets = [extractTwitterPost(initialTweet)];
  let currentTweet = initialTweet;

  while (true) {
    let nextTweet = currentTweet.nextElementSibling;
    if (nextTweet && nextTweet.matches('div[class="css-175oi2r"]')) {
      const tweetArticle = nextTweet.querySelector('article[data-testid="tweet"]');
      if (tweetArticle) {
        const extractedTweet = extractTwitterPost(tweetArticle);
        if (extractedTweet) {
          threadTweets.push(extractedTweet);
          currentTweet = nextTweet;
          continue;
        }
      }
    }
    break;
  }

  console.log(`Extracted ${threadTweets.length} tweets from thread`);
  return threadTweets;
}

function handleTwitterPost(clickedElement) {
  const tweetArticle = clickedElement.closest('article[data-testid="tweet"]');
  if (!tweetArticle) {
    console.log("No tweet found");
    return null;
  }

  const isThread = !!tweetArticle.querySelector('div[aria-label="Thread"]');
  
  if (isThread) {
    console.log("Thread detected");
    return extractTwitterThread(tweetArticle);
  } else {
    console.log("Single tweet detected");
    return [extractTwitterPost(tweetArticle)];
  }
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
    postData = handleTwitterPost(event.target);
  }

  if (currentPlatform !== lastDetectedPlatform) {
    console.log("Platform changed, clearing previous post data");
    chrome.runtime.sendMessage({action: "clearPost"}, function(response) {
      console.log("Cleared previous post data:", response);
    });
    lastDetectedPlatform = currentPlatform;
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