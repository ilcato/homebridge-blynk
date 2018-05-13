# homebridge-blynk

Homebridge plugin for the Blynk platform

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-blynk) and should be installed "globally" by typing:

    npm install -g homebridge-blynk
    
# Release notes
Version 0.9.0
+ Complete rewriting in typescrypt and homebridge plugin 2.0 API
+ Based on Blynk REST API
+ Works on both cloud server and local server: for cloud server the Blynk App must be running in order to receive automatic update of the pin values (setting pins works also without the app runing); for local server put "allow.reading.widget.without.active.app=true" in server.properties in order to be able to receive automatic update of the pin values.
+ Addedd "MotionSensor", "SmokeSensor", "LightSensor" widget types
+ new config.json format

Version 0.3.0
+ Cleanup and fixes

Version 0.2.0
+ Use of standard Blynk Rest API

Version 0.1.0
+ Fixed dependencies

Version 0.1.0
+ First usable version of the plugin
+ HomeKit accessories supported:
	+ Switch
	+ Temperature Sensor
	+ Contact Sensor
	
# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:
+ "serverurl": "PUT THE URL OF THE BLYNK SERVER HERE, e.g.: http://10.0.0.102:8080"
+ "token": "PUT YOUR PROJECT AUTHORIZATION TOKEN HERE"
+ "pollerperiod" : "PUT 0 FOR DISABLING POLLING, 1 - 100 INTERVAL IN SECONDS. 1 SECONDS IS THE DEFAULT"
+ "dashboardName": "PUT THE DASHBOARD NAME HERE",
+ "accessories": "PUT THE LIST OF ACCESSORIES THAT YOU WANT TO MAP TO HOMEKIT, SEE EXAMPLE"

Look for a sample config in [config.json example](https://github.com/ilcato/homebridge-blynk/blob/master/config.json)

# Usage notes
+ The plugin currently works only on a local Blynk server and not with the cloud one made available by Blynk
+ You must create a Project within the Blynk app that will define the mapping between your hardware device, the server and the Blynk Widget

# Getting Started
+ Select a platform on which to install the plugin (any platform that support node.js should work)
+ install homebridge (follow instruction) on https://www.npmjs.com/package/homebridge
+ install the blynk homebridge plugin: 
```sudo npm install -g homebridge-blynk```
+ create a config.json file in the .homebridge directory of the user that run homebridge (see example in https://github.com/ilcato/homebridge-blynk/blob/master/config.json)
+ start homebridge (and create an autostart file on the hosted platform)
+ For the config file:
specify authorization token of an existing Blynk project on the referred Blynk server, for example:
assuming a switch within the Blynk project specify in the accessories parameter of the config.json file:
{ "name": "Switch1", "widget": "Switch", "mode": "SWITCH", "caption": "Lamp 1", "pin": "D5" }

where:

`name` will be a unique identifier of the the accessory
`widget` must be one "Switch" (other supported accessory types are: "TemperatureSensor", "HumiditySensor", "MotionSensor", "SmokeSensor", "LightSensor"
`mode` can be "SWITCH" or "PUSH" (only used for Switch widget)
`caption` will be the name you should refer to from Siri
`pin` is the pin to actuate
+ Use the Home app to add the accessory to the iPhone/iPad

After that you can say to Siri:

"turn on lamp 1" and you are all set.

