/**
 Plans:

 == Actions
 - Read plugins directory
 - Start plugins on boot
 - Ability to start/reload/stop plugins (Hotplugging)
 - Handle all interactivity bCore <> plugins (Especially chat)
 - Handle bot-admin commands (Plugin mgmt, quit, join/part) - Stuff that directly interfaces with the bot/plugins

 == Variables
 - Plugins {Object} = name:{publicName, ver, shortDescription, HowtoUse}
 - Keywords = {keyword:plugin} - Triggers the plugin

 == Bot 'flowchat'
 * Start own functions
 * Connect to IRC
 ** On connect: Start plugin manager
 ** On error: Try again
 ** On 3rd error: Stop everything, quit
 * MGR: Start plugins
 * Idle until close

 == Plugin 'flowchart'
 * MSG: .test
 * MGR: Search keywords
 * MGR: Hit keyword, alert plugin (Send: channel, nick, cmd, arguments, raw, CALLBACK)
 * PLG: Do stuff, return callback:
 ** Example chat message: (Error: <null>, Type: message, Rcpt: <chan/usr>, Message: <msg>) - Spit out in chat
 ** Example Do message: (Error: <null>, Type: do, Rcpt: <chan/user>, Message: <msg>) - Spit an action in chat
 ** Example null message: (null) - Do absolutely nothing
 ** Example error: (Error: <!null>, Err: <Errmsg>) - Error happened, let user know
 * MGR: Do action based on about callback objects
 * - Begin again -
 **/

var oop = require('oop-module');
var fs = require('fs');
var format = require('util').format;
var log4js = null;
var log = null;
var logchat = null;
var logplugin = null;
var bot = null;

var plugins = {};   // Plugins. Format: name: {publicName, version, shortDescription}
var commands = {}; // Commands. Format: command:plugin

exports.constructor = function (client, _log4js) {
    log4js = _log4js;
    log = _log4js.getLogger('application');
    logchat = _log4js.getLogger('chat');
    bot = client;

    log.info('PluginManager loaded!');
    onLoad();
};

// Called once at boot. Goes through the plugin folder and loads all plugins one by one.
function onLoad() {
    startListeners();
    loadAllPlugins()
}

function loadAllPlugins() {
    var checkDir = function (err, files) {
        if (!err) {
            for (var i = 0; i < files.length; i++) {
                if (fs.statSync("./plugins/" + files[i]).isDirectory()) {
                    loadPlugin(files[i]);
                }
            }
        } else {
            log.error(err);
        }

    };

    fs.readdir('./plugins', checkDir);

}

// Called every time a plugin loads.
function loadPlugin(plugin) {
    var location = './plugins/' + plugin;
    var manifest;

    // VERIFY IF MAIN.js EXISTS
    if (!fs.existsSync(location + '/main.js') && !fs.statSync(location + '/main.js').isFile()) {
        log.error(format('Plugin %s does not contain main.js file. Plugin not loaded.', plugin));
        return;
    }

    // VERIFY IF MANIFEST.JSON EXISTS AND IS VALID
    if (!fs.existsSync(location + '/manifest.json')) {
        log.error(format('Plugin %s: Missing manifest.json file. Plugin not loaded.', plugin));
        return;
    } else {
        manifest = JSON.parse(fs.readFileSync(location + '/manifest.json', 'utf8'));
    }

    // VERIFY NAME
    if (plugins.hasOwnProperty(manifest.name.toLowerCase())) {
        log.error(format('Plugin %s: Plugin with same name found. Plugin not loaded', plugin));
        return;
    }

    // VERIFY MANIFEST VERSION
    if (!manifest.hasOwnProperty("version")) {
        log.error(format('Plugin %s: No version key found. Plugin not loaded', plugin));
        return;
    }

    // VERIFY MANIFEST DESCRIPTION
    if (!manifest.hasOwnProperty("description")) {
        log.error(format('Plugin %s: No description key found. Plugin not loaded', plugin));
        return;
    }

    // VERIFY MANIFEST USAGE INSTRUCTIONS
    if (!manifest.hasOwnProperty("usage")) {
        log.error(format('Plugin %s: No usage key found. Plugin not loaded', plugin));
        return;
    }

    // VERIFY COMMANDS
    if (manifest.hasOwnProperty("commands") && typeof manifest.commands === "object") {
        var error = false;

        for (var i = 0; i < manifest.commands.length; i++) {
            if (!commands.hasOwnProperty(manifest.commands[i])) {

            } else {
                error = manifest.commands[i];
                break;
            }
        }

        if (error) {
            log.error(format('Plugin %s: Command already exists:', plugin, error));
            return;
        }
    }

    // START LOAD
    //- Plugins {Object} = name:{publicName, ver, shortDescription}
    //- Keywords = {keyword:plugin} - Triggers the plugin

    plugins[plugin.toLowerCase()] = {};


    for (var j = 0; j < manifest.commands.length; j++) {
        commands[(manifest.commands[j])] = plugin;
    }

    var pconstr = oop.class(location + '/main.js');
    plugins[plugin.toLowerCase()] = new pconstr("1");

    // LOAD COMPLETE (Expect callback), This is where we insert the variables.
    logplugin = log4js.getLogger('plugin');

    plugins[plugin.toLowerCase()].setClient(bot);
    plugins[plugin.toLowerCase()].setLogger(logplugin);
    plugins[plugin.toLowerCase()]["info"] = {
        publicName: manifest.name,
        version: manifest.version,
        description: manifest.description,
        location: location,
        usage: manifest.usage
    };

    plugins[plugin.toLowerCase()].setConfig(manifest.config);
    plugins[plugin.toLowerCase()].setPermissions(manifest.permissions);

    plugins[plugin.toLowerCase()].onLoad(plugins[plugin.toLowerCase()], function (data, error) {
        if (!error) {
            log.info("Plugin |" + data.info.publicName + " v" + data.info.version + "| loaded successfully!");
        } else {
            log.error("Plugin |" + data.info.publicName + " v" + data.info.version + "| could not load. Reason: " + error);
        }

    });

}

/**
 BOT EXECUTORS
 Basically hot commands for the irc library
 **/

/**
 BOT LISTENERS
 Check the incoming stream for events
 **/

function startListeners() {
    // Incoming chat:
    bot.on('message', function (sender, channel, message, raw) {
        var identifier = new RegExp("^" + bot.nick + "[:,]", 'i'); //Bot regex
        logchat.trace(format("[%s] %s: %s", channel, sender, message));


        if (message[0] == ',') { //Todo: Pull from config file
            message = message.replace(",", "").trim();
            // continue
        } else if (message.split(" ")[0].toLowerCase().match(identifier) != null) {
            message = message.replace(identifier, "").trim();
            // continue
        } else {
            return; //We're not needed, jump out!
        }

        var cmd = message.split(' ')[0].toLowerCase(); //Command, shared for multi-command plugins
        var end = (message.indexOf('@') >= 0) ? message.indexOf('@') : message.length;
        var args = message.trim().substr(0, end).split(' '); // Arguments
        args.splice(0, 1);

        var data = {'sender': sender, 'host': raw.host, 'channel': channel, 'command': cmd, 'fullMessage': message}; // Meta data

        if (commands[cmd] !== undefined) {

            // This grabs the characters after the @
            data['target'] = (message.lastIndexOf('@') >= 0 ) ? message.substr(message.indexOf('@') + 1) : null;
            plugins[commands[cmd]].onCommand(cmd, args, data, send_chat);
        }
    });

    // Incoming CTCP
    bot.on('ctcp', function (sender, channel, message) {
        logchat.trace(format("[%s] %s: %s", channel, sender, message));
    });


    /**
     * Send a chat message to the channel
     * @param {Object} data - Return the message data
     * @param {String} msg - Message to send to the channel
     * @param {boolean} is_self - false = chat, true: self
     */
    var send_chat = function (data, msg, is_self) {

        if (msg == global.ERROR.USAGE) {
            bot.say(data.channel, 'Invalid command. Usage: ' + plugins[commands[data.command]].info.usage);

        } else if (msg) {
            var message = "";


            if (data.target !== null) {
                message += data.target + ": ";
            }

            message += msg;

            if (is_self) {
                bot.action(data.channel, message);
            } else {
                bot.say(data.channel, message);
            }
        }

    }
}
