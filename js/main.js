console.log("Main app starting")

chrome.bluetooth.getDevices(function(devices) {
  console.log("searching for devices")
  for (var i = 0; i < devices.length; i++) {
    console.log(devices[i].address);
  }
});