// Blynk Platform plugin for HomeBridge
//
// Remember to add platform to config.json. Example:
// "platforms": [
//             {
//             "platform": "Blynk",
//             "name": "Blynk",
//             "server": "PUT THE ADDRESS OF THE LOCAL BLYNK SERVER HERE",
//             "appPort": "PUT THE PORT OF THE LOCAL BLYNK SERVER HERE, TIPICALLY 8443",
//             "username": "PUT THE VALUE OF THE USERNAME HERE",
//             "password": "PUT THE VALUE OF THE PASSWORD HERE",
// 			   "dashboardName": "PUT THE DASHBOARD NAME HERE",
//             "accessories": [
//             	{
//                     "name": 		"SwitchD5",
//                     "widget":	"Switch",
//                     "mode": 		"SWITCH",
//                     "caption": 	"Lamp 1",
//                     "pin": 		"D5"
//             	},
//             	{
//                 	"name": 		"ContactSensor1",
//                     "widget":	"ContactSensor",
//                     "caption": 	"Door 1",
//                     "pin": 		"D4"
//             	},
//             	{
//                 	"name": 		"TemperatureSensor1",
//                     "widget":		"TemperatureSensor",
//                     "caption": 		"Temperature 1",
//                     "pin": 			"V2"
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

const UPDATE_PERIOD = 2000;
const INITIAL_UPDATE_PERIOD = 10000;


module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerPlatform("homebridge-blynk", "Blynk", BlynkPlatform);
}

function BlynkPlatform(log, config) {
  	this.log          	= log;
  	this.server			= config["server"];
  	this.appPort     		= config["appPort"];
  	this.BlynkAccessories = config["accessories"];
	this.BlynkToken     = config["token"];
}
BlynkPlatform.prototype.accessories = function(callback) {
	this.log("Loading accessories...");

	var that = this;
	var foundAccessories = [];
	if (this.BlynkAccessories == null || this.BlynkAccessories.length == 0) {
		callback(foundAccessories); 
		return;
	}
			that.BlynkAccessories.map(function(s) {
				that.log("Found: " + s.name);
				var accessory = null;
				var services = [];
				var service = null;
				switch (s.widget) {
					case "Switch":
						service = {
							controlService: new Service.Switch(s.caption),
							characteristics: [Characteristic.On]
						};
						service.controlService.mode = s.mode;
						break;
					case "TemperatureSensor":
						service = {
							controlService: new Service.TemperatureSensor(s.caption),
							characteristics: [Characteristic.CurrentTemperature]
						};
						break;
					case "HumiditySensor":
						service = {
							controlService: new Service.HumiditySensor(s.caption),
							characteristics: [Characteristic.CurrentRelativeHumidity]
						};
						break;
					default:
						break;
				}
				if (service != null) {
					service.controlService.widget = s.widget;
					service.controlService.pin = s.pin;
					services.push(service);
					accessory = new BlynkAccessory(services);
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
			
		);
		  callback(foundAccessories);

}
BlynkPlatform.prototype.hardwareWrite = function(pinString, value) {
	/*var pinType = pinString.substr(0,1).toLowerCase();
	var pin = pinString.substr(1);
	var that = this;
	this.blynkServer.hardware(this.dashboard.id, pinType, "w", pin, value ? 1 : 0)
	.catch(function (err) {
		that.log("There was a problem sending hardware write command on: " + pinString);
	});*/
}
BlynkPlatform.prototype.hardwareRead = function(callback, characteristic, service) {
		
	var pinString = service.controlService.pin;
	var pinType = pinString.substr(0,1).toLowerCase();
	var pin = parseInt(pinString.substr(1));
	
	request('https://'+this.server+':'+this.appPort+'/'+this.BlynkToken+'/pin/'+pinString, function (error, response, body) {
	  var retValue = null;
	  console.log('Status:', response.statusCode);
	  console.log('Headers:', JSON.stringify(response.headers));
	  console.log('Response:', body);
	  
	switch (service.controlService.widget) {
			case "Switch":
				retValue = pinValue == "1" ? true : false;
				break;
			case "TemperatureSensor":
				retValue = parseFloat(JSON.parse(body));
				break;
			case "HumiditySensor":
				retValue = parseFloat(JSON.parse(body));
				break;
			default:
				break;
		}
		
	if (callback)
	  callback(undefined, retValue);
	})

}
BlynkPlatform.prototype.getInformationService = function(homebridgeAccessory) {
    var informationService = new Service.AccessoryInformation();
    informationService
                .setCharacteristic(Characteristic.Name, homebridgeAccessory.name)
				.setCharacteristic(Characteristic.Manufacturer, homebridgeAccessory.manufacturer)
			    .setCharacteristic(Characteristic.Model, homebridgeAccessory.model)
			    .setCharacteristic(Characteristic.SerialNumber, homebridgeAccessory.serialNumber);
  	return informationService;
}
BlynkPlatform.prototype.bindCharacteristicEvents = function(characteristic, service, homebridgeAccessory) {
	setTimeout( function() {
		this.updateWidget(service, characteristic)
	}.bind(this), INITIAL_UPDATE_PERIOD);
	characteristic
		.on('set', function(value, callback, context) {
						if(context !== 'fromSetValue' && context !== 'fromPoller') {
							switch (service.controlService.widget) {
								case "Switch":
									var pin = service.controlService.pin;
									this.hardwareWrite(pin, value, homebridgeAccessory);
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
						this.hardwareRead(callback, characteristic, service)
                   }.bind(this) );
}
BlynkPlatform.prototype.getServices = function(homebridgeAccessory) {
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
BlynkPlatform.prototype.updateWidget = function(service, characteristic) {
	
	var pinString = service.controlService.pin;
	var pinType = pinString.substr(0,1).toLowerCase();
	var pin = parseInt(pinString.substr(1));
	
	request('https://'+this.server+':'+this.appPort+'/'+this.BlynkToken+'/pin/'+pinString, function (error, response, body) {
	  var retValue = null;
	  console.log('Status:', response.statusCode);
	  console.log('Headers:', JSON.stringify(response.headers));
	  console.log('Response:', body);
	  
	switch (service.controlService.widget) {
			case "Switch":
				retValue = pinValue == "1" ? true : false;
				break;
			case "TemperatureSensor":
				retValue = parseFloat(JSON.parse(body));
				break;
			case "HumiditySensor":
				retValue = parseFloat(JSON.parse(body));
				break;
			default:
				break;
		}
		
		characteristic.setValue(parseFloat(JSON.parse(body)), undefined, 'fromPoller');
	});
}

function BlynkAccessory(services) {
    this.services = services;
}
