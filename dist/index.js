//    Copyright 2018 ilcato
// 
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// Blynk Platform plugin for HomeBridge
//
// Remember to add platform to config.json. Example:
// "platforms": [
//     {
//     "platform": "Blynk",
//     "name": "Blynk",
//     "serverurl": "PUT THE URL OF THE BLYNK SERVER HERE, e.g.: http://10.0.0.102:8080",
//     "token" : "PUT YOUR PROJECT AUTHORIZATION TOKEN HERE",
//     "pollerperiod": "PUT 0 FOR DISABLING POLLING, 1 - 100 INTERVAL IN SECONDS. 1 SECONDS IS THE DEFAULT",
//     "accessories": [
//         {
//             "name": 		"Switch1",
//             "widget":		"Switch",
//             "mode": 		"SWITCH",
//             "caption": 		"Main Lamp",
//             "pin": 			"D3"
//         },
//         {
//             "name": 		"ContactSensor1",
//             "widget":		"ContactSensor",
//             "caption": 		"Main Door",
//             "pin": 			"D2"
//         },
//         {
//             "name": 		"TemperatureSensor1",
//             "widget":		"TemperatureSensor",
//             "caption": 		"Kitchen Temperature",
//             "pin": 			"A17"
//         }
//     ]
// }
// ],
//
// When you attempt to add a device, it will ask for a "PIN code".
// The default code for all HomeBridge accessories is 031-45-154.
'use strict';
const request = require("request");
const blynkaccessory_1 = require("./blynkaccessory");
const pollerupdate_1 = require("./pollerupdate");
const defaultPollerPeriod = 1;
let Accessory, Service, Characteristic, UUIDGen;
class Config {
    constructor() {
        this.name = "";
        this.serverurl = "";
        this.token = "";
        this.pollerperiod = "";
        this.accessories = "";
    }
}
class Blynk {
    constructor(log, config, api) {
        this.log = log;
        this.api = api;
        this.accessories = new Map();
        this.updateSubscriptions = new Array();
        this.config = config;
        let pollerPeriod = this.config.pollerperiod ? parseInt(this.config.pollerperiod) : defaultPollerPeriod;
        if (isNaN(pollerPeriod) || pollerPeriod < 1 || pollerPeriod > 100)
            pollerPeriod = defaultPollerPeriod;
        this.poller = new pollerupdate_1.Poller(this, pollerPeriod, Service, Characteristic);
        this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
    }
    didFinishLaunching() {
        this.log('didFinishLaunching.', '');
        this.LoadAccessories(this.config.accessories);
    }
    configureAccessory(accessory) {
        this.log("Configured Accessory: ", accessory.displayName);
        for (let s = 0; s < accessory.services.length; s++) {
            let service = accessory.services[s];
            for (let i = 0; i < service.characteristics.length; i++) {
                let characteristic = service.characteristics[i];
                if (characteristic.props.needsBinding)
                    this.bindCharacteristicEvents(characteristic, service);
            }
        }
        this.accessories.set(accessory.context.uniqueSeed, accessory);
        accessory.reachable = true;
    }
    LoadAccessories(accessories) {
        this.log('Loading accessories', '');
        if (accessories == null || accessories.length == 0) {
            return;
        }
        accessories.map((s, i, a) => {
            this.addAccessory(blynkaccessory_1.BlynkAccessory.createBlynkAccessory(s, Accessory, Service, Characteristic, this));
        });
        // Remove not reviewd accessories: cached accessories no more present in config.json
        let aa = this.accessories.values(); // Iterator for accessories, key is the uniqueseed
        for (let a of aa) {
            if (!a.reviewed) {
                this.removeAccessory(a);
            }
        }
        // Start the poller update mechanism
        this.poller.poll();
    }
    addAccessory(blynkAccessory) {
        if (blynkAccessory == undefined)
            return;
        let uniqueSeed = blynkAccessory.name;
        let isNewAccessory = false;
        let a = this.accessories.get(uniqueSeed);
        if (a == null) {
            isNewAccessory = true;
            let uuid = UUIDGen.generate(uniqueSeed);
            a = new Accessory(blynkAccessory.name, uuid); // Create the HAP accessory
            a.context.uniqueSeed = uniqueSeed;
            this.accessories.set(uniqueSeed, a);
        }
        blynkAccessory.setAccessory(a);
        // init accessory
        blynkAccessory.initAccessory();
        // Remove services existing in HomeKit, device no more present in Blynk
        blynkAccessory.removeNoMoreExistingServices();
        // Add services present in Blynk and not existing in Homekit accessory
        blynkAccessory.addNewServices(this);
        // Register or update platform accessory
        blynkAccessory.registerUpdateAccessory(isNewAccessory, this.api);
        this.log("Added/changed accessory: ", blynkAccessory.name);
    }
    removeAccessory(accessory) {
        this.log('Remove accessory', accessory.displayName);
        this.api.unregisterPlatformAccessories(blynkaccessory_1.pluginName, blynkaccessory_1.platformName, [accessory]);
        this.accessories.delete(accessory.context.uniqueSeed);
    }
    bindCharacteristicEvents(characteristic, service) {
        characteristic.on('set', (value, callback, context) => {
            this.setCharacteristicValue(value, callback, context, characteristic, service);
        });
        characteristic.on('get', (callback) => {
            this.getCharacteristicValue(callback, characteristic, service);
        });
        this.subscribeUpdate(service, characteristic);
    }
    subscribeUpdate(service, characteristic) {
        this.updateSubscriptions.push({ 'service': service, 'characteristic': characteristic });
    }
    setCharacteristicValue(value, callback, context, characteristic, service) {
        if (context !== 'fromPoller' && context !== 'fromSetValue') {
            let params = service.subtype.split("-"); // params[0]: name, params[1]: widget, params[2]: pin, params[3]: mode
            let name = params[0];
            let widget = params[1];
            let pinString = params[2];
            let mode = params[3];
            this.log("Setting value to device: ", `${name}, parameter: ${characteristic.displayName}, value: ${value}`);
            switch (widget) {
                case "Switch":
                    let v = value ? "1" : "0";
                    request(this.config.serverurl + '/' + this.config.token + '/update/' + pinString + "?value=" + v, function (error, response, body) {
                        if (!error && mode == "PUSH") {
                            // In order to behave like a push button reset the status to off
                            setTimeout(function () {
                                characteristic.setValue(false, undefined, 'fromSetValue');
                            }, 100);
                        }
                    });
                    break;
                default:
                    break;
            }
        }
        callback();
    }
    getCharacteristicValue(callback, characteristic, service) {
        this.log("Getting value from device: ", `parameter: ${characteristic.displayName}`);
        let params = service.subtype.split("-"); // params[0]: name, params[1]: widget, params[2]: pin, params[3]: mode
        let name = params[0];
        let widget = params[1];
        let pinString = params[2];
        pollerupdate_1.getBlynkvalue(name, widget, pinString, callback, characteristic, Characteristic, this);
    }
}
module.exports = function (homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform(blynkaccessory_1.pluginName, blynkaccessory_1.platformName, Blynk, true);
};
//# sourceMappingURL=index.js.map