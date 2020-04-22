(function () {
  if (!window.navigator) window.navigator = {};
  window.navigator.getUserMedia = function () {
    webkit.messageHandlers.callbackHandler.postMessage(arguments);
  };
})();

int exec_id = 0;
function exec(success, failure, ...) {
  // store the callbacks for later
  if (typeof success == 'function' || typeof failure == 'function') {
    exec_id++;
    exec_callbacks[exec_id] = { success: success, failure: failure };
    var commandId = exec_id;
  }
  webkit.messageHandlers.callbackHandler.postMessage({id: commandId, args: ...})
}

// the native code calls this directly with the same commandId, so the callbacks can be performed and released
function callback(opts) {
  if (opts.status == "success") {
    if (typeof exec_callbacks[opts.id].success == 'function') exec_callbacks[opts.id].success(opts.args);
  } else {
    if (typeof exec_callbacks[opts.id].failure == 'function') exec_callbacks[opts.id].failure(opts.args);
  }
  // some WebRTC functions invoke the callbacks multiple times
  // the native Cordova plugin uses setKeepCallbackAs(true)
  if (!opts.keepalive) delete exec_callbacks[opts.id];
}

// Set constraints for the video stream
var constraints = { video: { facingMode: 'user' }, audio: false };

// Define constants
const cameraView = document.querySelector('#camera--view'),
  cameraOutput = document.querySelector('#camera--output'),
  cameraSensor = document.querySelector('#camera--sensor'),
  cameraTrigger = document.querySelector('#camera--trigger');

// Access the device camera and stream to cameraView
function cameraStart() {
  webkit.messageHandlers.callbackHandler.postMessage('Camera start');
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      webkit.messageHandlers.callbackHandler.postMessage('getUserMedia stream');
      track = stream.getTracks()[0];
      cameraView.srcObject = stream;
    })
    .catch(function (error) {
      console.error('Oops. Something is broken.', error);
      webkit.messageHandlers.callbackHandler.postMessage(
        'Oops. Something is broken.' + JSON.stringify(error)
      );
    });
}

// Take a picture when cameraTrigger is tapped
cameraTrigger.onclick = function () {
  cameraSensor.width = cameraView.videoWidth;
  cameraSensor.height = cameraView.videoHeight;
  cameraSensor.getContext('2d').drawImage(cameraView, 0, 0);
  cameraOutput.src = cameraSensor.toDataURL('image/webp');
  cameraOutput.classList.add('taken');
};

// Start the video stream when the window loads
window.addEventListener('load', cameraStart, false);
