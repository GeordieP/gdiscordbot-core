'use strict'

const path = require('path')
const logger = require('./util/logger')
const Client = require('./discord/Client')
const PluginManager = require('./PluginManager')

const plugin_manager = new PluginManager(logger)
const client = new Client(logger)

plugin_manager.setEventListenerCallbacks(client.addEventListener, client.removeEventListener)
    .then(() => plugin_manager.createDiscordEventListeners())
    .then(() => plugin_manager.setClientDisconnectCallback(client.disconnect))
    .then(() => plugin_manager.loadPlugins(path.join(__dirname, './core_plugins/')))
    .then(() => plugin_manager.loadPlugins(path.join(__dirname, './plugins/')))
    .then(() => client.connect())
    .catch(e => {
        logger.error("Error initializing: " + e)
    })
