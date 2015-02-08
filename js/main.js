function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function saveToDisk(fileUrl, fileName) {
    var save = document.createElement('a');
    save.href = fileUrl;
    save.target = '_blank';
    save.download = fileName || fileUrl;

    var event = document.createEvent('Event');
    event.initEvent('click', true, true);

    save.dispatchEvent(event);
    (window.URL || window.webkitURL).revokeObjectURL(save.href);
    console.log(save)
}

function onReadAsDataURL(event, text) {
    var data = {}; // data object to transmit over data channel

    if (event) text = event.target.result; // on first invocation
    
    if (text.length > chunkLength) {
        data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
    } else {
        data.message = text;
        finished = true;
    }

    console.log(data.message)
	var messageBuffer = str2ab(data.message)

	console.log("Sending...")
	chrome.storage.local.get('socketId', function (result) {
		console.log(result.socketId)
	    chrome.sockets.udp.send(result.socketId, messageBuffer, "10.0.0.139", 8080, function(sendInfo){
			console.log("Send Info: "+JSON.stringify(sendInfo));
			var remainingDataURL = text.slice(data.message.length);
		    if (remainingDataURL.length)  onReadAsDataURL(null, remainingDataURL);
		});    
    });

}

function readVideoFile(file) {
	var reader = new window.FileReader();
	reader.readAsDataURL(file);

	fileName = file.name;
	reader.onload = onReadAsDataURL;

	chunkLength = 1000;
}



function networkConnection() {
	finished = false;
	arrayToStoreChunks = [];

	chrome.sockets.udp.create({name:"airship"}, function(createInfo) {
		console.log(createInfo)
		chrome.sockets.udp.bind(createInfo.socketId, "10.0.0.139", 8080, function(result) {

			chrome.sockets.udp.onReceive.addListener(function(info) {
				if (info.socketId != createInfo.socketId) return;
				arrayToStoreChunks.push(ab2str(info.data));
				console.log("Received Message");
				if (finished == true) {
					console.log("Finished")
					saveToDisk(arrayToStoreChunks.join(''), fileName)
					delete fileName;
					arrayToStoreChunks = [];
				}
				
			});

			$("#chooseFile").change(function(e) {
				chrome.storage.local.set({'socketId': createInfo.socketId}, function() {
		          readVideoFile(e.target.files[0]);
		        });
				
			});
		});
	});
}

 networkConnection()