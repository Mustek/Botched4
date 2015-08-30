/***
 JIRA PLUGIN FOR BOTCHEDv4
 ***/

var plugin = null; //Data, includes name, version and description.

var oop = require('oop-module'); // OOP module, makes defining classes easier.
var util = require('util');
var _super = oop.extends('../../plugin.class.js'); // Set parent class
var request = require('../../lib/http.lib.js');
var logger = null;

var config;

var issue_regex = /^([A-Z]{1,5}\-[0-9]{1,7})$/i;

exports.constructor = function () {
};

exports.onLoad = function (data, callback) {
    logger = _super.getLogger();
    config = _super.getConfig();
    _super.setData(data);

    callback(data);
};

exports.onCommand = function (command, args, data, callback) {


    if(args[0] == null || args[0].trim() == ""){
        callback(data, global.ERROR.USAGE);
        return;
    }else if (!issue_regex.test(args[0])){
        callback(data, "Invalid issue type. Example: MC-49");
        return;
    }

    lookup(args[0], function (error, searchdata) {
        if (error) {
            _super.getClient().say(data.channel, util.format("Unable to complete %s lookup. Reason: %s", command, error.code));
        }else if(searchdata.errorMessages !== undefined){
            callback(data, util.format("%s[%s]%s %s", global.COLOR.BOLD, args[0].toUpperCase(), global.COLOR.RESET, searchdata.errorMessages[0]));


        } else {
            var fields = searchdata.fields;
            var summary = util.format("%s%s", fields.summary.substr(0,50), (fields.summary.length > 50)? '…' : '');
            var resolution = '';

            if(fields.resolution == null) resolution = 'Open';
            else if(fields.resolution.name == 'Fixed') resolution = 'Fixed in ' + fields.fixVersions[0].name;
            else if(fields.resolution.name == 'Duplicate') resolution = 'Duplicates ' + fields.issuelinks[0].outwardIssue.key;
            else resolution = fields.resolution.name;



            callback(data, util.format('%s[%s]%s %s | %s | %s', global.COLOR.BOLD, args[0].toUpperCase(), global.COLOR.RESET, summary, resolution, config['jira_url_slug'] + args[0].toUpperCase()));


        }
    });

};

var lookup = function (query, callback) {
    var url = config['jira_url_api'].replace('{query}', query);

    request(url, function (error, response, body) {
        if (error || (response.statusCode != 200 && response.statusCode !== 404 && response.statusCode !== 401)) {
            callback(error, null);
        }else if(!JSON.parse(body)){
            callback("No query entered", null);
        } else {
            callback(null, JSON.parse(body));
        }
    });
};