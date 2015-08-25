/***
 WIKI PLUGIN FOR BOTCHEDv4
 ***/

var plugin = null; //Data, includes name, version and description.

var oop = require('oop-module'); // OOP module, makes defining classes easier.
var util = require('util');
var _super = oop.extends('../../plugin.class.js'); // Set parent class
var request = require('../../lib/http.lib.js');
var logger = null;

var config;

exports.constructor = function () {
};

exports.onLoad = function (data, callback) {
    logger = _super.getLogger();
    config = _super.getConfig();
    _super.setData(data);

    callback(data);
};

exports.onCommand = function (command, args, data, callback) {
    var valid_chars = /[A-Za-z0-9_]+$/;
    var argument = args[0];

    if (command == 'paid') {
        if (argument === undefined || argument.trim() == '' || !valid_chars.test(argument)) {
            callback(data, global.ERROR.USAGE);

        } else {
            lookup_paid(argument.trim(), function (error, response, account) {
                if (error) {
                    callback(data, "Unable to complete your request. Error: " + error.code);

                } else {
                    if (response === null) {
                        callback(data, util.format("\u000304\u2718\u000f The account %s is not premium.", account));

                    } else {
                        callback(data, util.format("\u000309\u2713\u000f %s | UUID: %s %s", response.name, format_uuid(response.id), (response.legacy === undefined) ? "" : "| Not migrated"));

                    }
                }

            });
        }


    } else if (command == 'names') {
        if (argument === undefined || argument.trim() == '' || !valid_chars.test(argument)) {
            callback(data, "Please enter a valid username.");
        } else {
            lookup_paid(argument.trim(), function (error, response, account) {
                if (error) {
                    callback(data, "Unable to complete your request. Error: " + error.code);

                } else {
                    if (response === null) {
                        callback(data, util.format("The account %s is not in use.", account));

                    } else {
                        lookup_names(response.id, function (error, response) {
                            if (error) {
                                callback(data, "Unable to complete your request. Error: " + error.code);

                            } else {
                                var current = "";
                                var old = [];

                                for (var i = response.length - 1; i >= 0; i--) {
                                    if (i == response.length - 1) current = response[i].name;
                                    else old.push(response[i].name);
                                }
                                callback(data, util.format("Current: %s | %s", current, (old.length > 0)? "Known as: " + old.toString().replace(/,/g, ", ") : "No other names"));
                            }
                        });
                    }
                }

            });
        }
    }

};

var lookup_paid = function (query, callback) {
    var url = config['paid_url'].replace('{query}', query);

    request(url, function (error, response, body) {
        if (error || response.statusCode != 200) {
            callback(error, null, query);
        } else if (!JSON.parse(body)) {
            callback("No query entered", null);
        } else {
            callback(null, JSON.parse(body), query);
        }
    });
};

var lookup_names = function (query, callback) {
    var url = config['names_url'].replace('{query}', query);
    console.log(url);

    request(url, function (error, response, body) {
        if (error || response.statusCode != 200) {
            callback(error, null);
        } else if (!JSON.parse(body)) {
            callback("No query entered", null);
        } else {
            callback(null, JSON.parse(body), query);
        }
    });
};


var format_uuid = function (uuid) {
    return util.format("%s-%s-%s-%s-%s", uuid.substr(0, 8), uuid.substr(8, 4), uuid.substr(12, 4), uuid.substr(16, 4), uuid.substr(20))
};