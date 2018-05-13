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
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginName = 'homebridge-blynk';
exports.platformName = 'Blynk';
class BlynkService {
    constructor(controlService, characteristics) {
        this.controlService = controlService;
        this.characteristics = characteristics;
    }
}
exports.BlynkService = BlynkService;
class BlynkAccessory {
    constructor(device, services, hapAccessory, hapService, hapCharacteristic, platform) {
        this.name = device.name;
        this.services = services;
        this.accessory = null,
            this.hapAccessory = hapAccessory;
        this.hapService = hapService;
        this.hapCharacteristic = hapCharacteristic;
        this.platform = platform;
    }
    initAccessory() {
        this.accessory.getService(this.hapService.AccessoryInformation)
            .setCharacteristic(this.hapCharacteristic.Manufacturer, "IlCato")
            .setCharacteristic(this.hapCharacteristic.Model, "HomeCenterBridgedAccessory")
            .setCharacteristic(this.hapCharacteristic.SerialNumber, "<unknown>");
    }
    removeNoMoreExistingServices() {
        for (let t = 0; t < this.accessory.services.length; t++) {
            let found = false;
            for (let s = 0; s < this.services.length; s++) {
                // TODO: check why test for undefined
                if (this.accessory.services[t].displayName == undefined || this.services[s].controlService.displayName == this.accessory.services[t].displayName) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.accessory.removeService(this.accessory.services[t]);
            }
        }
    }
    addNewServices(platform) {
        for (let s = 0; s < this.services.length; s++) {
            let service = this.services[s];
            let serviceExists = this.accessory.getService(service.controlService.displayName);
            if (!serviceExists) {
                this.accessory.addService(service.controlService);
                for (let i = 0; i < service.characteristics.length; i++) {
                    let characteristic = service.controlService.getCharacteristic(service.characteristics[i]);
                    characteristic.props.needsBinding = true;
                    if (characteristic.UUID == (new this.hapCharacteristic.CurrentAmbientLightLevel()).UUID) {
                        characteristic.props.maxValue = 10000;
                        characteristic.props.minStep = 1;
                        characteristic.props.minValue = 0;
                    }
                    if (characteristic.UUID == (new this.hapCharacteristic.CurrentTemperature()).UUID) {
                        characteristic.props.minValue = -50;
                    }
                    platform.bindCharacteristicEvents(characteristic, service.controlService);
                }
            }
        }
    }
    registerUpdateAccessory(isNewAccessory, api) {
        if (isNewAccessory)
            api.registerPlatformAccessories(exports.pluginName, exports.platformName, [this.accessory]);
        else
            api.updatePlatformAccessories([this.accessory]);
        this.accessory.reviewed = true; // Mark accessory as reviewed in order to remove the not reviewed ones
    }
    setAccessory(accessory) {
        this.accessory = accessory;
    }
    static createBlynkAccessory(device, hapAccessory, hapService, hapCharacteristic, platform) {
        let controlService, controlCharacteristics;
        switch (device.widget) {
            case "Switch":
                controlService = new hapService.Switch(device.caption);
                controlCharacteristics = [hapCharacteristic.On];
                break;
            case "ContactSensor":
                controlService = new hapService.ContactSensor(device.caption);
                controlCharacteristics = [hapCharacteristic.ContactSensorState];
                break;
            case "TemperatureSensor":
                controlService = new hapService.TemperatureSensor(device.caption);
                controlCharacteristics = [hapCharacteristic.CurrentTemperature];
                break;
            case "HumiditySensor":
                controlService = new hapService.HumiditySensor(device.caption);
                controlCharacteristics = [hapCharacteristic.CurrentRelativeHumidity];
                break;
            case "MotionSensor":
                controlService = new hapService.MotionSensor(device.caption);
                controlCharacteristics = [hapCharacteristic.MotionDetected];
                break;
            case "SmokeSensor":
                controlService = new hapService.SmokeSensor(device.caption);
                controlCharacteristics = [hapCharacteristic.SmokeDetected];
                break;
            case "LightSensor":
                controlService = new hapService.LightSensor(device.caption);
                controlCharacteristics = [hapCharacteristic.CurrentAmbientLightLevel];
                break;
            default:
                return undefined;
        }
        controlService.subtype = device.name + "-" + device.widget + "-" + device.pin;
        if (device.mode != undefined)
            controlService.subtype = controlService.subtype + "-" + device.mode;
        let bs = [new BlynkService(controlService, controlCharacteristics)];
        return new BlynkAccessory(device, bs, hapAccessory, hapService, hapCharacteristic, platform);
    }
}
exports.BlynkAccessory = BlynkAccessory;
//# sourceMappingURL=blynkaccessory.js.map