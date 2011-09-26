Future: ScreenCast extension for screen sharing.

# High level description

Broadcasting:
1. Capture screenshots at some frame rate
2. Compute differences between subsequent frames (pixel-by-pixel, hashing)
3. Decide which frames are key frames (significantly different)
4. Send key frames to appengine server

(V2: attempt to send diff frames)

Viewing:
1. Go to the appengine server viewing page
2. Viewing page polls with XHR (or the channels API) to get new images.

# Implementation

Client is mostly done. Just need server.

## AppEngine server for image hosting and serving

V1 API:

* Create screencast with name

    createScreencast(name)

* Upload image at time relative to video start:

    uploadImage(screencastId, time)

* Get image at time for a given screencast:

    getImage(screencastId, time)

Note: images can be as sparse (every 30 FPS for recordings) or as
not-sparse (variable ~= 1 FPS for presentations) as you want. This
allows having very dynamic videos, or just presentation-like broadcasts.

## Player for viewing 'video'
