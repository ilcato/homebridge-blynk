# homebridge-blynk

Homebridge plugin for the Blynk platform

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-blynk) and should be installed "globally" by typing:

    npm install -g homebridge-blynk
    
# Release notes
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
+ "server": "PUT THE ADDRESS OF THE LOCAL BLYNK SERVER HERE",
+ "appPort": "PUT THE PORT OF THE LOCAL BLYNK SERVER HERE, TIPICALLY 8443",
+ "username": "PUT THE VALUE OF THE USERNAME HERE",
+ "password": "PUT THE VALUE OF THE PASSWORD HERE",
+ "dashboardName": "PUT THE DASHBOARD NAME HERE",
+ "accessories": "PUT THE LIST OF ACCESSORIES THAT YOU WANT TO MAP TO HOMEKIT"

Look for a sample config in [config.json example](https://github.com/ilcato/homebridge-blynk/blob/master/config.json)

# Usage notes
+ The plugin currently works only on a local Blynk server and not with the cloud one made available by Blynk
+ You must create a Dashboard with the Blynk app that define the mapping between your hardware device, the server and the Blynk Widget

