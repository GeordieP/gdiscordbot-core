'use strict'

const fs = require('fs')
const default_logger = require('./util/logger')

// keep track of plugins and commands that have been registered
let ACTIVE_PLUGINS = {}
let ACTIVE_CMDS = {}

// plugin registration regex
const REGEX_DISABLED_PLUGIN = /disabled/
const REGEX_CHARACTERS_REPLACE_WITH_UNDERSCORE = /\s/
const REGEX_IS_JS_FILE = /\.js/

// command match regex
// a match means the string being compared is a command
const REGEX_COMMAND = /^[!\.]/      

/*---
* PluginManager
---*/

/*
* PluginManager
*
* log - logger object
* => undefined
*/
module.exports = function(logger = default_logger) {
    // public
    let pub = {}
    let plugin_api = new PluginAPI(this)

    /*---
    * private functions
    ---*/

    // callback functions used with discord client - set by main
    this.clientDisconnectCallback = null
    this.addDiscordEventListener = null
    this.removeDiscordEventListener = null

    /*
    * call disconnect on discord client
    *
    * => Promise
    */
    this.clientDisconnect = (client_callback) => {
        return client_callback()
    }

    /*
    * take a Discordie ITextMessage object and attempt to parse a command from it
    *
    * e - ITextMessage object, passed from Discordie MESSAGE_CREATE event
    * => undefined
    */
    this.parseCommand = (e) => {
        if (REGEX_COMMAND.test(e.message.content)) {
            let msg_split = e.message.content.split(" ")

            // take the first index of the split, and strip out
            // the command prefix characters
            let cmd_name = msg_split[0].replace(REGEX_COMMAND, "")

            // args are the rest of the split, minus the first index
            let args = msg_split.slice()
            args.shift()

            // check for command matching incoming message 
            if (!ACTIVE_CMDS.hasOwnProperty(cmd_name)) {
                return
            }

            // call command with args
            ACTIVE_CMDS[cmd_name].call(null, e.message, args)
        }
    }

    /*---
    * public functions
    ---*/

    // expose event management functions
    pub.addDiscordEventListener = this.addDiscordEventListener
    pub.removeDiscordEventListener = this.removeDiscordEventListener

    /*
    * set local reference to client disconnect callback
    *
    * => Promise
    */
    pub.setClientDisconnectCallback = (disconnectFunc) => {
        try {
            this.clientDisconnectCallback = disconnectFunc
        } catch (e) {
            return Promise.reject(e)
        }
        return Promise.resolve()
    }

    /*
    * set both the add and remove local event listener callback functions
    *
    * addEventListenerFunc - discord client add listener function
    * removeEventListenerFunc - discord client remove listener function
    * => Promise
    */
    pub.setEventListenerCallbacks = (addEventListenerFunc, removeEventListenerFunc) => {
        try { 
            this.addDiscordEventListener = addEventListenerFunc
            this.removeDiscordEventListener = removeEventListenerFunc
            pub.addDiscordEventListener = this.addDiscordEventListener
            pub.removeDiscordEventListener = this.removeDiscordEventListener
        } catch (e) {
            return Promise.reject(e)
        }
        return Promise.resolve()
    }

    /*
    * set up local event listeners
    *
    * => Promise
    */
    pub.createDiscordEventListeners = () => {
        // for now, only have one
        // on message, attempt to parse a command
        return pub.addDiscordEventListener("MESSAGE_CREATE", this.parseCommand)
    }

    /*
    * load plugins from a directory and append the resulting objects (or lack of) to our plugins storage object,
    * * keyed on the name of the plugin
    *
    * plugins_dir - directory to search through
    * => undefined
    */
    pub.loadPlugins = (plugins_dir) => new Promise((resolve, reject) => {
        return loadPluginsFromPath(plugins_dir, plugin_api, logger)
            .then(new_plugins => {
                if (Object.keys(new_plugins).length === 0) {
                    logger.info("Registered no plugins from directory " + plugins_dir)
                    resolve()
                }

                ACTIVE_PLUGINS = Object.assign({}, new_plugins)

                logger.info(Object.keys(new_plugins).length + " plugins registered from " + plugins_dir)
                
                resolve()
            })
            .catch(e => {
                reject(e)
            })
    })

    /*
    * return active plugins object
    * => object
    */
    pub.getActivePlugins = () => {
        return Object.assign({}, ACTIVE_PLUGINS)
    }

    /*
    * return active commands object
    * => object
    */
    pub.getActiveCommands = () => {
        return Object.assign({}, ACTIVE_COMMANDS)
    }

    return pub
}

/*
* functions to be exposed to plugins. Acts as a proxy
* between plugins and the bot core, as well as provides
* helper functions for ease of use by plugins
*
* pluginManager - instance of pluginManager, used to bind calls to client
* => object
*/
const PluginAPI = function(pluginManager) {
    // public
    let pub = {}

    /*
    * register a command function to be called when a matching command message is recieved.
    * if a string is passed in as 'names', we assume the plugin only wants to register a single name.
    * if an array<string> is given, we assume the plugin wants to register the callback function
    * under each name in the array.
    * 
    * names - string (single name) or array<string> (multiple names) of commands
    * func - callback function - to be called whenever a message arrives that matches a given command name
    *      - func accepts args 'message' (discord ITextMessage object that matched command name),
    *      - and 'args' - array of given command arguments
    * => undefined
    */
    pub.registerCommand = (names, func) => {
        // convert a single string argument to an array of length 1
        // so it is compatible with the iteration below
        if (typeof(names) === "string") {
            names = new Array(names)
        }

        for (let key in names) {
            if (ACTIVE_CMDS.hasOwnProperty(names[key])) {
                logger.error("Error registering message listener " + names[key] + " :: Listener already exists")
            } else {
                ACTIVE_CMDS[names[key]] = func
            }
        }
    }
    
    /*---
    * proxy functions
    * pass through to pluginManager, but catch errors here
    * so plugins don't have to
    ---*/
    
    pub.addDiscordEventListener = (event_type, func) => {
        pluginManager.addDiscordEventListener(event_type, func)
            .catch(e => logger.error("Error adding listener: " + e))
    }

    pub.removeDiscordEventListener = (event_type, func) => {
        pluginManager.removeDiscordEventListener(event_type, func)
            .catch(e => logger.error("Error removing listener: " + e))
    }

    pub.disconnect = (event_type, func) => {
        pluginManager.clientDisconnect(event_type, func)
            .catch(e => logger.error("Error disconnecting: " + e))
    }
    
    /*---
    * HELPER FUNCTIONS
    * optional use plugin api functions for adding and removing different types of listeners
    * without having to know inside the plugin what the appropriate event type is;
    * just pass a function that takes an event object argument
    ---*/

    /* messages */
    pub.registerMessageCreateListener = func => pub.addDiscordEventListener("MESSAGE_CREATE", func)
    pub.unregisterMessageCreateListener = func => pub.removeDiscordEventListener("MESSAGE_CREATE", func)

    pub.registerMessageEditListener = func => pub.addDiscordEventListener("MESSAGE_UPDATE", func)
    pub.unregisterMessageEditListener = func => pub.removeDiscordEventListener("MESSAGE_UPDATE", func)

    pub.registerMessageDeleteListener = func => pub.addDiscordEventListener("MESSAGE_DELETE", func)
    pub.unregisterMessageDeleteListener = func => pub.removeDiscordEventListener("MESSAGE_DELETE", func)

    /* reactions */
    pub.registerReactionAddListener = func => pub.addDiscordEventListener("MESSAGE_REACTION_ADD", func)
    pub.unregisterReactionAddListener = func => pub.addDiscordEventListener("MESSAGE_REACTION_ADD", func)

    pub.registerReactionRemoveListener = func => pub.addDiscordEventListener("MESSAGE_REACTION_REMOVE", func)
    pub.unregisterReactionRemoveListener = func => pub.addDiscordEventListener("MESSAGE_REACTION_REMOVE", func)

    return pub
}

/*
* find valid plugins (files or directories) in given path, load them (require()), call their
* register function, and store the resulting object (or lack of) by plugin name 
* 
* plugins_dir - directory to scan for plugins
* plugin_api - reference to PluginAPI object, to be passed to each plugin register function
* => object containing plugin register results, keyed on plugin name
*/
const loadPluginsFromPath = (plugins_dir, plugin_api, logger = default_logger) => new Promise((resolve, reject) => {
    let new_plugins = {}
    // scan through the given directory
    fs.readdir(plugins_dir, (err, files) => {
        if (!files) {
            reject("Error loading plugins: No files or directories found")
            return
        }

        files.map(file_name => {
            // keep track of stats for later use
            let stats
            try {
                // append a path separator to the end of the path if it doesn't already have one
                let path = (/[\/\\]$/.test(plugins_dir)) ? plugins_dir : plugins_dir + "/"
                stats = fs.lstatSync(plugins_dir + file_name)
            } catch (e) {
                logger.error("Plugin Registry: " + err + "\nSkipping...")
                return
            }

            // ignore plugin if the file has 'disabled' in the name
            if (REGEX_DISABLED_PLUGIN.test(file_name.toLowerCase())) {
                logger.info("Plugin Registry: " + file_name + " is disabled, skipping")
                return
            }

            // to store data about each plugin
            let plugin_func, plugin_name, plugin_path

            // handle both plugin files (single .js files) and directories (should contain a
            // standard-compliant plugin.js file)
            if (stats.isFile()) {
                if (!REGEX_IS_JS_FILE.test(file_name)) {
                    // if this file isnt a js file, skip
                    return 
                }

                plugin_name = file_name.split(".js")[0]
                plugin_path = plugins_dir + file_name
            } else {
                plugin_name = file_name
                plugin_path = plugins_dir + file_name + "/plugin.js"
            }

            // replace all invalid characters with underscore
            plugin_name = plugin_name.replace(REGEX_CHARACTERS_REPLACE_WITH_UNDERSCORE, "_")

            if (!plugin_name) {
                logger.info("Plugin Registry: " + file_name + " is not a valid plugin name, skipping")
                return
            }

            // make sure the plugin name is unique
            if (ACTIVE_PLUGINS.hasOwnProperty(plugin_name)) {
                logger.error("A plugin with name " + plugin_name + " has already been registered. Duplicate addition has been skipped.")
                return
            }

            // attempt to load the plugin file
            try {
                plugin_func = require(plugin_path)
            } catch (e) {
                logger.error("Error registering plugin " + plugin_name + ": " + e)
                return
            }

            // file appears to have been loaded, store data resulting from plugin's 
            // register function call
            // this may be undefined, store it anyway so we can keep track of which
            // plugins are loaded and what they've returned
            new_plugins[plugin_name] = plugin_func.call(null, plugin_api)
        }) // close files.map
        resolve(new_plugins)
    }) // close readdir
})
