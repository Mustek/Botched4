/***
 MINECRAFT STATUS PLUGIN FOR BOTCHEDv4
 ***/

var plugin = null; //Data, includes name, version and description.

var oop = require('oop-module'); // OOP module, makes defining classes easier.
var util = require('util');
var _super = oop.extends('../../plugin.class.js'); // Set parent class
var request = require('../../lib/http.lib.js');
var logger = null;

var config;
var statusText = {
    'down': '\u0002\u000305\u2718\u000f',
    'up': '\u000303\u2714\u000f',
    'problem': '\u0002\u000307\uFFFD\u000f'
};

exports.constructor = function () {
};

exports.onLoad = function (data, callback) {
    logger = _super.getLogger();
    config = _super.getConfig();
    _super.setData(data);

    callback(data);
};

exports.onCommand = function (command, args, data, callback) {

    lookup_status(function (error, response) {
        if (error) {
            callback(data, "Unable to complete your request. Error: " + error.code);

        } else {
            var status = '';
            var keys = getSortKey(response.report);

            for (var i = 0; i < keys.length; i++) {
                status += util.format('[%s: %s] ', initcaps(keys[i]), response.report[keys[i]].status);
            }

            status += 'www.goo.gl/q73C4';
            callback(data, status.replace(/up/g, statusText.up).replace(/down/g, statusText.down).replace(/problem/g, statusText.problem));
        }
    });
};

var lookup_status = function (callback) {

    request(config['status_url'], function (error, response, body) {
        if (error || response.statusCode != 200) {
            callback(error, null);
        } else if (!JSON.parse(body)) {
            callback("No query entered", null);
        } else {
            callback(null, JSON.parse(body));
        }
    });
};

var initcaps = function (s) {
    s = s.replace(/(\b\w)([a-zA-Z0-9]+)/gi, function (t, a, b) {
        return a.toUpperCase() + b.toLowerCase();
    });
    return s;
};

var getSortKey = function (object) {
    var keys = [];

    for (var k in object) {
        if (object.hasOwnProperty(k)) keys.push(k);
    }

    return keys.sort();
};