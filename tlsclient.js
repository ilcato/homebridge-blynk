const tls = require('tls');
const fs = require('fs');
const crypto = require('crypto');

const options = {
  // These are necessary only if using the client certificate authentication
  //key: fs.readFileSync('client-key.pem'),
  //cert: fs.readFileSync('client-cert.pem'),

  // This is necessary only if the server uses the self-signed certificate
  //ca: [ fs.readFileSync('server-cert.pem') ]
  host: "127.0.0.1",
  rejectUnauthorized: false
};

var socket = tls.connect(8443, options, () => {
  console.log('client connected',
              socket.authorized ? 'authorized' : 'unauthorized');
});
//socket.setEncoding('utf8');
socket.on('data', (data) => {
	switch (data[0]) {
		case MsgType.RESPONSE:
			console.log("Response code: " + data.readUInt16BE(3));
			break;
		case MsgType.HARDWARE:
			var resp = data.toString('utf8', 5);
			var fields = resp.split('\0');
			console.log("Hardware response: ");
			console.log("\tdashboard id: " + parseInt(fields[0]));
			console.log("\tpin command: " + fields[1]);
			console.log("\tpin: " + fields[2]);
			console.log("\tpin value: " + fields[3]);
			break;
		default:
			console.log("Response raw data: " + data);
			break;
	}
});
socket.on('end', () => {
  server.close();
});


process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
	  send(chunk.slice(0, -1));
  //  process.stdout.write(`data: ${chunk}`);
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end');
});

var msgId = 1;

function send(data) {
        if (!socket) {
            return;
        }

        var commandAndBody = data.split(" ");
        var message = createMessage(commandAndBody);
        socket.write(message);
}

// pass	"spZey2+RIc+QJmvY7ZdYJsQNWMpKmcjLDqgnIFDmOK8="	

// iLyuKJ6YISUsldLGzwDQ/kkDO1opksD7MmJCFOQtKc4=

function createMessage(commandAndBody) {
		var cmdBody = null;
        var cmdString = commandAndBody[0];
        var cmd = getCommandByString(cmdString);
		if (cmd == MsgType.LOGIN) {
			var username = commandAndBody[1];
			var pwd = commandAndBody[2];
			var hUser = crypto.createHash('sha256');
			var hPwd = crypto.createHash('sha256');
			var salt = hUser.update(username.toLowerCase()).digest();
			hPwd.update(pwd, "utf8");
			hPwd.update(salt, "utf8");			
			var finalHash = hPwd.digest('base64');			
			cmdBody = username + "\0" + finalHash;
		} else {       
			cmdBody = commandAndBody.length > 1 ? commandAndBody.slice(1).join('\0') : null;
		}
        return buildBlynkMessage(cmd, msgId++, cmdBody);
}

function buildBlynkMessage(cmd, msgId, cmdBody) {
        const BLYNK_HEADER_SIZE = 5;
        var bodyLength = (cmdBody ? cmdBody.length : 0);

        var bufArray = new ArrayBuffer(BLYNK_HEADER_SIZE + bodyLength);
        var dataview = new DataView(bufArray);
        dataview.setInt8(0, cmd);
        dataview.setInt16(1, msgId);
        dataview.setInt16(3, bodyLength);

        if (bodyLength > 0) {
            //todo optimize. should be better way
            var buf = new ArrayBuffer(bodyLength); // 2 bytes for each char
            var bufView = new Uint8Array(buf);
            for (var i = 0, offset =  5; i < cmdBody.length; i++, offset += 1) {
                dataview.setInt8(offset, cmdBody.charCodeAt(i));
            }
        }

        return new Buffer(bufArray);
}
var MsgType = {
    RESPONSE      		:  0,
    LOGIN         		:  2,
    PING          		:  6,
    ACTIVATE_DASHBOARD	: 7,
    TWEET         		:  12,
    EMAIL         		:  13,
    NOTIFY        		:  14,
    BRIDGE        		:  15,
    HW_SYNC       		:  16,
    HW_INFO       		:  17,
    HARDWARE      		:  20
    
};

var MsgStatus = {
    OK                    :  200,
    ILLEGAL_COMMAND       :  2,
    NO_ACTIVE_DASHBOARD   :  8,
    INVALID_TOKEN         :  9,
    ILLEGAL_COMMAND_BODY  : 11
};

function getCommandByString(cmdString) {
    switch (cmdString) {
        case "ping" :
            return MsgType.PING;
        case "login" :
            return MsgType.LOGIN;
        case "activate":
        	return MsgType.ACTIVATE_DASHBOARD;
        case "hardware" :
            return MsgType.HARDWARE;
    }
}

function getStringByCommandCode(cmd) {
    switch (cmd) {
        case 0 :
            return "RESPONSE";
        case 20 :
            return "HARDWARE";
    }
}

function getStatusByCode(statusCode) {
    switch (statusCode) {
        case 200 :
            return "OK";
        case 2 :
            return "ILLEGAL_COMMAND";
        case 8 :
            return "NO_ACTIVE_DASHBOARD";
        case 9 :
            return "INVALID_TOKEN";
        case 11 :
            return "ILLEGAL_COMMAND_BODY";
    }
}
