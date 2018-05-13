export declare const pluginName = "homebridge-blynk";
export declare const platformName = "Blynk";
export declare class BlynkService {
    controlService: any;
    characteristics: any[];
    constructor(controlService: any, characteristics: any[]);
}
export declare class BlynkAccessory {
    name: string;
    services: BlynkService[];
    accessory: any;
    hapAccessory: any;
    hapService: any;
    hapCharacteristic: any;
    platform: any;
    constructor(device: any, services: BlynkService[], hapAccessory: any, hapService: any, hapCharacteristic: any, platform: any);
    initAccessory(): void;
    removeNoMoreExistingServices(): void;
    addNewServices(platform: any): void;
    registerUpdateAccessory(isNewAccessory: any, api: any): void;
    setAccessory(accessory: any): void;
    static createBlynkAccessory(device: any, hapAccessory: any, hapService: any, hapCharacteristic: any, platform: any): BlynkAccessory | undefined;
}
