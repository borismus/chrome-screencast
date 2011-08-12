var google = new OAuth2('google', {
  client_id: '952993494713-h12m6utvq8g8d8et8n2i68plbrr6cr4d.apps.googleusercontent.com',
  client_secret: 'IZ4hBSbosuhoWAX4lyAomm-R',
  api_scope: 'https://www.googleapis.com/auth/photos'
});

var ALBUM_NAME = 'screenshots';
var CREATE_ALBUM_URL = 'https://picasaweb.google.com/data/feed/api/user/default?alt=json';
var LIST_ALBUM_URL = 'https://picasaweb.google.com/data/feed/api/user/default?alt=json';
var CREATE_PHOTO_URL = 'https://picasaweb.google.com/data/feed/api/user/default/albumid/{{albumId}}?alt=json';
var SHORTENER_URL = 'https://www.googleapis.com/urlshortener/v1/url';

function createAlbum(albumName, callback) {
google.authorize(function() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', CREATE_ALBUM_URL, true);
  xhr.setRequestHeader('Authorization', 'OAuth ' + google.getAccessToken());
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function(e) {
    if (this.status == 200) {
      var data = JSON.parse(xhr.responseText);
      console.log('created album', data);
      if (callback) {
        callback(data);
      }
    }
  };
  xhr.send(JSON.stringify({
    displayName: albumName
  }));
});
}

function getAlbum(albumName, callback) {
google.authorize(function() {
  // List all albums and check if any are called albumName
  var xhr = new XMLHttpRequest();
  xhr.open('GET', LIST_ALBUM_URL, true);
  xhr.setRequestHeader('Authorization', 'OAuth ' + google.getAccessToken());
  xhr.onload = function(e) {
    if (this.status == 200) {
      var data = JSON.parse(xhr.responseText);
      var entries = data.feed.entry;
      //console.log('fetched albums', data);
      for (var i = 0; i < entries.length; i++) {
        var item = entries[i];
        if (item.title.$t == albumName) {
          //console.log(albumName);
          callback(item);
          return;
        }
      }
      callback();
    }
  };
  xhr.send();
});
}

function getOrCreateAlbum(albumName, callback) {
  var albumId = null;
  getAlbum(albumName, function(album) {
    if (album) {
      albumId = album.gphoto$id.$t;
      callback(albumId);
    } else {
      createAlbum(albumName, function(album) {
        albumId = album.id;
        callback(albumId);
      });
    }
  });
}

function uploadPhoto(albumId, dataURI, callback, progressCallback) {
google.authorize(function() {
  var url = CREATE_PHOTO_URL.replace('{{albumId}}', albumId);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Authorization', 'OAuth ' + google.getAccessToken());
  xhr.setRequestHeader('Content-Type', 'image/jpeg');
  xhr.onload = function(e) {
    if (this.status == 201) {
      var data = JSON.parse(xhr.responseText);
      // Get the URL to the raw image
      var url = getRawUrl(data);
      // Shorten the URL
      shortenURL(url, function(shortenedUrl) {
        callback({url: shortenedUrl});
      });
    }
  };
  if (progressCallback) {
    xhr.upload.onprogress = function(e) {
      console.log('progress', e.lengthComputable, e.loaded, e.total);
      if (e.lengthComputable) {
        progressCallback(e.loaded, e.total);
      }
    };
  }
  var array = convertDataURIToBinary(dataURI);
  xhr.send(array.buffer);
});
}

function shortenURL(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', SHORTENER_URL, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function(e) {
    if (this.status == 200) {
      var response = JSON.parse(xhr.responseText);
      callback(response.id);
    }
  };
  xhr.send(JSON.stringify({longUrl: url}));
}


var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
  var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  var base64 = dataURI.substring(base64Index);
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for(i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

function getRawUrl(data) {
  var links = data.entry.link;
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (link.type == 'image/jpeg') {
      return link.href;
    }
  }
  return null;
}
