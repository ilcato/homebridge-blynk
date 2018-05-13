export declare class Poller {
    platform: any;
    pollingUpdateRunning: boolean;
    lastPoll: number;
    pollerPeriod: number;
    hapService: any;
    hapCharacteristic: any;
    constructor(platform: any, pollerPeriod: any, hapService: any, hapCharacteristic: any);
    poll(): void;
    updateAccessory(accessory: any): void;
}
export declare function getBlynkvalue(name: any, widget: any, pinString: any, callback: any, characteristic: any, Characteristic: any, platform: any): void;
