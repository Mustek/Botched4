/**
 Plugin class
 Should be inherited by all plugins
 Contains all required functions to operate a plugin
 **/

var pluginManager;
var client;
var logger;

var plugin = null;
var config = null;
var permissions = null;

exports.constructor = function (_pluginManager, callback) {
    pluginManager = _pluginManager;
    callback(true);
};

exports.onCommand = function (command, args, data) {
    // Should be defined in the inheriting class
    // Command = Command name
    // args = Arguments (Excluding @<user>)
    // Data = Channel, nick, person aimed at (@<user>)
    // Callback = Return message or Error
};


/** Getters **/

exports.getPluginManager = function () {
    return pluginManager;
};

exports.getClient = function () {
    return client;
};

exports.getLogger = function () {
    return logger;
};

exports.getConfig = function(){
    return config;
};

exports.getPermission = function(hostname){
    return permissions[hostname];
};

/** Setters **/

exports.setPluginManager = function (_pluginManager) {
    pluginManager = _pluginManager;
};

exports.setClient = function (_client) {
    client = _client;
};

exports.setLogger = function (_logger) {
    logger = _logger;
};

exports.setData = function (_data) {
    plugin = _data;
};

exports.setConfig = function (_config) {
    config = _config;
};

exports.setPermissions = function (_permissions){
    permissions = _permissions;
};
