'use strict'

const ADMIN_USER_ID = require('./data/user_details.js').ADMIN_USER_ID

module.exports = function(client) {
    client.registerCommand('kill', function(cmd_msg, args) {
        if (cmd_msg.author.id === ADMIN_USER_ID) {
            cmd_msg.channel.sendMessage("Disconnecting")
            client.disconnect()
        }
    })
}
