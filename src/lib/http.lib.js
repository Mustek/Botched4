// This fixes the open sockets bug found in Botched3 by forcing a timeout

var defaults = {
    timeout: 5000,  // 15 seconds
    headers: {
        'user-agent': 'Botched v4 // Made by Mustek // Found on Freenode'
    }
};

/**
 * Dont' change anything past this point
 **/

var request = require('request').defaults(defaults);
module.exports = request;