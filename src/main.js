// This opens up an IRC connection, then starts the plugins

// Globals
global.ERROR = {USAGE: 'UsageException'};

// Requires
var readline = require('readline'); //Make console input usable
var irc = require('irc'); //Still not planning to rewrite it from scratch
var log4js = require('log4js'); // Good 'ol logging
var oop = require('oop-module');
var fs = require('fs');
var loaded = false;

var connectionAttempt = 1;
var options = {};

var log = log4js.getLogger('application');
log4js.configure('config/log4js.json', {});
var pluginManager = oop.class('./pluginMgr.js');


// Adjust loglevel if environment allows for debugging.
if (process.env.DEBUG) {
    log.setLevel("TRACE");
    log.debug("DEBUG LOGGING ENABLED");
}

// Line handling, ignore me
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * DEBUG UTILS, REMOVE IN FUNCTIONAL BUILD.
 * Maybe move to its own class?
 **/
rl.on('line', function (line) {
    var send = /send/;
    log.debug("CLI INPUT: " + line);
    switch (true) {
        case /con/.test(line):
            client.connect(3, null);
            break;
        case /send/.test(line):
            client.say('##Mustek', line.replace('send ', ''));
            break;
        case /dc/.test(line):
            client.disconnect();
            break;
        default:
            break;
    }
});


fs.readFile('config/main.json', function (err, data) {
    if (err && err.code == 'ENOENT') {
        log.error('Could not find main config file at config/main.json');
        process.exit(1);
    } else {
        options = JSON.parse(data);

        start_bot();
    }
});

var start_bot = function () {
    log.info("Connecting to server " + options.network.host + " on port " + options.network.port + "...");

    var client = new irc.Client(
        options.network.host || '127.0.0.1', // Network address
        options.bot.nickName || "BotchedClone", // Nickname
        {
            port: options.network.port || 6665,
            password: options.network.password,
            https: options.network.https,
            autoConnect: true,
            stripColors: true,
            debug: options.debug || false,
            retryCount: options.retryCount || 3
        }
    );

// Catch the connection state and log it
    client.on('connect', function () {
        log.info("Connected!");
        connectionAttempt = 1;
        if (!loaded) pluginManager = new pluginManager(client, log4js);
        loaded = true;
    });

    client.on('QUIT', function () {
        log.info("Disconnected!");
        process.exit(0);
    });

// Network errors get handled here
    client.on('netError', function (err) {

        switch (err.code) {
            case "ETIMEDOUT":
                if (connectionAttempt >= client.opt.retryCount + 1) {
                    log.fatal("Connection timed out. Unable to connect to server. [" + connectionAttempt + "/" + (client.opt.retryCount + 1) + "]");
                    process.exit(-1); // Kill the process. Irc lib doesn't do this for some reason.
                } else {
                    log.warn("Connection timed out. Retrying... [" + connectionAttempt + "/" + (client.opt.retryCount + 1) + "]");
                    connectionAttempt++;
                }
                break;
            default:
                log.warn("Unhandled netError: " + err);
                connectionAttempt++;
        }
    });
};


