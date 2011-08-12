function $(id) { return document.querySelector(id); }

var background = chrome.extension.getBackgroundPage();
// Images from the screen capture
var images = background.images;
var currentIndex = 0;
// Where to render the image
var $image = $('#image');
// Playback timer
var timer = null;

document.addEventListener('DOMContentLoaded', function() {
  // Setup listeners for rew, pp, ff and slider
  $('#slider').addEventListener('change', function(event) {
    var ratio = $('#slider').value / 100;
    setIndex(parseInt((images.length - 1) * ratio, 10));
    pause();
  });

  $('#playpause').addEventListener('click', function(event) {
    playpause();
  });

  $('#still').addEventListener('click', function(event) {
    shareStill();
  });

  $('#video').addEventListener('click', function(event) {
    alert('Sorry, video sharing is not implemented yet');
    //shareVideo();
  });

  document.addEventListener('keydown', function(event) {
    if (event.keyCode == 32) {
      playpause();
    }
  });

  // Set the first frame
  setIndex(currentIndex);
  // Set the state to playback
  setState('playback');
});

function updateSliderPosition() {
  setState('playback');
  var percent = parseInt(currentIndex * 100 / (images.length - 1), 10);
  $('#slider').value = percent;
}

function playpause() {
  if (timer) {
    pause();
  } else {
    play();
  }
}

function play() {
  // Update icon
  $('#playpause').className = 'pause';
  // If already at the end, restart
  if (currentIndex == images.length - 1) {
    setIndex(0);
    updateSliderPosition();
  }
  // Load images and render them in sequence
  timer = setInterval(function() {
    if (currentIndex >= images.length - 1) {
      pause();
      return;
    }
    setIndex(currentIndex + 1);
    updateSliderPosition();
  }, 1000 / background.FPS);
}

function pause() {
  $('#playpause').className = 'play';
  clearInterval(timer);
  timer = null;
}

function setIndex(index) {
  if (index >= images.length) {
    console.error('Index out of bounds');
    return;
  }
  currentIndex = index;
  // TODO: validate index
  $image.src = images[index];
}

function shareVideo() {
  setState('upload');
  setProgress(0);
  var converter = new ImagesToVideo(background.FPS);
  // First, upload all of the images to the server
  (function addImage(index) {
    if (index < images.length) {
      // While there are images left, add them to the converter
      var image = images[index];
      converter.addImage(index, image, function() {
        addImage(index + 1);
        setProgress(100 * index / images.length);
      });
    } else {
      setProgress(95);
      // Once all are gone, call the server
      converter.getVideo(function(data) {
        setSharedInfo(data.url, 'Screen capture uploaded!', '#');
        setState('shared');
      });
    }
  })(0);
}

function shareStill() {
  setState('upload');
  setProgress(0);
  // Get the current image
  var dataUri = images[currentIndex];
  setProgress(10);
  // Upload it
  getOrCreateAlbum('screenshot', function(albumId) {
    uploadPhoto(albumId, dataUri, function(data) {
      setProgress(100);
      console.log('upload success', data);
      setSharedInfo(data.url, 'Still image uploaded!');
      setState('shared');
    }, function(loaded, total) {
      var percent = 10 + loaded / total * 80;
      setProgress(percent);
    });
  });
}

/**
 * @param {String} state can be 'playback', 'upload', 'shared'
 */
function setState(state) {
  var STATES = ['playback', 'upload', 'shared'];
  STATES.forEach(function(s) {
    $('#bottom .' + s).style.display = (s == state ? 'block' : 'none');
  });
}

/**
 * @param {Int} percent goes from 0 to 100.
 */
function setProgress(percent) {
  document.querySelector('.upload .progress').style.width = percent + '%';
}

/**
 * @param {String} url the URL that was shared
 * @param {String} message (optional) message to the user
 * @param {Object} editUrl (optional) URL to edit the uploaded asset
 */
function setSharedInfo(url, message, editUrl) {
  // Set link
  var link = $('#bottom .shared .link');
  link.innerText = url;
  // If message specified, set it
  if (message) {
    $('#bottom .shared .message').innerText = message;
  }
  // If editUrl specified, make sure user can click it
  if (editUrl) {
  }
  // Lastly, select the URL
  setTimeout(function() { selectElementContents(link); }, 200);
}

function selectElementContents(element) {
  var range = document.createRange();
  element.focus();
  range.setStart(element.firstChild, 0);
  range.setEnd(element.lastChild, element.innerText.length);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

