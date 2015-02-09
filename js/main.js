chrome.system.network.getNetworkInterfaces(function(i){
	for (n=0; n<i.length; n++) {
		if (i[n].address.split(".").length == 4) {
			NET_IP = i[n].address;
			console.log("IP: "+NET_IP);
			networkConnection(NET_IP);
			return;
		}
	}

	
});

function getIPs(callback){
    var ip_dups = {};

    var RTCPeerConnection = window.RTCPeerConnection
        || window.mozRTCPeerConnection
        || window.webkitRTCPeerConnection;

    if (!RTCPeerConnection) {
        var iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        var win = iframe.contentWindow;
        window.RTCPeerConnection = win.RTCPeerConnection;
        window.mozRTCPeerConnection = win.mozRTCPeerConnection;
        window.webkitRTCPeerConnection = win.webkitRTCPeerConnection;
        RTCPeerConnection = window.RTCPeerConnection
            || window.mozRTCPeerConnection
            || window.webkitRTCPeerConnection;
    }

    var mediaConstraints = {
        optional: [{RtpDataChannels: true}]
    };

    var servers = undefined;

    if(window.webkitRTCPeerConnection)
        servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

    var pc = new RTCPeerConnection(servers, mediaConstraints);

    pc.onicecandidate = function(ice){

        if(ice.candidate){

            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
            var ip_addr = ip_regex.exec(ice.candidate.candidate)[1];

            if(ip_dups[ip_addr] === undefined)
                callback(ip_addr);

            ip_dups[ip_addr] = true;
        }
    };

    pc.createDataChannel("");

    pc.createOffer(function(result){
        pc.setLocalDescription(result, function(){}, function(){});

    }, function(){});
}

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
	    chrome.sockets.udp.send(result.socketId, messageBuffer, "224.0.0.9", 8080, function(sendInfo){
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

function networkConnection(NET_IP) {
	var fileName;
	finished = false;
	arrayToStoreChunks = [];

	chrome.sockets.udp.create({name:"airship"}, function(createInfo) {
		console.log(createInfo);
		chrome.sockets.udp.setMulticastTimeToLive(createInfo.socketId, 36, function(info){
			console.log("TTL: "+info)
				
			chrome.sockets.udp.bind(createInfo.socketId, "0.0.0.0", 8080, function(result) {
				chrome.sockets.udp.getInfo(createInfo.socketId, function(info) {
					console.log(info)
				})

				chrome.sockets.udp.joinGroup(createInfo.socketId, "224.0.0.9", function() {
					console.log("Joined Group")
					
					chrome.sockets.udp.getJoinedGroups(createInfo.socketId, function(groups) {
						console.log("Get Joined Groups: "+groups)
					})

				});

				$("#chooseFile").change(function(e) {
					chrome.storage.local.set({'socketId': createInfo.socketId}, function() {
			        	readVideoFile(e.target.files[0]);
			        });
					
				});
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

				
			});
		});
	});
}

