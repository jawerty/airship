console.log("Background app started")

chrome.app.runtime.onLaunched.addListener(function() {
  new socketHandler();
});


var socketHandler = function() {
  var screenWidth = screen.availWidth;
  var screenHeight = screen.availHeight;
  var width  = 1200;
  var height = 860;

  chrome.app.window.create(
    'index.html', {
      id: "Airship",
      minWidth:  600,
      minHeight: 600,
      state: "normal",
    },
    
    function(win) {
      win.onClosed.addListener(function() {
      });
    }
  );
}
