var FPS = 10;
var QUALITY = 50;

var isRecording = false;
var timer = null;
var images = [];

function startRecording() {
  // Update icon to show that it's recording
  chrome.browserAction.setIcon({path: 'images/icon-rec.png'});
  chrome.browserAction.setTitle({title: 'Stop recording.'});
  images = [];
  // Set up a timer to regularly get screengrabs
  timer = setInterval(function() {
    chrome.tabs.captureVisibleTab(null, {quality: QUALITY}, function(img) {
      images.push(img);
    });
  }, 1000 / FPS);
}

function stopRecording() {
  // Update icon to show regular icon
  chrome.browserAction.setIcon({path: 'images/icon.png'});
  chrome.browserAction.setTitle({title: 'Start recording.'});
  // Stop the timer
  clearInterval(timer);
  // Playback the recorded video
  showVideoPlaybackPage();
}

function showVideoPlaybackPage() {
  var playbackUrl = chrome.extension.getURL('playback.html');
  chrome.tabs.create({url: playbackUrl});
}

// Listen for a click on the camera icon. On that click, take a screenshot.
chrome.browserAction.onClicked.addListener(function(tab) {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
  isRecording = !isRecording;
});
