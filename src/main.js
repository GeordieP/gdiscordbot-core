'use strict'

const path = require('path')
const logger = require('./util/logger')
const stringUtil = require('./util/stringutil')
const Client = require('./discord/Client')
const PluginManager = require('./PluginManager')

// configuration
let config = {}
let default_config_path = './config_default.js'
let user_config_path = './config.js'

// bot core
const plugin_manager = new PluginManager(logger)
const client = new Client(logger)

// map command line arguments to functions
const arghandlers = {
    cfg: function(args) {
        user_config_path = args[0]
    }
}

/*
* parse command line args and call appropriate handler function for each
*
* => undefined
*/
const parseArgs = function() {
    let argsobj = {}, lastkey = ''
    let args = process.argv.slice(2)

    if (args.length === 0) {
        return
    }

    args.map(element => {
        if (/^-/.test(element)) {
            // is a key
            lastkey = element.split(/--|-/)[1]
            if (!argsobj.hasOwnProperty(lastkey)) {
                argsobj[lastkey] = new Array()
            }
        } else {
            argsobj[lastkey].push(element)
        }
    })

    // call each argument handler function
    for (let key in argsobj) {
        if (arghandlers.hasOwnProperty(key)) {
            arghandlers[key].call(null, argsobj[key])
        }
    }
}

/*
* sanitize given path and return loaded file contents
* 
* => object
*/
const loadConfig = function(path) {
    // convert relative paths to absolute using pwd as base
    path = stringUtil.relativePathToAbsolute(path, __dirname)

    // load config file
    return require(stringUtil.sanitizePath(path))
}

/*
* load default and user-set config files, merge the two, and store the result
* 
* => undefined
*/
const configSetup = function() {
    let default_config = loadConfig(default_config_path)
    let user_config = loadConfig(user_config_path)

    // combine default config and user config
    // overwrite default values with user provided values on matching keys
    config = Object.assign({}, default_config, user_config)
}

/*
* load plugins and start Discord bot core
* 
* => undefined
*/
const startCore = function() {
    let core_plugins_path = stringUtil.relativePathToAbsolute(config.core_plugins_path, __dirname)
    core_plugins_path = stringUtil.sanitizePath(core_plugins_path)

    let user_plugins_path = stringUtil.relativePathToAbsolute(config.user_plugins_path, __dirname)
    user_plugins_path = stringUtil.sanitizePath(user_plugins_path)

    plugin_manager.setEventListenerCallbacks(client.addEventListener, client.removeEventListener)
        .then(() => plugin_manager.createDiscordEventListeners())
        .then(() => plugin_manager.setClientDisconnectCallback(client.disconnect))
        .then(() => plugin_manager.loadPlugins(core_plugins_path))
        .then(() => plugin_manager.loadPlugins(user_plugins_path))
        .then(() => client.connect())
        .catch(e => {
            logger.error("Error initializing: " + e)
        })
}

// main calls
parseArgs()
configSetup()
startCore()
