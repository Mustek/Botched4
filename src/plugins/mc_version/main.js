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

var releases = {
    release: 'Loading',
    snapshot: 'Loading'
};
var etag = '';

exports.constructor = function () {
};

exports.onLoad = function (data, callback) {
    logger = _super.getLogger();
    config = _super.getConfig();
    _super.setData(data);

    setInterval(updateVersion, 15 * 1000);
    updateVersion();

    callback(data);
};

exports.onCommand = function (command, args, data, callback) {
    var snapshot = (releases.snapshot == releases.release) ? '' : util.format('[Snapshot: %s]', releases.snapshot);

    callback(data, util.format("Versions: [Stable: %s] %s", releases.release, snapshot));
};

var updateVersion = function () {

    var check_etag = function () {
        lookup_etag(function (error, response) {
            if (error) {
                logger.warn("[MC_Version] Error in etag lookup: " + error.code);
            } else {
                if (response.etag != etag) {
                    logger.debug('Updated etag detected.');
                    get_versions();
                    etag = response.etag;
                }
            }
        })
    };

    var get_versions = function () {
        lookup_version(function (error, response) {
            if (error) {
                logger.warn("[MC_Version] Error in version lookup: " + error.code);
            } else if (response !== undefined && response.latest !== undefined) {
                if(response.latest.snapshot != releases.snapshot){
                    update_channels(response.latest.snapshot, 'Snapshot');
                    releases.snapshot = response.latest.snapshot
                }

                if(response.latest.release != releases.release){
                    update_channels(response.latest.release, 'Release');
                    releases.release = response.latest.release
                }
            }
        });
    };

    var update_channels = function (version, type) {
        var alert_format = global.COLOR.BOLD + global.COLOR.RED + '[VERSION] Minecraft %s %s has been released!' + global.COLOR.RESET;

        for (var i = 0; i < config.subscribers.length; i++) {
            _super.getClient().say(config.subscribers[i], util.format(alert_format, type,version));

        }
    };

    check_etag();


};


var lookup_version = function (callback) {

    request(config['version_url'], function (error, response, body) {
        if (error || response.statusCode != 200) {
            callback(error, null, query);
        } else if (!JSON.parse(body)) {
            callback("Something went wrong whilst obtaining versions", null);
        } else {
            callback(null, JSON.parse(body));
        }
    });
};

var lookup_etag = function (callback) {
    request.head(config['version_url'], function (error, response) {
        if (error || response.statusCode != 200) {
            callback(error, null);
        } else {
            callback(null, response.headers);
        }
    });
};