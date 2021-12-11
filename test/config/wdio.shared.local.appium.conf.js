const { config } = require('./wdio.shared.conf');

//
// ======
// Appium
// ======
//
config.services = (config.services ? config.services : []).concat([
    [
        'appium',
        {
            command : 'appium',
            logPath: './test/appium_info.log',
        }
    ],
    ['selenium-standalone'],
]);

config.port = 4723;
config.path = '/wd/hub';

module.exports = config;