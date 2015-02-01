console.log("Main app starting")

var device_names = {};
var updateDeviceName = function(device) {
  device_names[device.address] = device.name;
};
var removeDeviceName = function(device) {
  delete device_names[device.address];
}

// Add listeners to receive newly found devices and updates
// to the previously known devices.
chrome.bluetooth.onDeviceAdded.addListener(updateDeviceName);
chrome.bluetooth.onDeviceChanged.addListener(updateDeviceName);
chrome.bluetooth.onDeviceRemoved.addListener(removeDeviceName);

chrome.bluetooth.getDevices(function(devices) {
  console.log("Devices: "+devices)
  for (var i = 0; i < devices.length; i++) {
    console.log(devices[i].address);
  }
});

chrome.bluetooth.startDiscovery(function() {
  // Stop discovery after 30 seconds.
  console.log("searching for devices")
  setTimeout(function() {
    chrome.bluetooth.stopDiscovery(function() {});
  }, 1000000);
});