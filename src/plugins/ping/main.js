/***
 EXAMPLE PLUGIN FOR BOTCHEDv4
 FEEL FREE TO COPY AND MODIFY TO CREATE YOUR OWN PLUGIN
 ***/

//var plugin = null; //Data, includes name, version and description.

var oop = require('oop-module'); // OOP module, makes defining classes easier.
var _super = oop.extends('../../plugin.class.js'); // Set parent class
var logger = null;

exports.constructor = function () {
};

exports.onLoad = function (data, callback) {
    logger = _super.getLogger();
    _super.plugin = data;


    callback(data);
};

exports.onCommand = function (command, args, data, callback) {
    var answer = '';
    var type = 'chat';
    switch (command) {
        case 'ping':
            answer = 'Pong!';
            break;
        case 'pong':
            answer = 'Ping?';
            break;
        case 'ding':
            answer = 'Dong!';
            break;
        case 'dong':
            answer = 'Hey! Don\'t touch that!';
            break;
        case 'sing':
            answer = '\u266B\u266ANever gonna give you up!\u266B';
            break;
        case 'song':
            answer = '\u266ANever gonna let you down!\u266A\u266B';
            break;
        case 'bing':
            var lucky_options = ['(‿ˠ‿)', '(ㆆ▃ㆆ)', 'ಠ_ಠ', '( . )( . )', '(づ￣ ³￣)づ', '¯\\_(ツ)_/¯', '(.)', '（・∀・）', '（・⊝・）', '(°<°)', 'くコ:彡'];
            var lucky_winner = lucky_options[Math.floor(Math.random() * lucky_options.length)];

            answer = 'is feeling lucky: ' + lucky_winner;
            type= 'self';
            break;
        case 'bong':
            answer = 'smokes an egg';
            type = 'self';
            break;

        case 'biss':
            var target = data.target;
            if (!data.target || Math.floor(Math.random() * 2)) target = data.sender;
            answer = 'wees on ' + target;
            type = 'self';
            break;
        case 'support':
            answer = 'Network: irc.esper.net, Channel #minecrafthelp - Quick connect: http://webchat.esper.net/?channels=minecrafthelp';
            break;

    }

    callback(data, answer, (type == 'self'));
};