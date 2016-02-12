// Blynk Platform plugin for HomeBridge
//
// Remember to add platform to config.json. Example:
// "platforms": [
//             {
//             "platform": "Blynk",
//             "name": "Blynk",
//             "server": "PUT THE ADDRESS OF THE BLYNK SERVER HERE, PROTOCOL AND PORT INCLUDED",
//             "authtoken": "PUT THE VALUE OF YOUR BLYNK APPLICATION AUTH TOKEN HERE",
//             "accessories": [{
//                     "name": "ButtonV1",
//                     "type":	"Button",
//                     "mode": "Switch",
//                     "caption": "Internal Led",
//                     "output": "V1"
//             	}
//             ]
//         }
// ],
//
// When you attempt to add a device, it will ask for a "PIN code".
// The default code for all HomeBridge accessories is 031-45-154.

'use strict';

// TODO: remove when using a full signed certificate 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var Service, Characteristic;
var request = require("request");

function BlynkPlatform(log, config) {
  	this.log          	= log;
  	this.server			= config["server"];
  	this.authtoken     	= config["authtoken"];
  	this.BlynkAccessories = config["accessories"];
}

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerPlatform("homebridge-blynk", "Blynk", BlynkPlatform);
}

BlynkPlatform.prototype = {
  accessories: function(callback) {
      this.log("Loading accessories...");

      var that = this;
      var foundAccessories = [];
      if (this.BlynkAccessories == null || this.BlynkAccessories.length == 0) {
      	callback(foundAccessories); 
      	return;
      }
	  this.BlynkAccessories.map(function(s) {
		that.log("Found: " + s.name);
			var accessory = null;
			var services = [];
			switch (s.type) {
				case "Button":
					var service = {
						controlService: new Service.Switch(s.caption),
						characteristics: [Characteristic.On]
					};
					service.controlService.blynkType = s.type;
					service.controlService.subtype = s.mode;
					service.controlService.output = s.output;
					services.push(service);
					accessory = new BlynkAccessory(services);
					break;
				default:
					break;
			}
			if (accessory != null) {
				accessory.getServices = function() {
						return that.getServices(accessory);
				};
				accessory.platform 			= that;
				accessory.remoteAccessory	= s;
				accessory.name				= s.name;
				accessory.model				= "Blynk";
				accessory.manufacturer		= "Blynk";
				accessory.serialNumber		= "<unknown>";
				foundAccessories.push(accessory);
			}
		}
	  )
      callback(foundAccessories);
  },
  command: function(c, value) {
    var url = this.server + "/" + this.authtoken + "/pin/" + c;
	var method = "put";
	var body = value != undefined ? JSON.stringify(
			  [	value ? "1" : "0" ]
		) : null;
    var that = this;
    request({
	    url: url,
		body: body,
		method: method,
        headers: {
		    'Content-Type': 'application/json'
  		}
    }, function(err, response) {
      if (err) {
        that.log("There was a problem sending command " + url);
      } else {
        that.log("Sent command " + url);
      }
    });
  },
  getAccessoryValue: function(callback, homebridgeAccessory, characteristic, service) {
	var pin = service.controlService.output;
    var url = this.server + "/" + this.authtoken + "/pin/" + pin;
	var method = "get";
    var that = this;
    request({
	    url: url,
		method: method,
        headers: {
		    'Content-Type': 'application/json'
  		},
	    json: true
    }, function(err, response, json) {
      if (!err && response.statusCode == 200) {
		switch (service.controlService.blynkType) {
			case "Button":
		    	callback(undefined, json[0] == "1" ? true : false);
		    	break;
		    default:
		    	break;
		}
      } else {
        that.log("There was a problem getting value from" + url);
      }
    })
  },
  getInformationService: function(homebridgeAccessory) {
    var informationService = new Service.AccessoryInformation();
    informationService
                .setCharacteristic(Characteristic.Name, homebridgeAccessory.name)
				.setCharacteristic(Characteristic.Manufacturer, homebridgeAccessory.manufacturer)
			    .setCharacteristic(Characteristic.Model, homebridgeAccessory.model)
			    .setCharacteristic(Characteristic.SerialNumber, homebridgeAccessory.serialNumber);
  	return informationService;
  },
  bindCharacteristicEvents: function(characteristic, service, homebridgeAccessory) {
   	characteristic
		.on('set', function(value, callback, context) {
						if(context !== 'fromSetValue') {
							switch (service.controlService.blynkType) {
								case "Button":
									var pin = service.controlService.output;
									homebridgeAccessory.platform.command(pin, value, homebridgeAccessory);
									if (service.controlService.subtype == "PUSH") {
										// In order to behave like a push button reset the status to off
										setTimeout( function(){
											characteristic.setValue(false, undefined, 'fromSetValue');
										}, 100 );
									}		 
									break;
								default:
									break;
							}
						} 
						callback();
				   }.bind(this) );
    characteristic
        .on('get', function(callback) {
						homebridgeAccessory.platform.getAccessoryValue(callback, homebridgeAccessory, characteristic, service)
                   }.bind(this) );
  },
  getServices: function(homebridgeAccessory) {
  	var services = [];
  	var informationService = homebridgeAccessory.platform.getInformationService(homebridgeAccessory);
  	services.push(informationService);
  	for (var s = 0; s < homebridgeAccessory.services.length; s++) {
		var service = homebridgeAccessory.services[s];
		for (var i=0; i < service.characteristics.length; i++) {
			var characteristic = service.controlService.getCharacteristic(service.characteristics[i]);
			if (characteristic == undefined)
				characteristic = service.controlService.addCharacteristic(service.characteristics[i]);
			homebridgeAccessory.platform.bindCharacteristicEvents(characteristic, service, homebridgeAccessory);
		}
		services.push(service.controlService);
    }
    return services;
  }  
}

function BlynkAccessory(services) {
    this.services = services;
}
