/***
 WIKI PLUGIN FOR BOTCHEDv4
 ***/

/**
 * Permission levels:
 * 0 or none: Can use public commands
 * 1: Can use harmless commands
 * 2: Can kick the bot
 * 3: Full control
 */

var plugin = null; //Data, includes name, version and description.

var oop = require('oop-module'); // OOP module, makes defining classes easier.
var util = require('util');
var _super = oop.extends('../../plugin.class.js'); // Set parent class
var logger = null;

var config;

var valid_channel = /([#][^\x07\x2C\s]{0,200})/;
var valid_nick = /^[a-z][a-z0-9.-]{0,32}$/i;

exports.constructor = function () {
};

exports.onLoad = function (data, callback) {
    logger = _super.getLogger();
    config = _super.getConfig();
    _super.setData(data);

    callback(data);
};

exports.onCommand = function (command, args, data, callback) {

    if (command == 'help') {
        callback(data, util.format('I\'m Botched4 by Mustek. You can find my numbers at %s', config.repo_url));

    } else if (command == 'join' && _super.getPermission(data.host) >= 3) {

        if (valid_channel.test(args[0])) _super.getClient().join(args[0]);
        else callback(data, 'That\'s not a valid channel name.');

    } else if (command == 'part' && _super.getPermission(data.host) >= 2) {
        if (valid_channel.test(data.channel)) _super.getClient().part(data.channel);
        callback(null);

    }else if (command == 'quit' && _super.getPermission(data.host) >= 3){
        logger.warn('Disconnect requested by user ' + data.sender);
        _super.getClient().disconnect('Requested by user');
        process.exit(0);

    } else if (command == 'nick' && _super.getPermission(data.host) >= 3) {
        if (valid_nick.test(args[0])) _super.getClient().send('NICK', args[0]);
        else callback(data, 'That\'s not a valid nickname.');

    } else if ((command == 'say' || command == 'do') && _super.getPermission(data.host) >= 1) {
        if (valid_channel.test(args[0])) {
            if (!_super.getClient().chans.hasOwnProperty(args[0].toLowerCase())) {
                callback(data, 'I\'m not in that channel.');
                return;
            } else {
                data.channel = args[0];
                args.shift();
            }
        }

        callback(data, args.join(' '), (command == 'do'));

    }
};