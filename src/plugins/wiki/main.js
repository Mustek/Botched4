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
    var query = encodeURI(args.join(' '));

    if(query == null || query.trim() == ""){
        callback(data, global.ERROR.USAGE);
        return;
    }

    lookup(command, query, function (error, searchdata) {
        if (error) {
            _super.getClient().say(data.channel, util.format("Unable to complete %s lookup. Reason: %s", command, error.code));
        } else {

            var search_info = searchdata.query.searchinfo;
            var search_data = searchdata.query.search[0];

            if (search_info.totalhits == 0 && search_info.suggestion == undefined) {
                // No results found, so let the user know

                callback(data, util.format("No results found."));

            } else if (search_info.totalhits == 0 && search_info.suggestion !== undefined) {
                // No results, but has a suggestion.

                callback(data, util.format("Suggested: %s - %s%s", search_info.suggestion, config[command + '_url_slug'], encodeURI(search_info.suggestion)));

            } else {
                // Results found, parse into something readable.

                var snippet = search_data.snippet.replace(/<(?:.|\n)*?>/gm, '');
                snippet = (snippet.length <= 40) ? snippet : snippet.substring(0, 40) + "\u2026";

                callback(data, util.format("%s - “%s” - %s%s", search_data.title, snippet.replace(/\s\s+/g, ' '), config[command + '_url_slug'], encodeURI(search_data.title)));
            }


        }
    });

};

var lookup = function (type, query, callback) {
    var url = config[type + '_url_api'].replace('{query}', query);

    request(url, function (error, response, body) {
        if (error || response.statusCode != 200) {
            callback(error, null);
        }else if(!JSON.parse(body).query){
            callback("No query entered", null);
        } else {
            callback(null, JSON.parse(body));
        }
    });
};