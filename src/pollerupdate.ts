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

'use strict'

import request = require("request");

export class Poller {

	platform: any;
	pollingUpdateRunning: boolean;
	lastPoll: number;
	pollerPeriod: number;
	hapService: any;
	hapCharacteristic: any;

	constructor(platform, pollerPeriod, hapService, hapCharacteristic) {
		this.platform = platform;
		this.pollingUpdateRunning = false;
		this.lastPoll = 0;
		this.pollerPeriod = pollerPeriod;
		this.hapService = hapService;
		this.hapCharacteristic = hapCharacteristic;
	}
	
	poll() {
		if(this.pollingUpdateRunning ) {
			return;
		}
		this.pollingUpdateRunning = true;
    
        this.platform.config.accessories.map((s, i, a) => {
			this.updateAccessory(s);
		});

        this.pollingUpdateRunning = false;
		setTimeout( () => { this.poll()}, this.pollerPeriod * 1000);
	}
	
	updateAccessory(accessory) {
		for (let i = 0; i < this.platform.updateSubscriptions.length; i++) {
            let subscription = this.platform.updateSubscriptions[i];
            let service = subscription.service;
            let params = service.subtype.split("-"); // params[0]: name, params[1]: widget, params[2]: pin, params[3]: mode
            let name = params[0];
            let widget = params[1];        
            let pinString = params[2];
			if (name == accessory.name) {
                getBlynkvalue(name, widget, pinString, null, subscription.characteristic, this.hapCharacteristic, this.platform);
			}
		}
    }

}

export function getBlynkvalue(name, widget, pinString, callback, characteristic, Characteristic, platform) {
    request(platform.config.serverurl + '/' + platform.config.token + '/get/' + pinString, function (error, response, body) {
        // console.log('Status:', response.statusCode);
        // console.log('Headers:', JSON.stringify(response.headers));
        // console.log('Response:', body);
        function returnValue(r, callback, characteristic) {
            if (callback) {
				platform.log("Getting value for device: ", `${name}  parameter: ${characteristic.displayName}, value: ${r}`);
                callback(undefined, r);
            } else {
				platform.log("Updating value for device: ", `${name}  parameter: ${characteristic.displayName}, value: ${r}`);
                characteristic.updateValue(r);
            }
        }
        switch (widget) {
            case "Switch":
                returnValue((body == "[\"1\"]"), callback, characteristic);
                break;
            case "ContactSensor":
                returnValue((body == "[\"1\"]") ? Characteristic.ContactSensorState.CONTACT_DETECTED : Characteristic.ContactSensorState.CONTACT_NOT_DETECTED, callback, characteristic);
                break;
            case "TemperatureSensor":
                returnValue(parseFloat(JSON.parse(body)), callback, characteristic);
                break;
            case "HumiditySensor":
                returnValue(parseFloat(JSON.parse(body)), callback, characteristic);
                break;
            case "MotionSensor":
                returnValue((body == "[\"1\"]"), callback, characteristic);
                break;
            case "SmokeSensor":
                returnValue((body == "[\"1\"]") ? Characteristic.SmokeDetected.SMOKE_DETECTED : Characteristic.SmokeDetected.SMOKE_NOT_DETECTED, callback, characteristic);
                break;
            case "LightSensor":
                returnValue(parseFloat(JSON.parse(body)), callback, characteristic);
                break;
            default:
                break;
        }
    })
}
